
import React, { useState } from 'react';
import { Workshop } from '../types';
import { CloseIcon, HeartIcon, UsersIcon, PlusCircleIcon, TrashIcon, UserIcon } from './icons';

interface PayItForwardModalProps {
  workshop: Workshop;
  onClose: () => void;
  onProceed: (amount: number, seats: number) => void;
}

const PayItForwardModal: React.FC<PayItForwardModalProps> = ({ workshop, onClose, onProceed }) => {
  const [seatCount, setSeatCount] = useState(1);
  
  // Calculate price based on the first package or base price
  const seatPrice = workshop.packages?.[0]?.discountPrice ?? workshop.packages?.[0]?.price ?? workshop.price ?? 350;
  const totalAmount = seatPrice * seatCount;

  const handleIncrement = () => setSeatCount(prev => prev + 1);
  const handleDecrement = () => setSeatCount(prev => (prev > 1 ? prev - 1 : 1));

  const handleProceed = () => {
      onProceed(totalAmount, seatCount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[60] p-4">
      <div 
        className="bg-theme-gradient text-slate-200 rounded-2xl shadow-2xl w-full max-w-lg border border-fuchsia-500/50 flex flex-col relative"
        style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-6 pb-2 text-center relative">
            <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/10 text-slate-300">
                <CloseIcon className="w-6 h-6" />
            </button>
            <div className="w-16 h-16 bg-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-fuchsia-400 shadow-lg shadow-fuchsia-500/30">
                <HeartIcon className="w-8 h-8 text-fuchsia-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">إهداء لغير القادرين</h2>
            <p className="text-sm text-fuchsia-300 font-semibold">{workshop.title}</p>
        </header>

        <div className="p-6 pt-2 space-y-6">
            <p className="text-center text-slate-300 text-sm leading-relaxed bg-fuchsia-500/10 p-3 rounded-lg border border-fuchsia-500/20">
                قال رسول الله ﷺ: "من سلك طريقًا يلتمس فيه علمًا، سهل الله له به طريقًا إلى الجنة".
                <br/>
                مساهمتك بمقعد في هذه الورشة تفتح آفاقاً جديدة لمن لا يملك القدرة.
            </p>

            <div className="bg-black/20 p-5 rounded-xl border border-slate-700 space-y-4">
                <div className="flex justify-between items-center text-sm font-bold text-white">
                    <span>قيمة المقعد الواحد</span>
                    <span className="text-fuchsia-400 text-lg">{seatPrice} درهم</span>
                </div>

                <div className="flex items-center justify-between bg-slate-800/50 p-2 rounded-lg border border-slate-600">
                    <span className="text-sm font-bold text-slate-300 px-2">عدد المقاعد المهداة:</span>
                    <div className="flex items-center gap-x-4">
                        <button 
                            onClick={handleDecrement}
                            disabled={seatCount <= 1}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg"
                        >
                            -
                        </button>
                        <span className="text-xl font-bold text-white w-8 text-center">{seatCount}</span>
                        <button 
                            onClick={handleIncrement}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-600 hover:bg-purple-500 text-white transition-colors font-bold text-lg"
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center px-2">
                <span className="text-slate-300">الإجمالي للدفع:</span>
                <span className="text-3xl font-bold text-white">{totalAmount} <span className="text-base text-fuchsia-400">درهم</span></span>
            </div>
        </div>

        <footer className="p-6 pt-2 pb-8">
            <button 
                onClick={handleProceed}
                className="w-full bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-900/30 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-x-2 border border-fuchsia-500/20"
            >
                <span>متابعة للدفع</span>
                <UsersIcon className="w-5 h-5" />
            </button>
            <p className="text-xs text-center text-slate-500 mt-3">
                سيتم إضافة هذه المقاعد إلى رصيد الورشة لتوزيعها على المشتركين المستحقين.
            </p>
        </footer>
      </div>
    </div>
  );
};

export default PayItForwardModal;
