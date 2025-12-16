import React from 'react';
import { CloseIcon } from './icons';
import { User, Subscription, Workshop, Package } from '../types';
import { formatArabicDate } from '../utils';

interface SubscriptionWithDetails {
    user: User;
    subscription: Subscription;
    workshop: Workshop;
    pkg?: Package;
}

interface CreditPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: SubscriptionWithDetails[];
}

const CreditPaymentsModal: React.FC<CreditPaymentsModalProps> = ({ isOpen, onClose, subscriptions }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-70 p-4">
      <div className="bg-theme-gradient backdrop-blur-lg text-white rounded-lg shadow-2xl w-full max-w-4xl border border-amber-500/80 max-h-[90vh] flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-amber-500/50 flex-shrink-0">
          <h2 className="text-xl font-bold text-amber-300">الاشتراكات المدفوعة بالرصيد</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
        </header>
        <div className="p-6 overflow-y-auto">
          <table className="min-w-full text-sm text-white">
            <thead>
              <tr className="border-b-2 border-amber-500/30 text-amber-300 uppercase font-bold text-xs">
                <th className="p-2 text-right">المستخدم</th>
                <th className="p-2 text-right">الورشة</th>
                <th className="p-2 text-center">المبلغ المدفوع (رصيد)</th>
                <th className="p-2 text-center">تاريخ الاشتراك</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(({ user, subscription, workshop }) => (
                <tr key={subscription.id} className="border-b border-slate-800 hover:bg-amber-500/10">
                  <td className="p-2 text-right font-semibold">{user.fullName}</td>
                  <td className="p-2 text-right">{workshop.title}</td>
                  <td className="p-2 text-center">{subscription.creditApplied?.toFixed(2) || subscription.pricePaid?.toFixed(2) || 'N/A'}</td>
                  <td className="p-2 text-center">{formatArabicDate(subscription.activationDate)}</td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr><td colSpan={4} className="p-12 text-center">لا توجد اشتراكات مدفوعة بالرصيد.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
       <style>{`.z-70 { z-index: 70; }`}</style>
    </div>
  );
};

export default CreditPaymentsModal;
