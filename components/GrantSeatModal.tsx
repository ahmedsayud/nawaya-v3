
import React, { useState, useMemo, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { CloseIcon, UserAddIcon, HeartIcon } from './icons';
import { User, Workshop } from '../types';
import { normalizePhoneNumber } from '../utils';

interface GrantSeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

interface AvailableDonor {
    subscriptionId: string;
    donorName: string;
    balance: number;
    estimatedSeats: number;
}

// Ensure the component accepts 'data' prop to match the export type used in TransfersPage
const GrantSeatModal: React.FC<GrantSeatModalProps & { data?: { workshopId?: number, donorSubscriptionId?: string } }> = ({ isOpen, onClose, onSuccess, data }) => {
  const { users, workshops, grantPayItForwardSeat } = useUser();
  
  // Search state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  
  // Selection state
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');
  const [selectedDonorSubId, setSelectedDonorSubId] = useState('');
  const [notes, setNotes] = useState('');

  // Sync state with passed data
  useEffect(() => {
      if (isOpen) {
          if (data?.workshopId) setSelectedWorkshopId(data.workshopId.toString());
          else setSelectedWorkshopId('');
          
          if (data?.donorSubscriptionId) setSelectedDonorSubId(data.donorSubscriptionId);
          else setSelectedDonorSubId('');
          
          setSelectedUser(null);
          setUserSearch('');
          setNotes('');
      }
  }, [isOpen, data]);

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

  const selectedWorkshop = workshops.find(w => w.id === parseInt(selectedWorkshopId, 10));
  const workshopPrice = selectedWorkshop?.packages?.[0]?.discountPrice ?? selectedWorkshop?.packages?.[0]?.price ?? selectedWorkshop?.price ?? 0;
  
  const availableDonors = useMemo((): AvailableDonor[] => {
      if (!selectedWorkshopId) return [];
      const wid = parseInt(selectedWorkshopId, 10);
      const list: AvailableDonor[] = [];

      users.forEach(user => {
          user.subscriptions.forEach(sub => {
              if (sub.workshopId === wid && sub.isPayItForwardDonation && (sub.donationRemaining || 0) >= workshopPrice) {
                  const seats = workshopPrice > 0 ? Math.floor((sub.donationRemaining || 0) / workshopPrice) : 0;
                  list.push({
                      subscriptionId: sub.id,
                      donorName: user.fullName,
                      balance: sub.donationRemaining || 0,
                      estimatedSeats: seats
                  });
              }
          });
      });
      return list;
  }, [users, selectedWorkshopId, workshopPrice]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setUserSearch(user.fullName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedWorkshop || !selectedDonorSubId) return;
    
    grantPayItForwardSeat(selectedUser.id, selectedWorkshop.id, workshopPrice, selectedDonorSubId, notes);
    onSuccess(`تم منح المقعد للمشترك ${selectedUser.fullName} بنجاح.`);
    onClose();
  };

  const inputClass = "w-full p-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-pink-500 focus:border-pink-500 text-sm text-white font-bold placeholder:text-slate-400/70";
  const labelClass = "block mb-1 text-sm font-bold text-pink-300 tracking-wide";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-80 p-4">
      <div className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-lg border border-pink-500/50 max-h-[90vh] flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-pink-500/50 flex-shrink-0">
          <h2 className="text-xl font-bold text-pink-300 flex items-center gap-2">
            <HeartIcon className="w-6 h-6" />
            منح مقعد (من الصندوق)
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
            
            <div>
                <label className={labelClass}>الورشة المراد منحها</label>
                <select 
                    value={selectedWorkshopId} 
                    onChange={e => { setSelectedWorkshopId(e.target.value); setSelectedDonorSubId(''); }} 
                    className={inputClass} 
                    required
                    disabled={!!data?.workshopId} // Lock if pre-selected
                >
                    <option value="" disabled>اختر ورشة...</option>
                    {workshops.filter(w => !w.isDeleted).map(w => (
                        <option key={w.id} value={w.id}>
                            {w.title} - (سعر المقعد: {w.packages?.[0]?.discountPrice ?? w.packages?.[0]?.price ?? w.price ?? 0})
                        </option>
                    ))}
                </select>
            </div>

            {selectedWorkshop && (
                <div>
                     <label className={labelClass}>اختر الداعم (صاحب الرصيد)</label>
                     <select 
                        value={selectedDonorSubId} 
                        onChange={e => setSelectedDonorSubId(e.target.value)} 
                        className={inputClass} 
                        required
                        disabled={!!data?.donorSubscriptionId} // Lock if pre-selected
                     >
                        <option value="" disabled>اختر داعماً...</option>
                        {availableDonors.map(donor => (
                            <option key={donor.subscriptionId} value={donor.subscriptionId}>
                                {donor.donorName} (متبقي: {donor.estimatedSeats} مقاعد - {donor.balance.toFixed(0)} درهم)
                            </option>
                        ))}
                     </select>
                     {availableDonors.length === 0 && (
                         <p className="text-xs text-red-400 mt-1">لا يوجد داعمين لديهم رصيد كافٍ لهذه الورشة.</p>
                     )}
                </div>
            )}

            <div>
                <label className={labelClass}>البحث عن المشترك المستحق</label>
                <div className="relative">
                    <input type="text" value={userSearch} onChange={e => { setUserSearch(e.target.value); setSelectedUser(null); }} className={inputClass} placeholder="ابحث بالاسم أو الهاتف..." />
                    {filteredUsers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-600 rounded-b-lg z-10 max-h-48 overflow-y-auto shadow-xl">
                            {filteredUsers.map(user => (
                                <button type="button" key={user.id} onClick={() => handleUserSelect(user)} className="w-full text-right p-3 hover:bg-pink-500/20 text-sm border-b border-slate-700 last:border-0">
                                    <p className="font-bold text-white">{user.fullName}</p>
                                    <p className="text-xs text-slate-400">{user.phone}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {selectedUser && (
                     <div className="mt-2 p-2 bg-slate-800 rounded border border-slate-600 text-sm flex justify-between items-center">
                        <span className="text-white">تم اختيار: <strong>{selectedUser.fullName}</strong></span>
                        <button type="button" onClick={() => {setSelectedUser(null); setUserSearch('')}} className="text-xs text-red-400 hover:underline">إلغاء</button>
                    </div>
                )}
            </div>

            <div>
                <label className={labelClass}>ملاحظات إدارية (اختياري)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className={inputClass} rows={2} placeholder="سبب المنح أو ملاحظات أخرى..."></textarea>
            </div>

            <footer className="pt-4 flex justify-end gap-4 border-t border-pink-500/50">
                <button type="button" onClick={onClose} className="py-2 px-6 rounded-md bg-slate-600 hover:bg-slate-500 transition-colors text-white font-bold text-sm">إلغاء</button>
                <button 
                    type="submit" 
                    disabled={!selectedUser || !selectedWorkshopId || !selectedDonorSubId} 
                    className="py-2 px-6 rounded-md bg-pink-600 hover:bg-pink-500 transition-colors text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <UserAddIcon className="w-5 h-5" />
                    تأكيد المنح
                </button>
            </footer>
        </form>
      </div>
      <style>{`.z-80 { z-index: 80; }`}</style>
    </div>
  );
};

export default GrantSeatModal;
