import React from 'react';
import { useUser } from '../context/UserContext';
import { CloseIcon } from './icons';
// FIX: Add Package to types import.
import { User, Subscription, Workshop, Package } from '../types';
import { formatArabicDate } from '../utils';

interface SubscriptionWithDetails {
    user: User;
    subscription: Subscription;
    workshop: Workshop;
    // FIX: Add optional pkg property to match type in TransfersPage.
    pkg?: Package;
}

interface TransfersStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: SubscriptionWithDetails[];
}

const TransfersStatsModal: React.FC<TransfersStatsModalProps> = ({ isOpen, onClose, subscriptions }) => {
  const { workshops } = useUser();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-70 p-4">
      <div className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-4xl border border-yellow-500/50 max-h-[90vh] flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-yellow-500/50 flex-shrink-0">
          <h2 className="text-xl font-bold text-yellow-300 tracking-wider">إحصائيات التحويلات</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
        </header>
        <div className="p-6 overflow-y-auto">
            <div className="bg-black/20 p-4 rounded-lg mb-6 text-center">
                <p className="text-sm font-bold text-white">إجمالي عدد التحويلات</p>
                <p className="text-2xl font-bold text-white">{subscriptions.length}</p>
            </div>
            <div className="overflow-x-auto">
                 <table className="min-w-full text-sm text-center text-white">
                    <thead className="text-yellow-300 uppercase tracking-wider font-bold text-xs">
                        <tr className="border-b-2 border-yellow-500/30 bg-black/20">
                            <th className="py-3 px-2">المشترك</th>
                            <th className="py-3 px-2">رقم الهاتف</th>
                            <th className="py-3 px-2">من ورشة</th>
                            <th className="py-3 px-2">إلى ورشة</th>
                            <th className="py-3 px-2">المبلغ</th>
                            <th className="py-3 px-2">تاريخ التحويل</th>
                        </tr>
                    </thead>
                    <tbody className="font-bold">
                        {subscriptions.map(({ user, subscription, workshop }) => {
                            const fromWorkshopTitle = workshop.title;
                            const toWorkshopTitle = subscription.notes?.replace('Transferred to ', '').split('.')[0].replace(' Notes:','').trim() || 'ورشة غير معروفة';

                            return (
                                <tr key={subscription.id} className="border-b border-yellow-500/20 hover:bg-yellow-500/10">
                                    <td className="py-3 px-2">{user.fullName}</td>
                                    <td className="py-3 px-2">{user.phone}</td>
                                    <td className="py-3 px-2">{fromWorkshopTitle}</td>
                                    <td className="py-3 px-2">{toWorkshopTitle}</td>
                                    <td className="py-3 px-2">{subscription.pricePaid?.toFixed(2) || 'N/A'}</td>
                                    <td className="py-3 px-2">{subscription.transferDate ? formatArabicDate(subscription.transferDate) : 'غير محدد'}</td>
                                </tr>
                            );
                        })}
                        {subscriptions.length === 0 && (
                            <tr><td colSpan={6} className="p-12 text-center">لا توجد تحويلات.</td></tr>
                        )}
                    </tbody>
                 </table>
            </div>
        </div>
      </div>
      <style>{`.z-70 { z-index: 70; }`}</style>
    </div>
  );
};

export default TransfersStatsModal;