import React, { useState, useEffect } from 'react';
import { User, Subscription } from '../types';
import { useUser } from '../context/UserContext';
import { CloseIcon } from './icons';

interface TransferWorkshopModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  subscription: Subscription;
  onConfirm: (userId: number, subscriptionId: string, toWorkshopId: number, notes: string) => void;
}

const TransferWorkshopModal: React.FC<TransferWorkshopModalProps> = ({
  isOpen,
  onClose,
  user,
  subscription,
  onConfirm,
}) => {
  const { workshops } = useUser();
  const [targetWorkshopId, setTargetWorkshopId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [priceDifference, setPriceDifference] = useState<number | null>(null);
  const [targetWorkshopPrice, setTargetWorkshopPrice] = useState<number | null>(null);

  useEffect(() => {
    if (targetWorkshopId) {
      const targetWorkshop = workshops.find(w => w.id === parseInt(targetWorkshopId, 10));
      const currentAmountPaid = subscription.pricePaid ?? 0;
      const newPrice = targetWorkshop?.price ?? targetWorkshop?.packages?.[0]?.price ?? 0;
      
      setTargetWorkshopPrice(newPrice);
      setPriceDifference(currentAmountPaid - newPrice);
    } else {
      setPriceDifference(null);
      setTargetWorkshopPrice(null);
    }
  }, [targetWorkshopId, workshops, subscription.pricePaid]);

  if (!isOpen) return null;

  const currentWorkshop = workshops.find(w => w.id === subscription.workshopId);
  const availableWorkshops = workshops.filter(w => !w.isDeleted && w.id !== subscription.workshopId);

  const handleConfirm = () => {
    if (targetWorkshopId) {
      let finalNotes = notes;
      if (priceDifference !== null && priceDifference !== 0) {
        let autoNote = '';
        if (priceDifference < 0) {
          autoNote = `[ملاحظة تلقائية] يوجد فرق سعر مستحق على المشترك بقيمة ${Math.abs(priceDifference).toFixed(2)}.`;
        } else {
          autoNote = `[ملاحظة تلقائية] تم إضافة فرق السعر ${priceDifference.toFixed(2)} إلى الرصيد الداخلي للمشترك.`;
        }
        finalNotes = [notes, autoNote].filter(Boolean).join('\n\n');
      }
      onConfirm(user.id, subscription.id, parseInt(targetWorkshopId, 10), finalNotes);
      onClose();
    }
  };

  const inputClass = "w-full p-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm text-white font-bold";

  const renderPriceDifference = () => {
    if (priceDifference === null || targetWorkshopPrice === null) return null;
    
    let colorClass = 'text-white';
    let differenceText = '';

    if (priceDifference < 0) {
      colorClass = 'text-red-400';
      differenceText = 'مبلغ مستحق على المشترك';
    } else if (priceDifference > 0) {
      colorClass = 'text-green-400';
      differenceText = 'سيتم إضافة الفرق إلى رصيد المشترك الداخلي';
    }

    return (
      <div className="mt-4 p-4 bg-black/20 rounded-lg border border-slate-700 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>المبلغ المدفوع سابقًا:</span>
          <span className="font-bold">{subscription.pricePaid?.toFixed(2) ?? '0.00'}</span>
        </div>
        <div className="flex justify-between">
          <span>سعر الورشة الجديدة:</span>
          <span className="font-bold">{targetWorkshopPrice.toFixed(2)}</span>
        </div>
        <div className={`flex justify-between font-bold pt-2 border-t border-slate-600 ${colorClass}`}>
          <span>فرق السعر:</span>
          <span>{priceDifference !== 0 ? Math.abs(priceDifference).toFixed(2) : '0.00'}</span>
        </div>
        {differenceText && <p className={`text-xs text-center pt-2 font-semibold ${colorClass}`}>{differenceText}</p>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-70 p-4">
      <div className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-2xl border border-yellow-500/50 flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-yellow-500/50">
          <h2 className="text-xl font-bold text-yellow-300">تحويل اشتراك</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
        </header>
        <div className="p-6 space-y-6">
          <div className="text-sm font-bold">
            <p>المشترك: <span className="text-white">{user.fullName}</span></p>
            <p>الورشة الحالية: <span className="text-white">{currentWorkshop?.title}</span></p>
          </div>
          <div>
            <label className="block mb-1 text-sm font-bold text-yellow-300 tracking-wide">اختر الورشة الجديدة للتحويل إليها:</label>
            <select
              value={targetWorkshopId}
              onChange={(e) => setTargetWorkshopId(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>اختر ورشة...</option>
              {availableWorkshops.map(w => (
                <option key={w.id} value={w.id}>{w.title} - (السعر: {w.price?.toFixed(2) ?? 'N/A'})</option>
              ))}
            </select>
          </div>
          {renderPriceDifference()}
           <div>
            <label className="block mb-1 text-sm font-bold text-yellow-300 tracking-wide">ملاحظات (اختياري):</label>
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
                rows={2}
                placeholder="أضف ملاحظات حول عملية التحويل..."
            />
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
            disabled={!targetWorkshopId}
            className="py-2 px-6 rounded-md bg-yellow-600 hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm"
          >
            تأكيد التحويل
          </button>
        </footer>
      </div>
      <style>{`.z-70 { z-index: 70; }`}</style>
    </div>
  );
};

export default TransferWorkshopModal;
