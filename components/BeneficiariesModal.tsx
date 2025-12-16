
import React, { useMemo } from 'react';
import { User, Workshop } from '../types';
import { CloseIcon, UserIcon, WhatsAppIcon, CalendarIcon } from './icons';
import { normalizePhoneNumber, formatArabicDate } from '../utils';

interface BeneficiariesModalProps {
  isOpen: boolean;
  onClose: () => void;
  donorName: string;
  workshop: Workshop;
  allUsers: User[];
}

const BeneficiariesModal: React.FC<BeneficiariesModalProps> = ({ isOpen, onClose, donorName, workshop, allUsers }) => {
  if (!isOpen) return null;

  // Filter users who have a subscription to this workshop, marked as a gift, where the gifterName matches the donorName
  const beneficiaries = useMemo(() => {
    return allUsers.flatMap(user => {
        const sub = user.subscriptions.find(s => 
            s.workshopId === workshop.id && 
            s.isGift && 
            s.gifterName === donorName
        );
        if (sub) {
            return { user, subscription: sub };
        }
        return [];
    });
  }, [allUsers, workshop.id, donorName]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[90] p-4">
      <div 
        className="bg-slate-900 text-white rounded-lg shadow-2xl w-full max-w-2xl border border-pink-500/50 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
      >
        <header className="p-4 flex justify-between items-center border-b border-pink-500/30 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-pink-400" />
                المشتركون المدعومين
            </h2>
            <p className="text-xs text-slate-400 mt-1">
                بدعم من: <span className="text-pink-300 font-bold">{donorName}</span> | الورشة: {workshop.title}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-300">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-grow overflow-y-auto p-6">
            {beneficiaries.length > 0 ? (
                <div className="space-y-3">
                    {beneficiaries.map(({ user, subscription }) => (
                        <div key={subscription.id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-pink-500/30 transition-colors flex justify-between items-center">
                            <div>
                                <p className="font-bold text-white mb-1">{user.fullName}</p>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <CalendarIcon className="w-3 h-3" />
                                        <span>{formatArabicDate(subscription.activationDate)}</span>
                                    </div>
                                    {subscription.notes && (
                                        <span className="text-slate-500 max-w-[200px] truncate" title={subscription.notes}>
                                            {subscription.notes}
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <a 
                                href={`https://wa.me/${normalizePhoneNumber(user.phone)}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-2 text-sky-400 hover:text-sky-300 bg-sky-900/20 px-3 py-1.5 rounded-md transition-colors"
                            >
                                <WhatsAppIcon className="w-4 h-4" />
                                <span className="font-mono text-sm dir-ltr">{user.phone.replace(/^\+/, '')}</span>
                            </a>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-slate-400">
                    <p>لم يتم منح مقاعد من رصيد هذا الداعم حتى الآن.</p>
                </div>
            )}
        </div>
        
        <footer className="p-4 border-t border-pink-500/30 text-center bg-black/20 flex-shrink-0">
            <p className="text-xs text-slate-500">إجمالي المستفيدين: {beneficiaries.length}</p>
        </footer>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .z-90 { z-index: 90; }
      `}</style>
    </div>
  );
};

export default BeneficiariesModal;
