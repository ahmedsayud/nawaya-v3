import React, { useMemo, useState } from 'react';
import { CloseIcon, RestoreIcon } from './icons';
// FIX: Add Package to types import.
import { User, Subscription, Workshop, Package } from '../types';
import { formatArabicDate } from '../utils';
import { useUser } from '../context/UserContext';
// FIX: Changed default import of ConfirmationModal to a named import.
import { ConfirmationModal } from './ConfirmationModal';

interface SubscriptionWithDetails {
    user: User;
    subscription: Subscription;
    workshop: Workshop;
    // FIX: Add optional pkg property to match type in TransfersPage.
    pkg?: Package;
}

interface RefundsStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: SubscriptionWithDetails[];
}

const RefundsStatsModal: React.FC<RefundsStatsModalProps> = ({ isOpen, onClose, subscriptions }) => {
  const { reactivateSubscription } = useUser();
  const [confirmationState, setConfirmationState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  if (!isOpen) return null;

  const totalRefundedAmount = useMemo(() => {
    return subscriptions.reduce((total, { subscription }) => total + (subscription.pricePaid || 0), 0);
  }, [subscriptions]);

  const handleReactivateClick = (user: User, subscription: Subscription, workshop: Workshop) => {
    setConfirmationState({
        isOpen: true,
        title: 'تأكيد إعادة التفعيل',
        message: `هل أنت متأكد من إعادة تفعيل اشتراك "${user.fullName}" في ورشة "${workshop.title}"؟`,
        onConfirm: () => {
            reactivateSubscription(user.id, subscription.id);
            closeConfirmationModal();
        },
    });
  };

  const closeConfirmationModal = () => setConfirmationState(prev => ({ ...prev, isOpen: false }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-70 p-4">
      <div className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-4xl border border-yellow-500/50 max-h-[90vh] flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-yellow-500/50 flex-shrink-0">
          <h2 className="text-xl font-bold text-yellow-300 tracking-wider">إحصائيات المبالغ المستردة</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
        </header>
        <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 <div className="bg-black/20 p-4 rounded-lg text-center">
                    <p className="text-white font-bold text-sm">إجمالي عدد المستردين</p>
                    <p className="text-2xl font-bold text-white">{subscriptions.length}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-lg text-center">
                    <p className="text-white font-bold text-sm">إجمالي المبالغ المستردة</p>
                    <p className="text-2xl font-bold text-white">{totalRefundedAmount.toFixed(2)}</p>
                </div>
            </div>
            <div className="overflow-x-auto">
                 <table className="min-w-full text-sm text-center text-white">
                    <thead className="text-yellow-300 uppercase tracking-wider font-bold text-sm">
                        <tr className="border-b-2 border-yellow-500/30 bg-black/20">
                            <th className="py-4 px-3 text-center">المستفيد</th>
                            <th className="py-4 px-3 text-center">رقم الهاتف</th>
                            <th className="py-4 px-3 text-center">الورشة</th>
                            <th className="py-4 px-3 text-center">المبلغ المسترد</th>
                            <th className="py-4 px-3 text-center">طريقة الاسترداد</th>
                            <th className="py-4 px-3 text-center">ملاحظات</th>
                            <th className="py-4 px-3 text-center">تاريخ الاسترداد</th>
                            <th className="py-4 px-3 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="font-bold">
                        {subscriptions.map(({ user, subscription, workshop }) => (
                            <tr key={subscription.id} className="border-b border-yellow-500/20 hover:bg-yellow-500/10">
                                <td className="py-4 px-3 text-center">{user.fullName}</td>
                                <td className="py-4 px-3 text-center">{user.phone}</td>
                                <td className="py-4 px-3 text-center">{workshop.title}</td>
                                <td className="py-4 px-3 text-center">{subscription.pricePaid?.toFixed(2) || 'N/A'}</td>
                                <td className="py-4 px-3 text-center">{subscription.refundMethod || '-'}</td>
                                <td className="py-4 px-3 text-white text-center">{subscription.notes || '-'}</td>
                                <td className="py-4 px-3 text-center">{subscription.refundDate ? formatArabicDate(subscription.refundDate) : 'غير محدد'}</td>
                                <td className="py-4 px-3 text-center">
                                    <button 
                                        onClick={() => handleReactivateClick(user, subscription, workshop)} 
                                        className="flex items-center gap-x-1 p-1.5 rounded-md text-white hover:bg-green-500/20 mx-auto" 
                                        title="إعادة تفعيل الاشتراك"
                                    >
                                        <RestoreIcon className="w-5 h-5" />
                                        <span>إعادة تفعيل</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {subscriptions.length === 0 && (
                            <tr><td colSpan={8} className="p-12 text-center text-white font-bold">لا توجد مبالغ مستردة.</td></tr>
                        )}
                    </tbody>
                 </table>
            </div>
        </div>
      </div>
      <ConfirmationModal isOpen={confirmationState.isOpen} onClose={closeConfirmationModal} onConfirm={confirmationState.onConfirm} title={confirmationState.title} message={confirmationState.message} confirmText="نعم، أعد التفعيل" />
      <style>{`.z-70 { z-index: 70; }`}</style>
    </div>
  );
};

export default RefundsStatsModal;
