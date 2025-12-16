import React, { useState, useMemo } from 'react';
import { CloseIcon, ChevronDownIcon, BanknotesIcon, ArrowCircleUpIcon, ArrowCircleDownIcon, TrashIcon, RestoreIcon } from './icons';
import { useUser } from '../context/UserContext';
import { User, CreditTransaction as CreditTransactionType } from '../types';
import { formatArabicDate } from '../utils';
import { ConfirmationModal } from './ConfirmationModal';

interface CreditBalancesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreditTransaction extends CreditTransactionType {
  runningBalance: number;
}

interface UserCreditHistory {
  user: User;
  transactions: CreditTransaction[];
  totalAdded: number;
  totalUsed: number;
  currentBalance: number;
}

const CreditBalancesModal: React.FC<CreditBalancesModalProps> = ({ isOpen, onClose }) => {
  const { users, deleteCreditTransaction, restoreCreditTransaction, permanentlyDeleteCreditTransaction } = useUser();
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [expandedUserTabs, setExpandedUserTabs] = useState<Record<number, 'active' | 'trash'>>({});
  const [confirmationState, setConfirmationState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; } | null>(null);

  const creditData = useMemo((): UserCreditHistory[] => {
    const userHistories: UserCreditHistory[] = [];

    users.forEach(user => {
        if (!user.creditTransactions && (user.internalCredit || 0) === 0) {
            return;
        }

        const transactions: { date: string; type: 'addition' | 'subtraction'; amount: number; description: string, id: string, isDeleted?: boolean }[] = user.creditTransactions?.map(t => ({
            id: t.id,
            date: t.date,
            type: t.type,
            amount: t.amount,
            description: t.description,
            isDeleted: t.isDeleted,
        })) || [];
        
        transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let runningBalance = 0;
        const transactionsWithBalance: CreditTransaction[] = transactions.map(t => {
            if (!t.isDeleted) {
              runningBalance += (t.type === 'addition' ? t.amount : -t.amount);
            }
            return { ...t, runningBalance };
        }).reverse(); // Most recent first
        
        const totalAdded = transactions.filter(t => t.type === 'addition' && !t.isDeleted).reduce((sum, t) => sum + t.amount, 0);
        const totalUsed = transactions.filter(t => t.type === 'subtraction' && !t.isDeleted).reduce((sum, t) => sum + t.amount, 0);

        userHistories.push({
            user,
            transactions: transactionsWithBalance,
            totalAdded,
            totalUsed,
            currentBalance: user.internalCredit || 0,
        });
    });

    return userHistories.sort((a, b) => b.currentBalance - a.currentBalance);
  }, [users]);


  if (!isOpen) return null;

  const totalCredit = creditData.reduce((sum, data) => sum + data.currentBalance, 0);
  
  const handleToggle = (userId: number) => {
    setExpandedUserId(prev => prev === userId ? null : userId);
  };
  
  const handleToggleTab = (userId: number, tab: 'active' | 'trash') => {
    setExpandedUserTabs(prev => ({ ...prev, [userId]: tab }));
  };
  
  const handleSoftDelete = (user: User, transaction: CreditTransactionType) => {
    setConfirmationState({
        isOpen: true,
        title: 'نقل إلى سلة المهملات',
        message: `هل أنت متأكد من نقل هذه الحركة المالية بقيمة (${transaction.amount.toFixed(2)}) إلى سلة المهملات؟ سيتم تحديث رصيد المستخدم.`,
        onConfirm: () => {
            deleteCreditTransaction(user.id, transaction.id);
            setConfirmationState(null);
        }
    });
  };

  const handleRestore = (user: User, transactionId: string) => {
    restoreCreditTransaction(user.id, transactionId);
  };

  const handlePermanentDelete = (user: User, transaction: CreditTransactionType) => {
    setConfirmationState({
      isOpen: true,
      title: 'حذف نهائي',
      message: `هل أنت متأكد من حذف هذه الحركة المالية نهائياً؟ لا يمكن التراجع عن هذا الإجراء وسيتم تحديث رصيد المستخدم.`,
      onConfirm: () => {
        permanentlyDeleteCreditTransaction(user.id, transaction.id);
        setConfirmationState(null);
      },
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-70 p-4">
        <div className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-4xl border border-yellow-500/50 max-h-[90vh] flex flex-col">
          <header className="p-4 flex justify-between items-center border-b border-yellow-500/50 flex-shrink-0">
            <h2 className="text-xl font-bold text-yellow-300">تفاصيل أرصدة المستخدمين</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
          </header>
          <div className="p-6 overflow-y-auto">
              <div className="bg-black/20 p-4 rounded-xl mb-6 text-center border-2 border-slate-700 flex items-center justify-center gap-x-4">
                  <BanknotesIcon className="w-10 h-10 text-yellow-300"/>
                  <div>
                      <p className="text-sm font-bold text-slate-300">إجمالي الأرصدة المتاحة لجميع المستخدمين</p>
                      <p className="text-3xl font-extrabold text-white">{totalCredit.toFixed(2)}</p>
                  </div>
              </div>
              <div className="space-y-3">
                {creditData.map(({ user, transactions, currentBalance, totalAdded, totalUsed }) => {
                  const isExpanded = expandedUserId === user.id;
                  const activeTab = expandedUserTabs[user.id] || 'active';
                  const tabTransactions = transactions.filter(t => activeTab === 'active' ? !t.isDeleted : t.isDeleted);
                  return (
                    <div key={user.id} className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden transition-all duration-300">
                      <button onClick={() => handleToggle(user.id)} className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/30">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{user.fullName}</p>
                          <p className="text-xs text-slate-400 truncate">{user.phone}</p>
                        </div>
                        <div className="text-right mx-4 flex-shrink-0">
                            <p className="text-xs text-slate-300">الرصيد الحالي</p>
                            <p className="font-mono font-bold text-lg text-yellow-300">{currentBalance.toFixed(2)}</p>
                        </div>
                        <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
                          <div className="p-4 border-t border-slate-700/50 space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-green-500/10 p-2 rounded-lg">
                                    <p className="text-xs text-green-300 font-bold">إجمالي المضاف</p>
                                    <p className="text-base font-bold">{totalAdded.toFixed(2)}</p>
                                </div>
                                <div className="bg-red-500/10 p-2 rounded-lg">
                                    <p className="text-xs text-red-300 font-bold">إجمالي المستخدم</p>
                                    <p className="text-base font-bold">{totalUsed.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="border-b border-slate-700">
                                <nav className="-mb-px flex space-x-4">
                                    <button onClick={() => handleToggleTab(user.id, 'active')} className={`px-3 py-1.5 text-xs font-bold rounded-t-md ${activeTab === 'active' ? 'bg-slate-700/50 text-white' : 'hover:bg-slate-700/30'}`}>سجل الحركات</button>
                                    <button onClick={() => handleToggleTab(user.id, 'trash')} className={`px-3 py-1.5 text-xs font-bold rounded-t-md ${activeTab === 'trash' ? 'bg-slate-700/50 text-white' : 'hover:bg-slate-700/30'}`}>سلة المهملات</button>
                                </nav>
                            </div>

                            {tabTransactions.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-white">
                                  <thead className="text-xs text-yellow-300 uppercase"><tr>
                                    <th className="py-2 px-2 text-right">التاريخ</th><th className="py-2 px-2 text-right">الوصف</th><th className="py-2 px-2 text-center">المبلغ</th><th className="py-2 px-2 text-center">الإجراءات</th>
                                  </tr></thead>
                                  <tbody className="divide-y divide-slate-700/50">
                                    {tabTransactions.map((t) => (
                                      <tr key={t.id}>
                                        <td className="py-2 px-2 whitespace-nowrap">{formatArabicDate(t.date)}</td>
                                        <td className="py-2 px-2">{t.description}</td>
                                        <td className={`py-2 px-2 font-mono text-center font-bold flex items-center justify-center gap-x-1 ${t.type === 'addition' ? 'text-green-400' : 'text-red-400'}`}>
                                          {t.type === 'addition' ? <ArrowCircleUpIcon className="w-5 h-5"/> : <ArrowCircleDownIcon className="w-5 h-5"/>}
                                          <span>{t.amount.toFixed(2)}</span>
                                        </td>
                                        <td className="py-2 px-2 text-center">
                                          {activeTab === 'active' ? (
                                              <button onClick={() => handleSoftDelete(user, t)} className="p-2 rounded-full text-slate-400 hover:bg-red-500/20 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                                          ) : (
                                              <div className="flex items-center justify-center gap-x-2">
                                                  <button onClick={() => handleRestore(user, t.id)} className="p-2 rounded-full text-slate-400 hover:bg-green-500/20 hover:text-green-400"><RestoreIcon className="w-5 h-5"/></button>
                                                  <button onClick={() => handlePermanentDelete(user, t)} className="p-2 rounded-full text-slate-400 hover:bg-red-500/20 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                                              </div>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-center text-slate-400 p-4">{activeTab === 'active' ? 'لا يوجد سجل حركات لهذا المستخدم.' : 'سلة المهملات فارغة.'}</p>
                            )}
                          </div>
                      </div>
                    </div>
                  )
                })}
                {creditData.length === 0 && (
                  <p className="text-center text-slate-400 p-8">لا يوجد مستخدمون لديهم رصيد أو سجل حركات.</p>
                )}
              </div>
          </div>
        </div>
        <style>{`.z-70 { z-index: 70; }`}</style>
      </div>
      {confirmationState?.isOpen && (
          <ConfirmationModal
              isOpen={true}
              onClose={() => setConfirmationState(null)}
              title={confirmationState.title}
              message={confirmationState.message}
              onConfirm={confirmationState.onConfirm}
          />
      )}
    </>
  );
};

export default CreditBalancesModal;