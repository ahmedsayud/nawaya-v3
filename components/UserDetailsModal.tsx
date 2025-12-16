import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { CloseIcon, EyeIcon, WhatsAppIcon } from './icons';
import { User, Subscription, Workshop } from '../types';
import { toEnglishDigits, normalizePhoneNumber } from '../utils';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  userToEdit: User | null;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, onSuccess, userToEdit }) => {
  const { workshops, updateUser } = useUser();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  

  useEffect(() => {
    if (userToEdit) {
      setFullName(userToEdit.fullName);
      setEmail(userToEdit.email);
      setPhone(userToEdit.phone.replace(/^\+/, ''));
      setError('');
    }
  }, [userToEdit]);
  
  if (!isOpen || !userToEdit) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone) {
        setError('جميع الحقول مطلوبة.');
        return;
    }
    setError('');
    const finalPhone = phone.trim();
    const phoneToSave = finalPhone.startsWith('+') ? finalPhone : `+${finalPhone.replace(/\+/g, '')}`;

    updateUser(userToEdit.id, { fullName, email, phone: phoneToSave });
    onSuccess('تم تحديث بيانات المستفيد بنجاح.');
    onClose();
  };
  
  const inputClass = "w-full p-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm text-white font-bold placeholder:text-slate-400/70";
  const labelClass = "block mb-1 text-sm font-bold text-yellow-300 tracking-wide";

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-70 p-4">
        <div className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-2xl border border-yellow-500/50 max-h-[90vh] flex flex-col">
          <header className="p-4 flex justify-between items-center border-b border-yellow-500/50 flex-shrink-0">
            <h2 className="text-xl font-bold text-yellow-300">تفاصيل المستفيد</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
          </header>
          <div className="overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <p className="text-red-400 font-bold text-center mb-4">{error}</p>}
              <div>
                <label className={labelClass}>الاسم الكامل</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>البريد الإلكتروني</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>رقم الهاتف (مع كود الدولة)</label>
                <div className="flex items-center gap-x-2">
                  <input type="tel" value={phone} onChange={e => setPhone(toEnglishDigits(e.target.value))} className={`${inputClass} ltr-input`} required />
                  <a
                    href={`https://wa.me/${normalizePhoneNumber(phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-green-500/20 rounded-md text-green-300 hover:bg-green-500/30 flex-shrink-0"
                    title="Chat on WhatsApp"
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                  </a>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                <button type="submit" className="py-2 px-4 rounded-md bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-sm">
                  حفظ التعديلات
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-yellow-500/30">
                <h3 className="text-base font-bold text-yellow-300 mb-4">اشتراكات المستخدم</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {userToEdit.subscriptions.length > 0 ? userToEdit.subscriptions.map(sub => {
                        const workshop = workshops.find(w => w.id === sub.workshopId);
                        if (!workshop) return null;
                        return (
                            <div key={sub.id} className="bg-slate-800/50 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-white">{workshop.title}</p>
                                    <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${workshop.isRecorded ? 'bg-purple-600/50 text-purple-200' : 'bg-sky-600/50 text-sky-200'}`}>
                                        {workshop.isRecorded ? 'مسجلة' : 'مباشرة'}
                                    </span>
                                </div>
                            </div>
                        );
                    }) : <p className="text-center text-slate-400">لا توجد اشتراكات لهذا المستخدم.</p>}
                </div>
            </div>
          </div>
        </div>
        <style>{`.z-70 { z-index: 70; }`}</style>
      </div>
    </>
  );
};

export default UserDetailsModal;