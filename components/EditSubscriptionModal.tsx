import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { CloseIcon, GiftIcon } from './icons';
import { Workshop, User, Subscription } from '../types';
import { toEnglishDigits } from '../utils';

interface EditSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  user: User;
  subscription: Subscription;
}

const EditSubscriptionModal: React.FC<EditSubscriptionModalProps> = ({ isOpen, onClose, onSuccess, user, subscription }) => {
  const { workshops, updateSubscription } = useUser();
  
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | undefined>(() => workshops.find(w => w.id === subscription.workshopId));
  const [selectedPackageId, setSelectedPackageId] = useState<string>(subscription.packageId?.toString() || '');
  const [paymentMethod, setPaymentMethod] = useState(subscription.paymentMethod || '');
  const [pricePaid, setPricePaid] = useState<number | string>(subscription.pricePaid ?? '');
  const [actualPrice, setActualPrice] = useState<number | string>('');
  const [transferrerName, setTransferrerName] = useState(subscription.transferrerName || '');
  const [notes, setNotes] = useState(subscription.notes || '');

  useEffect(() => {
    const workshop = workshops.find(w => w.id === subscription.workshopId);
    if (!selectedPackageId) {
        const price = workshop?.price ?? '';
        setActualPrice(price);
    } else {
        const pkg = workshop?.packages?.find(p => p.id === parseInt(selectedPackageId, 10));
        const price = pkg?.discountPrice ?? pkg?.price ?? '';
        setActualPrice(price);
    }
  }, [selectedPackageId, subscription.workshopId, workshops]);

  useEffect(() => {
    if (isOpen) {
        setSelectedWorkshop(workshops.find(w => w.id === subscription.workshopId));
        setSelectedPackageId(subscription.packageId?.toString() || '');
        setPaymentMethod(subscription.paymentMethod || '');
        setPricePaid(subscription.pricePaid ?? '');
        setTransferrerName(subscription.transferrerName || '');
        setNotes(subscription.notes || '');
    }
  }, [isOpen, subscription, workshops]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) {
      alert('يرجى اختيار طريقة دفع.');
      return;
    }

    updateSubscription(user.id, subscription.id, {
        packageId: selectedPackageId ? parseInt(selectedPackageId, 10) : undefined,
        paymentMethod: paymentMethod as any,
        pricePaid: typeof pricePaid === 'string' && pricePaid !== '' ? parseFloat(pricePaid) : (typeof pricePaid === 'number' ? pricePaid : undefined),
        notes,
        transferrerName,
    });

    onSuccess(`تم تعديل اشتراك ${user.fullName} بنجاح.`);
    onClose();
  };
  
  const inputClass = "w-full p-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-yellow-500 focus:border-yellow-500 text-sm text-white font-bold placeholder:text-slate-400/70 disabled:opacity-50";
  const labelClass = "block mb-1 text-sm font-bold text-yellow-300 tracking-wide";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-70 p-4">
      <div className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-2xl border border-yellow-500/50 max-h-[90vh] flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-yellow-500/50 flex-shrink-0">
          <h2 className="text-xl font-bold text-yellow-300">تعديل بيانات الاشتراك</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
        </header>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
            
            <div>
                <label className={labelClass}>المشترك</label>
                <input type="text" value={`${user.fullName} (${user.email})`} className={`${inputClass} bg-slate-800/50 cursor-not-allowed`} disabled />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>الورشة</label>
                    <input type="text" value={selectedWorkshop?.title || 'ورشة غير معروفة'} className={`${inputClass} bg-slate-800/50 cursor-not-allowed`} disabled />
                </div>
                <div>
                    <label className={labelClass}>الباقة</label>
                    <select value={selectedPackageId} onChange={(e) => setSelectedPackageId(e.target.value)} className={inputClass} disabled={!selectedWorkshop?.packages || selectedWorkshop.packages.length === 0}>
                        <option value="">{selectedWorkshop?.packages?.length ? 'بدون باقة' : 'لا توجد باقات'}</option>
                        {selectedWorkshop?.packages?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>المبلغ الفعلي للورشة/الباقة</label>
                    <input type="text" value={actualPrice} className={`${inputClass} bg-slate-800/50 cursor-not-allowed`} disabled placeholder="السعر الفعلي" />
                </div>
                <div>
                    <label className={labelClass}>المبلغ المدفوع</label>
                    <input type="number" step="any" value={pricePaid} onChange={e => setPricePaid(toEnglishDigits(e.target.value))} className={inputClass} placeholder="المبلغ المدفوع" />
                </div>
            </div>

             <div>
                <label className={labelClass}>طريقة الدفع</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={inputClass} required>
                    <option value="" disabled>اختر طريقة الدفع...</option>
                    <option value="LINK">LINK</option>
                    <option value="BANK">BANK</option>
                    <option value="GIFT">GIFT</option>
                    <option value="CREDIT">CREDIT</option>
                </select>
            </div>

            <div>
                <label className={labelClass}>الشخص المحول منه قيمة الاشتراك</label>
                <input type="text" value={transferrerName} onChange={e => setTransferrerName(toEnglishDigits(e.target.value))} className={inputClass} placeholder="اسم المحول" />
            </div>

            <div>
                <label className={labelClass}>ملاحظات</label>
                <textarea value={notes} onChange={e => setNotes(toEnglishDigits(e.target.value))} className={inputClass} rows={3}></textarea>
            </div>
            
            {subscription.isGift && (
                <div className="bg-black/20 p-4 rounded-lg border border-purple-500/50 space-y-3">
                    <h4 className="text-base font-bold text-purple-300 flex items-center gap-x-2">
                        <GiftIcon className="w-5 h-5" />
                        <span>تفاصيل الهدية</span>
                    </h4>
                    <div className="text-sm space-y-2">
                        <p><strong>من:</strong> {subscription.gifterName}</p>
                        {subscription.gifterPhone && (
                            <p><strong>هاتف المُهدي:</strong> <span className="font-mono">{subscription.gifterPhone}</span></p>
                        )}
                        {subscription.giftMessage && (
                            <div>
                                <strong>الرسالة:</strong>
                                <blockquote className="mt-1 border-r-2 border-purple-400/50 pr-2 text-slate-300 italic whitespace-pre-wrap">
                                    {subscription.giftMessage}
                                </blockquote>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <footer className="pt-4 flex justify-end gap-4 border-t border-yellow-500/50">
                <button type="button" onClick={onClose} className="py-2 px-6 rounded-md bg-slate-600 hover:bg-slate-500 transition-colors text-white font-bold text-sm">إلغاء</button>
                <button type="submit" className="py-2 px-6 rounded-md bg-yellow-600 hover:bg-yellow-500 transition-colors text-white font-bold text-sm">حفظ التعديلات</button>
            </footer>
        </form>
      </div>
      <style>{`.z-70 { z-index: 70; }`}</style>
    </div>
  );
};

export default EditSubscriptionModal;