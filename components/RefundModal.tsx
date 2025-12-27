import React, { useState } from 'react';
import { User, Subscription } from '../types';
import { useUser } from '../context/UserContext';
import { CloseIcon } from './icons';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  subscription: Subscription;
  onConfirm: (userId: number, subscriptionId: string, refundMethod: string) => void;
}

const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  onClose,
  user,
  subscription,
  onConfirm,
}) => {
  const { workshops } = useUser();
  const [refundMethod, setRefundMethod] = useState('');

  if (!isOpen) return null;

  const currentWorkshop = workshops.find(w => w.id === subscription.workshopId);

  const handleConfirm = () => {
    if (refundMethod) {
      onConfirm(user.id, subscription.id, refundMethod);
      onClose();
    }
  };

  const inputClass = "w-full p-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm text-white font-bold";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-70 p-4">
      <div className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-lg border border-yellow-500/50 flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-yellow-500/50">
          <h2 className="text-xl font-bold text-yellow-300">معالجة استرداد مبلغ</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
        </header>
        <div className="p-6 space-y-6">
          <div className="text-sm font-bold">
            <p>المستخدم: <span className="text-white">{user.fullName}</span></p>
            <p>الورشة: <span className="text-white">{currentWorkshop?.title}</span></p>
            <p>المبلغ المدفوع: <span className="text-white">{subscription.pricePaid?.toFixed(2) || 'N/A'}</span></p>
          </div>
          <div>
            <label className="block mb-1 text-sm font-bold text-yellow-300 tracking-wide">اختر طريقة الاسترداد:</label>
            <select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>اختر طريقة...</option>
              <option value="كاش">كاش</option>
              <option value="تحويل بنكي">تحويل بنكي</option>
              <option value="رابط">رابط</option>
            </select>
          </div>
        </div>
        <footer className="p-4 flex justify-end gap-4 border-t border-yellow-500/50">
          <button
            onClick={onClose}
            className="py-2 px-6 rounded-md bg-slate-600 hover:bg-slate-500 transition-colors text-white font-bold text-sm"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            disabled={!refundMethod}
            className="py-2 px-6 rounded-md bg-yellow-600 hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm"
          >
            تأكيد الاسترداد
          </button>
        </footer>
      </div>
      <style>{`.z-70 { z-index: 70; }`}</style>
    </div>
  );
};

export default RefundModal;
