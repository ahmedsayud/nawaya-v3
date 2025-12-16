import React, { useState, useEffect } from 'react';
import { Workshop, Recording } from '../types';
import { useUser } from '../context/UserContext';
import { CloseIcon, CalendarIcon } from './icons';

interface WorkshopRecordingAccessModalProps {
  workshop: Workshop;
  onClose: () => void;
  // FIX: Update the `showToast` prop type to accept an optional second argument for the toast type.
  showToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

const WorkshopRecordingAccessModal: React.FC<WorkshopRecordingAccessModalProps> = ({ workshop, onClose, showToast }) => {
  const { updateWorkshop } = useUser();
  const [recordings, setRecordings] = useState<Recording[]>(workshop.recordings || []);
  const [globalStartDate, setGlobalStartDate] = useState('');
  const [globalEndDate, setGlobalEndDate] = useState('');

  const handleApplyGlobalDates = () => {
    if (!globalStartDate || !globalEndDate) {
      showToast('يرجى تحديد تاريخي البدء والانتهاء', 'warning');
      return;
    }
    const updatedRecordings = recordings.map(rec => ({
      ...rec,
      accessStartDate: globalStartDate,
      accessEndDate: globalEndDate,
    }));
    setRecordings(updatedRecordings);
  };

  const handleRecordingDateChange = (index: number, field: 'accessStartDate' | 'accessEndDate', value: string) => {
    const updatedRecordings = [...recordings];
    updatedRecordings[index] = { ...updatedRecordings[index], [field]: value };
    setRecordings(updatedRecordings);
  };

  const handleSave = () => {
    updateWorkshop({ ...workshop, recordings });
    showToast('تم حفظ صلاحيات المشاهدة بنجاح.');
    onClose();
  };

  const labelClass = "block mb-1 text-xs font-bold text-yellow-300 tracking-wide";
  const inputClass = "w-full p-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm text-white font-bold text-center";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-70 p-4">
      <div className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-3xl border border-yellow-500/50 max-h-[90vh] flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-yellow-500/50">
          <h2 className="text-xl font-bold text-yellow-300">إدارة صلاحية التسجيلات</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
        </header>

        <div className="p-6 overflow-y-auto space-y-6">
          <p className="text-sm">ورشة: <span className="font-bold">{workshop.title}</span></p>
          
          <div className="bg-black/20 p-4 rounded-lg border border-slate-700">
            <h3 className="text-base font-bold text-white mb-3">تطبيق شامل للجميع</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className={labelClass}>تاريخ بدء الصلاحية</label>
                <input type="date" value={globalStartDate} onChange={e => setGlobalStartDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>تاريخ انتهاء الصلاحية</label>
                <input type="date" value={globalEndDate} onChange={e => setGlobalEndDate(e.target.value)} min={globalStartDate} className={inputClass} />
              </div>
              <button onClick={handleApplyGlobalDates} className="py-2 px-4 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm h-fit">تطبيق على الكل</button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">تحديد فردي لكل تسجيل</h3>
            {recordings.map((rec, index) => (
              <div key={index} className="bg-slate-800/50 p-3 rounded-lg flex flex-col md:flex-row items-center gap-4">
                <p className="flex-grow font-semibold truncate">{rec.name}</p>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">من:</label>
                  <input type="date" value={rec.accessStartDate || ''} onChange={e => handleRecordingDateChange(index, 'accessStartDate', e.target.value)} className={`${inputClass} w-40`} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">إلى:</label>
                  <input type="date" value={rec.accessEndDate || ''} onChange={e => handleRecordingDateChange(index, 'accessEndDate', e.target.value)} min={rec.accessStartDate} className={`${inputClass} w-40`} />
                </div>
              </div>
            ))}
            {recordings.length === 0 && <p className="text-center text-slate-400">لا توجد تسجيلات مضافة لهذه الورشة.</p>}
          </div>
        </div>

        <footer className="p-4 flex justify-end gap-4 border-t border-yellow-500/50">
          <button onClick={onClose} className="py-2 px-6 rounded-md bg-slate-600 hover:bg-slate-500 transition-colors text-white font-bold text-sm">إلغاء</button>
          <button onClick={handleSave} className="py-2 px-6 rounded-md bg-yellow-600 hover:bg-yellow-500 transition-colors text-white font-bold text-sm">حفظ الصلاحيات</button>
        </footer>
      </div>
      <style>{`.z-70 { z-index: 70; }`}</style>
    </div>
  );
};

export default WorkshopRecordingAccessModal;
