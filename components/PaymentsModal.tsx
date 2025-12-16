import React, { useState } from 'react';
import { Workshop, Payment } from '../types';
import { CloseIcon, TrashIcon, PlusCircleIcon, SaveIcon } from './icons';
import { formatArabicDate, toEnglishDigits } from '../utils';

interface PaymentsModalProps {
    workshop: Workshop;
    initialPayments: Payment[];
    initialPercentage: number;
    onClose: () => void;
    onSave: (workshopId: number, data: { payments: Payment[]; percentage: number }) => void;
}

const PaymentsModal: React.FC<PaymentsModalProps> = ({ workshop, initialPayments, initialPercentage, onClose, onSave }) => {
    const [payments, setPayments] = useState<Payment[]>(initialPayments);
    const [percentage, setPercentage] = useState<number>(initialPercentage);
    
    // New payment form state
    const [newAmount, setNewAmount] = useState('');
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [newNotes, setNewNotes] = useState('');

    const handleAddPayment = () => {
        if (!newAmount || !newDate) {
            alert('Please enter amount and date.');
            return;
        }
        const newPayment: Payment = {
            id: `payment-${Date.now()}`,
            amount: parseFloat(toEnglishDigits(newAmount)),
            date: newDate,
            notes: newNotes,
        };
        setPayments(prev => [...prev, newPayment]);
        // Reset form
        setNewAmount('');
        setNewDate(new Date().toISOString().split('T')[0]);
        setNewNotes('');
    };
    
    const handleDeletePayment = (paymentId: string) => {
        setPayments(prev => prev.filter(p => p.id !== paymentId));
    };

    const handleSave = () => {
        onSave(workshop.id, { payments, percentage });
        onClose();
    };

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    const inputClass = "w-full p-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-sky-500 focus:border-sky-500 text-sm";
    const labelClass = "block mb-1 text-sm font-bold text-sky-300";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-70 p-4">
            <div className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-3xl border border-sky-500/50 max-h-[90vh] flex flex-col">
                <header className="p-4 flex justify-between items-center border-b border-sky-500/50 flex-shrink-0">
                    <h2 className="text-xl font-bold text-sky-300">إدارة دفعات المدربة</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
                </header>

                <div className="p-6 overflow-y-auto space-y-6">
                    <p className="font-bold">الورشة: <span className="text-white">{workshop.title}</span></p>
                    
                    <div className="bg-black/20 p-4 rounded-lg border border-slate-700">
                        <label className={labelClass}>نسبة المدربة (%)</label>
                        <input 
                            type="number" 
                            value={percentage} 
                            onChange={e => setPercentage(parseInt(e.target.value) || 0)}
                            className={inputClass + " w-24 text-center"}
                            min="0"
                            max="100"
                        />
                    </div>
                    
                    <div className="bg-black/20 p-4 rounded-lg border border-slate-700">
                        <h3 className="text-base font-bold text-white mb-3">سجل الدفعات (الإجمالي: {totalPaid.toFixed(2)})</h3>
                        <div className="max-h-60 overflow-y-auto pr-2">
                           {payments.length > 0 ? (
                                <table className="min-w-full text-sm">
                                    <thead className="text-xs text-sky-300 uppercase">
                                        <tr>
                                            <th className="p-2 text-right">التاريخ</th>
                                            <th className="p-2 text-center">المبلغ</th>
                                            <th className="p-2 text-right">ملاحظات</th>
                                            <th className="p-2 text-center">حذف</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {payments.map(p => (
                                            <tr key={p.id}>
                                                <td className="p-2">{formatArabicDate(p.date)}</td>
                                                <td className="p-2 text-center font-mono">{p.amount.toFixed(2)}</td>
                                                <td className="p-2">{p.notes || '-'}</td>
                                                <td className="p-2 text-center">
                                                    <button onClick={() => handleDeletePayment(p.id)} className="p-1 rounded-full text-red-400 hover:bg-red-500/20">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                           ) : (
                                <p className="text-center text-slate-400 py-4">لا توجد دفعات مسجلة.</p>
                           )}
                        </div>
                    </div>

                    <div className="bg-black/20 p-4 rounded-lg border border-slate-700">
                         <h3 className="text-base font-bold text-white mb-3">إضافة دفعة جديدة</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className={labelClass}>التاريخ</label>
                                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className={inputClass} />
                            </div>
                             <div>
                                <label className={labelClass}>المبلغ</label>
                                <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} className={inputClass} placeholder="0.00" />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>ملاحظات</label>
                                <input type="text" value={newNotes} onChange={e => setNewNotes(e.target.value)} className={inputClass} />
                            </div>
                             <button type="button" onClick={handleAddPayment} className="py-2 px-4 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm h-fit flex items-center justify-center gap-x-2">
                                <PlusCircleIcon className="w-5 h-5"/>
                                <span>إضافة</span>
                            </button>
                         </div>
                    </div>

                </div>

                <footer className="p-4 flex justify-end gap-4 border-t border-sky-500/50 flex-shrink-0">
                    <button onClick={onClose} className="py-2 px-6 rounded-md bg-slate-600 hover:bg-slate-500 transition-colors text-white font-bold text-sm">إلغاء</button>
                    <button onClick={handleSave} className="py-2 px-6 rounded-md bg-sky-600 hover:bg-sky-500 transition-colors text-white font-bold text-sm flex items-center gap-x-2">
                       <SaveIcon className="w-5 h-5"/>
                       <span>حفظ التغييرات</span>
                    </button>
                </footer>
            </div>
            <style>{`.z-70 { z-index: 70; }`}</style>
        </div>
    );
};

export default PaymentsModal;
