
import React, { useState } from 'react';
import { PendingGift, Workshop } from '../types';
import { useUser } from '../context/UserContext';
import { CloseIcon, UserIcon, BanknotesIcon, SaveIcon, RefundIcon } from './icons';
import { toEnglishDigits } from '../utils';

interface ManagePendingGiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    gift: PendingGift;
    workshop: Workshop;
    onSuccess: (message: string) => void;
}

const ManagePendingGiftModal: React.FC<ManagePendingGiftModalProps> = ({ isOpen, onClose, gift, workshop, onSuccess }) => {
    const { updatePendingGift, deletePendingGift, updateUser, users } = useUser();
    const [activeTab, setActiveTab] = useState<'edit' | 'refund'>('edit');
    
    // Edit State
    const [newName, setNewName] = useState(gift.recipientName);
    const [newPhone, setNewPhone] = useState(gift.recipientWhatsapp.replace(/^\+/, ''));

    // Refund State
    const [refundType, setRefundType] = useState<'credit' | 'cash'>('credit');

    if (!isOpen) return null;

    const handleUpdateRecipient = () => {
        const formattedPhone = newPhone.trim().startsWith('+') ? newPhone : `+${newPhone.trim()}`;
        updatePendingGift(gift.id, {
            recipientName: newName,
            recipientWhatsapp: formattedPhone
        });
        onSuccess('تم تحديث بيانات المستلم بنجاح.');
        onClose();
    };

    const handleRefund = () => {
        if (refundType === 'credit') {
            if (!gift.gifterUserId) {
                alert('لا يمكن تحويل الرصيد لعدم وجود حساب للمرسل.');
                return;
            }
            const gifter = users.find(u => u.id === gift.gifterUserId);
            if (gifter) {
                 const newCredit = (gifter.internalCredit || 0) + gift.pricePaid;
                 const newTx = {
                    id: `tx-${Date.now()}`,
                    date: new Date().toISOString(),
                    type: 'addition' as const,
                    amount: gift.pricePaid,
                    description: `استرجاع هدية معلقة (المستلم: ${gift.recipientName}) - ورشة: ${workshop.title}`
                };
                updateUser(gifter.id, {
                    internalCredit: newCredit,
                    creditTransactions: [...(gifter.creditTransactions || []), newTx]
                });
                deletePendingGift(gift.id);
                onSuccess(`تم تحويل مبلغ ${gift.pricePaid} درهم إلى رصيد المرسل (${gifter.fullName}).`);
                onClose();
            } else {
                alert('لم يتم العثور على حساب المرسل.');
            }
        } else {
             // Cash refund
             deletePendingGift(gift.id);
             onSuccess('تم إلغاء الهدية (استرجاع مالي). يرجى التأكد من إعادة المبلغ للمرسل.');
             onClose();
        }
    };

    const inputClass = "w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-colors text-sm";
    const labelClass = "block text-xs font-bold text-purple-300 mb-1.5";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[80] p-4">
            <div className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-md border border-purple-500/50 flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-purple-500/30">
                    <h2 className="text-lg font-bold text-purple-300">إدارة الهدية المعلقة</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-5 h-5" /></button>
                </header>

                <div className="flex border-b border-purple-500/30">
                    <button 
                        onClick={() => setActiveTab('edit')} 
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'edit' ? 'bg-purple-500/20 text-white border-b-2 border-purple-500' : 'text-slate-400 hover:text-white'}`}
                    >
                        تغيير المستلم
                    </button>
                    <button 
                        onClick={() => setActiveTab('refund')} 
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'refund' ? 'bg-purple-500/20 text-white border-b-2 border-purple-500' : 'text-slate-400 hover:text-white'}`}
                    >
                        استرجاع / رصيد
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-black/20 p-3 rounded-lg border border-slate-700 text-xs text-slate-300 mb-4">
                        <p><strong>المرسل:</strong> {gift.gifterName}</p>
                        <p><strong>الورشة:</strong> {workshop.title}</p>
                        <p><strong>القيمة:</strong> {gift.pricePaid} درهم</p>
                    </div>

                    {activeTab === 'edit' ? (
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>اسم المستلم الجديد</label>
                                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>رقم واتساب المستلم الجديد</label>
                                <input 
                                    type="tel" 
                                    value={newPhone} 
                                    onChange={e => setNewPhone(toEnglishDigits(e.target.value).replace(/[^0-9+]/g, ''))} 
                                    className={`${inputClass} ltr-input`}
                                    placeholder="97150xxxxxxx"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">يرجى كتابة الرقم مع مفتاح الدولة (مثال: 97150...)</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <label className={labelClass}>نوع الاسترجاع</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setRefundType('credit')}
                                    className={`p-3 rounded-lg border text-sm font-bold transition-all flex flex-col items-center gap-2 ${refundType === 'credit' ? 'bg-green-500/20 border-green-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    <BanknotesIcon className="w-5 h-5"/>
                                    <span>احتفاظ كرصيد</span>
                                </button>
                                <button 
                                    onClick={() => setRefundType('cash')}
                                    className={`p-3 rounded-lg border text-sm font-bold transition-all flex flex-col items-center gap-2 ${refundType === 'cash' ? 'bg-red-500/20 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                                >
                                    <RefundIcon className="w-5 h-5"/>
                                    <span>استرجاع مالي</span>
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 bg-black/20 p-2 rounded">
                                {refundType === 'credit' 
                                    ? `سيتم إضافة ${gift.pricePaid} درهم إلى رصيد المرسل (${gift.gifterName}) وحذف الهدية المعلقة.` 
                                    : 'سيتم حذف الهدية المعلقة وتسجيلها كعملية استرجاع مالي (يتطلب إعادة المبلغ يدوياً).'}
                            </p>
                        </div>
                    )}
                </div>

                <footer className="p-4 flex justify-end gap-3 border-t border-purple-500/30">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-sm font-bold">إلغاء</button>
                    {activeTab === 'edit' ? (
                        <button 
                            onClick={handleUpdateRecipient}
                            className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold flex items-center gap-2"
                        >
                            <SaveIcon className="w-4 h-4" />
                            حفظ التعديلات
                        </button>
                    ) : (
                        <button 
                            onClick={handleRefund}
                            className={`px-4 py-2 rounded-md text-white text-sm font-bold flex items-center gap-2 ${refundType === 'credit' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}
                        >
                            {refundType === 'credit' ? <SaveIcon className="w-4 h-4" /> : <RefundIcon className="w-4 h-4" />}
                            تأكيد {refundType === 'credit' ? 'تحويل الرصيد' : 'الاسترجاع'}
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default ManagePendingGiftModal;
