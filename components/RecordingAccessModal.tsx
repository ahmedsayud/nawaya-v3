import React, { useState, useEffect } from 'react';
import { User, Subscription } from '../types';
import { useUser } from '../context/UserContext';
import { CloseIcon, CalendarIcon } from './icons';

interface RecordingAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  subscription: Subscription;
  showToast: (message: string) => void;
}

const RecordingAccessModal: React.FC<RecordingAccessModalProps> = ({
  isOpen,
  onClose,
  user,
  subscription,
  showToast,
}) => {
  const { updateSubscription } = useUser();
  const [expiryDate, setExpiryDate] = useState(subscription.expiryDate);

  useEffect(() => {
    if (isOpen) {
      setExpiryDate(subscription.expiryDate);
    }
  }, [isOpen, subscription.expiryDate]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateSubscription(user.id, subscription.id, { expiryDate });
    showToast('تم تحديث تاريخ صلاحية المشاهدة بنجاح.');
    onClose();
  };
  
  const inputClass = "w-full p-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm text-white font-bold";
  const labelClass = "block mb-1 text-sm font-bold text-yellow-300 tracking-wide";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-70 p-4">
      <div className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-lg border border-yellow-500/50 flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-yellow-500/50">
          <h2 className="text-xl font-bold text-yellow-300">تحديد صلاحية المشاهدة</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
        </header>
        <div className="p-6 space-y-6">
            <p className="text-sm font-bold">المستخدم: <span className="text-white">{user.fullName}</span></p>
            <div>
                <label className={labelClass}>تاريخ انتهاء صلاحية المشاهدة</label>
                <div className="relative">
                    <input 
                        type="date" 
                        value={expiryDate} 
                        onChange={e => setExpiryDate(e.target.value)} 
                        className={`${inputClass} text-center`}
                    />
                     <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <CalendarIcon className="w-5 h-5 text-slate-400"/>
                    </div>
                </div>
            </div>
        </div>
        <footer className="p-4 flex justify-end gap-4 border-t border-yellow-500/50">
          <button onClick={onClose} className="py-2 px-6 rounded-md bg-slate-600 hover:bg-slate-500 transition-colors text-white font-bold text-sm">إلغاء</button>
          <button onClick={handleSave} className="py-2 px-6 rounded-md bg-yellow-600 hover:bg-yellow-500 transition-colors text-white font-bold text-sm">حفظ التغييرات</button>
        </footer>
      </div>
      <style>{`.z-70 { z-index: 70; }`}</style>
    </div>
  );
};

export default RecordingAccessModal;