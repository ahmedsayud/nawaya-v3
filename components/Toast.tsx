
import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, CloseIcon, ExclamationCircleIcon } from './icons';

type ToastType = 'success' | 'warning' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  // Royal Theme Colors
  const successClasses = {
    bg: 'bg-gradient-to-r from-[#2e0235] to-[#4c1d95]',
    border: 'border-fuchsia-500',
    iconColor: 'text-fuchsia-400',
    glow: 'shadow-fuchsia-500/20',
  };

  const warningClasses = {
    bg: 'bg-gradient-to-r from-[#451a03] to-[#78350f]',
    border: 'border-amber-500',
    iconColor: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  };

  const errorClasses = {
    bg: 'bg-gradient-to-r from-[#450a0a] to-[#7f1d1d]',
    border: 'border-red-500',
    iconColor: 'text-red-400',
    glow: 'shadow-red-500/20',
  };

  const typeClasses = type === 'success' ? successClasses : type === 'warning' ? warningClasses : errorClasses;
  const Icon = type === 'success' ? CheckCircleIcon : ExclamationCircleIcon;

  return (
    <div
      className={`fixed top-6 right-0 left-0 mx-auto w-fit max-w-sm sm:max-w-md p-1 z-[100] ${isClosing ? 'animate-slide-out-top' : 'animate-slide-in-top'}`}
    >
        <div className={`relative flex items-center p-4 rounded-2xl shadow-2xl border ${typeClasses.bg} ${typeClasses.border} ${typeClasses.glow} backdrop-blur-xl`}>
            <div className="flex-shrink-0">
                <Icon className={`h-6 w-6 ${typeClasses.iconColor}`} />
            </div>
            <div className="mr-3 ml-4 flex-1">
                <p className="text-sm font-bold text-white leading-snug">{message}</p>
            </div>
            <button
                onClick={handleClose}
                className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors focus:outline-none"
            >
                <span className="sr-only">Close</span>
                <CloseIcon className="h-4 w-4" />
            </button>
        </div>
        <style>{`
            @keyframes slide-in-top {
                from { transform: translateY(-100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            @keyframes slide-out-top {
                from { transform: translateY(0); opacity: 1; }
                to { transform: translateY(-100%); opacity: 0; }
            }
            .animate-slide-in-top { animation: slide-in-top 0.4s ease-out forwards; }
            .animate-slide-out-top { animation: slide-out-top 0.4s ease-out forwards; }
        `}</style>
    </div>
  );
};

export default Toast;
