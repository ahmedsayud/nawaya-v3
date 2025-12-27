import React, { useState, useEffect } from 'react';
import { CloseIcon, CalendarIcon, CheckCircleIcon, WhatsAppIcon } from './icons';
import { useUser } from '../context/UserContext';
import { ConsultationRequest, User } from '../types';
import { normalizePhoneNumber } from '../utils';

interface ConsultationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ConsultationRequest | null;
}

const ConsultationDetailsModal: React.FC<ConsultationDetailsModalProps> = ({ isOpen, onClose, request }) => {
  const { users, drhopeData, updateConsultationRequest } = useUser();
  
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState<number>(0);
  const [fee, setFee] = useState<number>(0);

  useEffect(() => {
    if (request) {
      setDate(request.consultationDate || '');
      setTime(request.consultationTime || '');
      setDuration(request.durationMinutes || drhopeData.consultationSettings?.defaultDurationMinutes || 50);
      setFee(request.fee || drhopeData.consultationSettings?.defaultFee || 450);
    }
  }, [request, drhopeData.consultationSettings]);

  if (!isOpen || !request) return null;

  const user = users.find(u => u.id === request.userId);

  const handleUpdate = (newStatus?: 'APPROVED' | 'COMPLETED' | 'PAID') => {
    const updates: Partial<Omit<ConsultationRequest, 'id' | 'userId' | 'requestedAt'>> = {
      consultationDate: date,
      consultationTime: time,
      durationMinutes: duration,
      fee: fee,
    };
    if (newStatus) {
      updates.status = newStatus;
    }
    updateConsultationRequest(request.id, updates);
    onClose();
  };

  const inputClass = "w-full p-2 bg-indigo-900/40 border border-slate-600 rounded-md focus:ring-fuchsia-500 focus:border-fuchsia-500 text-sm";
  const labelClass = "block mb-1 text-xs font-bold text-fuchsia-300";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-70 p-4">
      <div className="bg-theme-gradient backdrop-blur-lg text-white rounded-lg shadow-2xl w-full max-w-2xl border border-fuchsia-500/80 max-h-[90vh] flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-fuchsia-500/50">
          <h2 className="text-lg font-bold">تفاصيل طلب الاستشارة</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
        </header>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-black/20 p-4 rounded-lg">
            <div>
              <p><strong className="text-fuchsia-300">المشترك:</strong> {user?.fullName}</p>
              {user?.phone && (
                  <a href={`https://wa.me/${normalizePhoneNumber(user.phone)}`} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-400 hover:underline flex items-center gap-x-2 mt-1">
                      <WhatsAppIcon className="w-4 h-4" />
                      <span>{user.phone.replace(/^\+/, '')}</span>
                  </a>
              )}
            </div>
            <p className="mt-2"><strong className="text-fuchsia-300">الموضوع:</strong> {request.subject}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>تاريخ الاستشارة</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>وقت الاستشارة</label><input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>المدة (بالدقائق)</label><input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value))} className={inputClass} /></div>
            <div><label className={labelClass}>الرسوم (درهم)</label><input type="number" value={fee} onChange={e => setFee(parseFloat(e.target.value))} className={inputClass} /></div>
          </div>
        </div>

        <footer className="p-4 flex justify-between items-center border-t border-fuchsia-500/50">
          <div>
            {request.status === 'PENDING_PAYMENT' && (
              <button onClick={() => handleUpdate('PAID')} className="py-2 px-4 rounded-md bg-green-600 hover:bg-green-500 text-white font-bold text-sm flex items-center gap-x-2">
                <CheckCircleIcon className="w-5 h-5"/>
                <span>تأكيد استلام الدفعة</span>
              </button>
            )}
          </div>
          <div className="flex gap-x-4">
            <button onClick={() => handleUpdate()} className="py-2 px-4 rounded-md bg-slate-600 hover:bg-slate-500 text-white font-bold text-sm">حفظ التغييرات</button>
            {request.status === 'NEW' && (
              <button onClick={() => handleUpdate('APPROVED')} className="py-2 px-4 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm">موافقة وإرسال للمستخدم</button>
            )}
            {(request.status === 'APPROVED' || request.status === 'PAID') && (
              <button onClick={() => handleUpdate('COMPLETED')} className="py-2 px-4 rounded-md bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-sm">تحديد كمكتملة</button>
            )}
          </div>
        </footer>
      </div>
       <style>{`.z-70 { z-index: 70; }`}</style>
    </div>
  );
};

export default ConsultationDetailsModal;
