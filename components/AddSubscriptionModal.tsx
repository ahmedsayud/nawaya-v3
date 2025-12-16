
import React, { useState, useMemo, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { CloseIcon, ExclamationCircleIcon, PlusCircleIcon } from './icons';
import { Workshop, Package, SubscriptionStatus, User } from '../types';
import { toEnglishDigits, normalizePhoneNumber } from '../utils';


interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  showToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
}

const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({ isOpen, onClose, onSuccess, showToast }) => {
  const { users, workshops, addSubscription, checkRegistrationAvailability, addUser } = useUser();

  const [isCreatingNewUser, setIsCreatingNewUser] = useState(false);

  // Search state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');

  // Create user state
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSelectedCountryCode, setNewSelectedCountryCode] = useState('');
  const [newUserError, setNewUserError] = useState('');

  // Subscription state
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [pricePaid, setPricePaid] = useState<number | string>('');
  const [actualPrice, setActualPrice] = useState<number | string>('');
  const [transferrerName, setTransferrerName] = useState('');
  const [notes, setNotes] = useState('');
  const [sendWhatsAppNotification, setSendWhatsAppNotification] = useState(true);
  const [creditToApply, setCreditToApply] = useState<number | string>('');
  const [attendanceType, setAttendanceType] = useState<'أونلاين' | 'حضوري' | ''>('');

  const [isAlreadySubscribed, setIsAlreadySubscribed] = useState(false);

  const resetForm = () => {
    setIsCreatingNewUser(false);
    setSelectedUser(null);
    setUserSearch('');
    setNewFullName('');
    setNewEmail('');
    setNewPhone('');
    setNewSelectedCountryCode('');
    setNewUserError('');
    setSelectedWorkshopId('');
    setSelectedPackageId('');
    setPaymentMethod('');
    setPricePaid('');
    setActualPrice('');
    setTransferrerName('');
    setNotes('');
    setSendWhatsAppNotification(true);
    setCreditToApply('');
    setAttendanceType('');
    setIsAlreadySubscribed(false);
  };


  if (!isOpen) return null;

  const filteredUsers = useMemo(() => {
    if (!userSearch || selectedUser) return [];
    const lowercasedSearch = userSearch.toLowerCase();
    const normalizedPhoneSearch = normalizePhoneNumber(userSearch);
    return users.filter(u =>
      !u.isDeleted && (
        u.fullName.toLowerCase().includes(lowercasedSearch) ||
        u.email.toLowerCase().includes(lowercasedSearch) ||
        (normalizedPhoneSearch && normalizePhoneNumber(u.phone).includes(normalizedPhoneSearch))
      )
    ).slice(0, 5);
  }, [userSearch, users, selectedUser]);

  const selectedWorkshop: Workshop | undefined = workshops.find(w => w.id === parseInt(selectedWorkshopId, 10));

  useEffect(() => {
    if (selectedUser && selectedWorkshopId) {
      const workshopIdNum = parseInt(selectedWorkshopId, 10);
      const isSubscribed = selectedUser.subscriptions.some(
        sub => sub.workshopId === workshopIdNum && sub.status !== SubscriptionStatus.REFUNDED
      );
      setIsAlreadySubscribed(isSubscribed);

      if (isSubscribed) {
        setPaymentMethod('');
        setPricePaid('');
      }
    } else {
      setIsAlreadySubscribed(false);
    }
  }, [selectedUser, selectedWorkshopId]);


  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setUserSearch(user.fullName);
    setCreditToApply('');
  };

  const handleWorkshopChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const workshopId = e.target.value;
    setSelectedWorkshopId(workshopId);
    setSelectedPackageId(''); // Reset package on workshop change
    setAttendanceType('');
    const workshop = workshops.find(w => w.id === parseInt(workshopId, 10));
    const price = workshop?.price || '';
    setActualPrice(price);
    setPricePaid(price);
    setCreditToApply('');
  };

  const handlePackageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pkgId = e.target.value;
    setSelectedPackageId(pkgId);
    let price: number | string;
    const workshop = workshops.find(w => w.id === parseInt(selectedWorkshopId, 10));
    if (!pkgId) { // If "no package" is selected
      price = workshop?.price || '';
      setAttendanceType(''); // No package, no type
    } else {
      const pkg = workshop?.packages?.find(p => p.id === parseInt(pkgId, 10));
      price = pkg?.discountPrice ?? pkg?.price ?? '';
      if (workshop?.location === 'أونلاين وحضوري') {
        setAttendanceType(pkg?.attendanceType || '');
      }
    }
    setActualPrice(price);
    setPricePaid(price);
    setCreditToApply('');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let userToEnroll: User | null = selectedUser;

    if (isCreatingNewUser) {
      setNewUserError('');

      const nameParts = newFullName.trim().split(/\s+/);
      if (nameParts.length < 2) {
        setNewUserError('يرجى إدخال الاسم الثنائي على الأقل.');
        return;
      }
      if (!newSelectedCountryCode) {
        setNewUserError('يرجى اختيار كود الدولة.');
        return;
      }
      if (newSelectedCountryCode !== 'OTHER' && newPhone.length < 8) {
        setNewUserError('رقم الهاتف قصير جداً.');
        return;
      }

      const fullPhoneNumber = newSelectedCountryCode === 'OTHER' ? newPhone : newSelectedCountryCode + newPhone;

      const { emailUser, phoneUser } = checkRegistrationAvailability(newEmail, fullPhoneNumber);
      if (emailUser) {
        setNewUserError('هذا البريد الإلكتروني مسجل بالفعل.');
        return;
      }
      if (phoneUser) {
        setNewUserError('رقم الهاتف هذا مسجل بالفعل.');
        return;
      }

      userToEnroll = addUser(newFullName, newEmail, fullPhoneNumber);
    }

    if (!userToEnroll || !selectedWorkshopId || !paymentMethod) {
      alert('يرجى اكمال جميع الحقول المطلوبة.');
      return;
    }

    if (isAlreadySubscribed) {
      showToast('هذا المستخدم مشترك بالفعل في هذه الورشة.', 'warning');
      return;
    }

    const workshopId = parseInt(selectedWorkshopId, 10);
    const isAlreadySubscribedCheck = userToEnroll.subscriptions.some(sub => sub.workshopId === workshopId && sub.status !== SubscriptionStatus.REFUNDED);

    if (isAlreadySubscribedCheck) {
      showToast('هذا المستخدم مشترك بالفعل في هذه الورشة.', 'warning');
      return;
    }

    const numericPricePaid = typeof pricePaid === 'string' && pricePaid !== '' ? parseFloat(pricePaid) : (typeof pricePaid === 'number' ? pricePaid : 0);
    const numericCreditToApply = typeof creditToApply === 'string' && creditToApply !== '' ? parseFloat(creditToApply) : (typeof creditToApply === 'number' ? creditToApply : 0);

    if (numericCreditToApply > (userToEnroll.internalCredit || 0)) {
      showToast('الرصيد المستخدم أكبر من الرصيد المتاح للمستخدم.', 'error');
      return;
    }

    if (numericCreditToApply > numericPricePaid) {
      showToast('لا يمكن استخدام رصيد أكبر من المبلغ المدفوع.', 'error');
      return;
    }

    addSubscription(
      userToEnroll.id,
      {
        workshopId: workshopId,
        packageId: selectedPackageId ? parseInt(selectedPackageId) : undefined,
        attendanceType: attendanceType ? attendanceType : undefined,
        paymentMethod: paymentMethod as any,
        pricePaid: numericPricePaid,
        notes,
        transferrerName: transferrerName || undefined,
      },
      paymentMethod !== 'BANK', // Auto-approve if not bank transfer
      sendWhatsAppNotification,
      numericCreditToApply
    );

    onSuccess(`تمت إضافة الاشتراك لـ ${userToEnroll.fullName} بنجاح.`);
    onClose();
  };

  const inputClass = "w-full p-2.5 bg-black/20 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/50 text-sm disabled:opacity-50";
  const labelClass = "block mb-1 text-xs font-bold text-fuchsia-300 tracking-wide";

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-70 p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#2e0235] via-[#2c0838] to-[#1e0b2b] text-white rounded-2xl shadow-2xl w-full max-w-3xl border border-fuchsia-500/30 max-h-[90vh] flex flex-col">
        <header className="p-5 flex justify-between items-center border-b border-fuchsia-500/20 flex-shrink-0 bg-black/20">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PlusCircleIcon className="w-6 h-6 text-fuchsia-400" />
            إضافة اشتراك جديد
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors"><CloseIcon className="w-6 h-6" /></button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          <div className="bg-white/5 p-5 rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">1. تحديد المستفيد</h3>
              <button type="button" onClick={() => { setIsCreatingNewUser(!isCreatingNewUser); setSelectedUser(null); setUserSearch(''); }} className="text-xs font-bold text-sky-400 hover:text-sky-300 hover:underline transition-colors">
                {isCreatingNewUser ? 'أو اختر مستفيد حالي' : 'أو إنشاء مستفيد جديد'}
              </button>
            </div>
            {isCreatingNewUser ? (
              <div className="space-y-4 border-t border-white/10 pt-4">
                {newUserError && <p className="text-red-400 text-xs font-bold text-center bg-red-900/20 p-2 rounded">{newUserError}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>الاسم الكامل</label>
                    <input type="text" value={newFullName} onChange={e => setNewFullName(e.target.value)} className={inputClass} required={isCreatingNewUser} />
                  </div>
                  <div>
                    <label className={labelClass}>البريد الإلكتروني</label>
                    <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className={inputClass} required={isCreatingNewUser} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>رقم الهاتف</label>
                  <div className="flex gap-2">
                    <select value={newSelectedCountryCode} onChange={e => setNewSelectedCountryCode(e.target.value)} className={`${inputClass} w-40`} required={isCreatingNewUser}>
                      <option value="" disabled className="text-gray-500 bg-white" style={{ color: '#6b7280', backgroundColor: 'white' }}>الدولة</option>
                      {useUser().countries.map(c => <option key={c.id} value={c.code} className="text-black bg-white" style={{ color: 'black', backgroundColor: 'white' }}>{c.name}</option>)}
                    </select>
                    <input type="tel" value={newPhone} onChange={e => setNewPhone(toEnglishDigits(e.target.value).replace(/\D/g, ''))} placeholder="501234567" className={`${inputClass} ltr-input`} required={isCreatingNewUser} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <label className={labelClass}>ابحث عن مستفيد (بالاسم, الايميل, أو الهاتف)</label>
                <input type="text" value={userSearch} onChange={e => { setUserSearch(e.target.value); setSelectedUser(null); }} className={inputClass} placeholder="ابدأ الكتابة للبحث..." />
                {filteredUsers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-[#2c0838] border border-fuchsia-500/30 rounded-b-lg z-10 max-h-48 overflow-y-auto shadow-2xl">
                    {filteredUsers.map(user => (
                      <button type="button" key={user.id} onClick={() => handleUserSelect(user)} className="w-full text-right p-3 hover:bg-fuchsia-500/20 text-sm border-b border-fuchsia-500/10 last:border-0 transition-colors">
                        <p className="font-bold text-white">{user.fullName}</p>
                        <p className="text-xs text-fuchsia-200/70">{user.email} - {user.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white/5 p-5 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2">2. تفاصيل الاشتراك</h3>

            {isAlreadySubscribed && (
              <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/30 text-center flex flex-col items-center gap-2">
                <ExclamationCircleIcon className="w-8 h-8 text-red-400" />
                <p className="font-bold text-red-300">تنبيه: المشترك مسجل بالفعل</p>
                <p className="text-xs text-red-200">
                  لا يمكن إضافة اشتراك مكرر لنفس الورشة.
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-2 py-1.5 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-colors"
                >
                  إعادة تعيين
                </button>
              </div>
            )}

            <fieldset disabled={isAlreadySubscribed} className="space-y-4 disabled:opacity-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>الورشة</label>
                  <select value={selectedWorkshopId} onChange={handleWorkshopChange} className={inputClass} required>
                    <option value="" disabled>اختر ورشة...</option>
                    {workshops.filter(w => !w.isDeleted).map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>الباقة (إن وجدت)</label>
                  <select value={selectedPackageId} onChange={handlePackageChange} className={inputClass} disabled={!selectedWorkshop?.packages || selectedWorkshop.packages.length === 0}>
                    <option value="">{selectedWorkshop?.packages?.length ? 'بدون باقة' : 'لا توجد باقات'}</option>
                    {selectedWorkshop?.packages?.map(p => <option key={p.id} value={p.id}>{p.name}{p.attendanceType ? ` (${p.attendanceType})` : ''}</option>)}
                  </select>
                </div>
              </div>

              {selectedWorkshop?.location === 'أونلاين وحضوري' && (
                <div>
                  <label className={labelClass}>نوع الحضور</label>
                  <select value={attendanceType} onChange={e => setAttendanceType(e.target.value as any)} className={inputClass} required disabled={!!selectedPackageId}>
                    <option value="" disabled>اختر نوع الحضور...</option>
                    <option value="حضوري">حضوري</option>
                    <option value="أونلاين">أونلاين</option>
                  </select>
                  {selectedPackageId && <p className="text-[10px] text-slate-400 mt-1">يتم تحديد نوع الحضور من الباقة المختارة.</p>}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>السعر الفعلي</label>
                  <input type="text" value={actualPrice} className={`${inputClass} bg-black/40 cursor-not-allowed`} disabled placeholder="السعر الفعلي" />
                </div>
                <div>
                  <label className={labelClass}>المبلغ المدفوع</label>
                  <input type="number" step="any" value={pricePaid} onChange={e => setPricePaid(toEnglishDigits(e.target.value))} className={inputClass} placeholder="المبلغ المدفوع" />
                </div>
              </div>

              {selectedUser && (selectedUser.internalCredit || 0) > 0 && (
                <div>
                  <label className={labelClass}>استخدام الرصيد الداخلي (المتاح: {selectedUser.internalCredit?.toFixed(2)})</label>
                  <input type="number" step="any" value={creditToApply} onChange={e => setCreditToApply(toEnglishDigits(e.target.value))} className={inputClass} placeholder="0.00" max={selectedUser.internalCredit} />
                </div>
              )}

              <div>
                <label className={labelClass}>طريقة الدفع</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={inputClass} required>
                  <option value="" disabled>اختر طريقة...</option>
                  <option value="BANK">تحويل بنكي (BANK)</option>
                  <option value="LINK">رابط دفع (LINK)</option>
                  <option value="GIFT">هدية (GIFT)</option>
                  <option value="CREDIT">ائتمان (CREDIT)</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>ملاحظات</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className={inputClass} rows={2}></textarea>
              </div>
            </fieldset>
          </div>

          <div className="flex items-center gap-x-2 pt-2 px-1">
            <input type="checkbox" id="sendWhatsApp" checked={sendWhatsAppNotification} onChange={e => setSendWhatsAppNotification(e.target.checked)} className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-fuchsia-600 focus:ring-fuchsia-500" />
            <label htmlFor="sendWhatsApp" className="text-xs font-bold text-slate-300 cursor-pointer select-none">إرسال إشعار تأكيد عبر واتساب للمستخدم (إذا تمت الموافقة)</label>
          </div>

          <footer className="pt-4 flex justify-end gap-3 border-t border-fuchsia-500/20 mt-4">
            <button type="button" onClick={onClose} className="py-2.5 px-6 rounded-xl bg-slate-600 hover:bg-slate-500 text-slate-200 font-bold text-sm transition-colors">إلغاء</button>
            <button type="submit" disabled={isAlreadySubscribed} className="py-2.5 px-8 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-fuchsia-900/30 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">إضافة الاشتراك</button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default AddSubscriptionModal;
