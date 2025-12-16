
import React, { useState } from 'react';
import { Workshop, User, Subscription } from '../types';
import { CloseIcon, RefundIcon, SaveIcon, BanknotesIcon } from './icons';
import { useUser } from '../context/UserContext';

interface ManageDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  donor: User;
  subscription: Subscription;
  workshop: Workshop;
  onSuccess: (message: string) => void;
}

const ManageDonationModal: React.FC<ManageDonationModalProps> = ({ isOpen, onClose, donor, subscription, workshop, onSuccess }) => {
  const { updateSubscription, updateWorkshop, workshops, updateUser } = useUser();
  const [seatsToRefund, setSeatsToRefund] = useState(1);
  const [refundMethod, setRefundMethod] = useState<'cash' | 'credit'>('cash'); // cash = refund money, credit = keep for later

  if (!isOpen) return null;

  // Calculate Unit Price
  const unitPrice = workshop.packages?.[0]?.discountPrice ?? workshop.packages?.[0]?.price ?? workshop.price ?? 0;
  const currentBalance = subscription.donationRemaining || 0;
  const currentSeats = unitPrice > 0 ? Math.floor(currentBalance / unitPrice) : 0;

  const handleConfirm = () => {
    const amountToDeduct = seatsToRefund * unitPrice;

    if (amountToDeduct > currentBalance) {
        alert('المبلغ المراد استرجاعه أكبر من الرصيد المتبقي.');
        return;
    }

    // 1. Update Subscription Balance (Always reduce donation balance)
    const newSubBalance = currentBalance - amountToDeduct;
    const actionNote = refundMethod === 'credit' 
        ? `[تحويل لرصيد]: تم تحويل ${seatsToRefund} مقاعد بقيمة ${amountToDeduct} إلى رصيد المستخدم.` 
        : `[استرجاع]: تم استرجاع ${seatsToRefund} مقاعد بقيمة ${amountToDeduct}.`;

    updateSubscription(donor.id, subscription.id, {
        donationRemaining: newSubBalance,
        notes: (subscription.notes || '') + `\n${actionNote}`
    });

    // 2. Update Global Workshop Fund Balance (Always reduce fund)
    const currentWorkshop = workshops.find(w => w.id === workshop.id);
    if (currentWorkshop) {
        const newWorkshopBalance = Math.max(0, (currentWorkshop.payItForwardBalance || 0) - amountToDeduct);
        updateWorkshop({ ...currentWorkshop, payItForwardBalance: newWorkshopBalance });
    }

    // 3. Handle Credit Logic if selected
    if (refundMethod === 'credit') {
        const newCredit = (donor.internalCredit || 0) + amountToDeduct;
        const newTx = {
            id: `tx-${Date.now()}`,
            date: new Date().toISOString(),
            type: 'addition' as const,
            amount: amountToDeduct,
            description: `استرجاع من صندوق دعم ورشة: ${workshop.title} (احتفاظ لوقت لاحق)`
        };
        const currentTxs = donor.creditTransactions || [];
        // Assuming updateUser handles partial updates
        updateUser(donor.id, { 
            internalCredit: newCredit,
            // We pass the full new array if updateUser overwrites, or partial if it merges. 
            // Based on context implementation, it overwrites specific fields.
            creditTransactions: [...currentTxs, newTx] 
        });
    }

    onSuccess(refundMethod === 'credit' 
        ? `تم تحويل قيمة ${seatsToRefund} مقاعد إلى رصيد المتبرع بنجاح.` 
        : `تم استرجاع قيمة ${seatsToRefund} مقاعد بنجاح.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[80] p-4">
      <div 
        className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-md border border-pink-500/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 flex justify-between items-center border-b border-pink-500/30">
          <h2 className="text-lg font-bold text-pink-300">إدارة تذاكر التبرع</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-5 h-5" /></button>
        </header>

        <div className="p-6 space-y-6">
            <div className="bg-black/20 p-4 rounded-lg border border-slate-700/50 text-sm">
                <p className="mb-1"><span className="text-slate-400">المتبرع:</span> <strong>{donor.fullName}</strong></p>
                <p className="mb-1"><span className="text-slate-400">الورشة:</span> <strong>{workshop.title}</strong></p>
                <p className="mb-1"><span className="text-slate-400">قيمة المقعد:</span> <strong>{unitPrice} درهم</strong></p>
                <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center">
                    <span className="text-slate-300">الرصيد الحالي بالصندوق:</span>
                    <span className="text-green-400 font-bold">{currentSeats} مقاعد ({currentBalance} درهم)</span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">كم عدد التذاكر التي يريد استرجاعها؟</label>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setSeatsToRefund(Math.max(1, seatsToRefund - 1))}
                        className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 font-bold text-xl"
                    >-</button>
                    <span className="text-2xl font-bold w-12 text-center">{seatsToRefund}</span>
                    <button 
                        onClick={() => setSeatsToRefund(Math.min(currentSeats, seatsToRefund + 1))}
                        className="w-10 h-10 rounded-lg bg-pink-600 hover:bg-pink-500 font-bold text-xl"
                    >+</button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                    القيمة: <span className="text-white font-bold">{(seatsToRefund * unitPrice).toFixed(2)} درهم</span>
                </p>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">ماذا تريد أن تفعل بالقيمة؟</label>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setRefundMethod('cash')}
                        className={`p-3 rounded-lg border text-sm font-bold transition-all flex flex-col items-center gap-2 ${refundMethod === 'cash' ? 'bg-red-500/20 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                        <RefundIcon className="w-5 h-5"/>
                        <span>استرجاع مالي</span>
                    </button>
                    <button 
                        onClick={() => setRefundMethod('credit')}
                        className={`p-3 rounded-lg border text-sm font-bold transition-all flex flex-col items-center gap-2 ${refundMethod === 'credit' ? 'bg-green-500/20 border-green-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                        <BanknotesIcon className="w-5 h-5"/>
                        <span>احتفاظ كرصيد</span>
                    </button>
                </div>
                <p className="text-xs text-slate-400 mt-2 bg-black/20 p-2 rounded">
                    {refundMethod === 'cash' 
                        ? 'سيتم خصم المبلغ من الصندوق وتسجيله كمسترجع (يجب إعادته للمتبرع يدوياً).' 
                        : 'سيتم خصم المبلغ من الصندوق وإضافته لرصيد المتبرع في المنصة لاستخدامه لاحقاً.'}
                </p>
            </div>
        </div>

        <footer className="p-4 flex justify-end gap-3 border-t border-pink-500/30">
            <button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-sm font-bold">إلغاء</button>
            <button 
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-md text-white text-sm font-bold flex items-center gap-2 ${refundMethod === 'credit' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}
            >
                {refundMethod === 'credit' ? <SaveIcon className="w-4 h-4" /> : <RefundIcon className="w-4 h-4" />}
                {refundMethod === 'credit' ? 'تأكيد التحويل للرصيد' : 'تأكيد الاسترجاع'}
            </button>
        </footer>
      </div>
    </div>
  );
};

export default ManageDonationModal;
