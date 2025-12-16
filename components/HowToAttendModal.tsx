
import React from 'react';
import { CloseIcon, UserIcon, CreditCardIcon, VideoIcon } from './icons';

interface HowToAttendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowToAttendModal: React.FC<HowToAttendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      icon: UserIcon,
      title: '1. تسجيل الدخول',
      desc: 'يجب أن يكون لديك حساب في المنصة. قم بتسجيل الدخول أو إنشاء حساب جديد بسهولة برقم هاتفك.',
      color: 'text-sky-400',
      bg: 'bg-sky-500/20'
    },
    {
      icon: CreditCardIcon,
      title: '2. الاشتراك في الورشة',
      desc: 'اختر الورشة التي تود حضورها وقم بإتمام عملية الدفع لتفعيل اشتراكك وحجز مقعدك.',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20'
    },
    {
      icon: VideoIcon,
      title: '3. الدخول للبث',
      desc: 'قبل موعد الورشة، سيظهر زر "دخول البث" (Live) باللون الأحمر في الصفحة الرئيسية وفي ملفك الشخصي. اضغط عليه للانتقال إلى قاعة Zoom مباشرة.',
      color: 'text-fuchsia-400',
      bg: 'bg-fuchsia-500/20'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[100] p-4 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-slate-900 border border-fuchsia-500/30 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <CloseIcon className="w-6 h-6" />
        </button>

        <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">كيف أحضر البث المباشر؟</h2>
            <p className="text-slate-400 text-sm mb-8">3 خطوات بسيطة تفصلك عن رحلة التعلم والإلهام</p>

            <div className="space-y-6 relative">
                {/* Connecting Line */}
                <div className="absolute top-4 bottom-4 right-6 w-0.5 bg-slate-700/50 -z-10 hidden sm:block"></div>

                {steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-4 text-right relative bg-black/20 p-3 rounded-lg sm:bg-transparent sm:p-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${step.bg} border border-white/5 z-10`}>
                            <step.icon className={`w-6 h-6 ${step.color}`} />
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg ${step.color}`}>{step.title}</h3>
                            <p className="text-slate-300 text-sm leading-relaxed mt-1">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <button 
                onClick={onClose}
                className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold transition-all shadow-lg shadow-fuchsia-900/20"
            >
                فهمت، لنبدأ!
            </button>
        </div>
      </div>
    </div>
  );
};

export default HowToAttendModal;
