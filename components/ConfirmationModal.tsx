
import React from 'react';
import { ExclamationCircleIcon } from './icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[100] p-4 backdrop-blur-sm">
      <div 
        className="bg-gradient-to-br from-[#2e0235] to-[#4a044e] rounded-2xl shadow-2xl w-full max-w-md border border-fuchsia-500/30 flex flex-col overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-fuchsia-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-fuchsia-500/30">
            <ExclamationCircleIcon className="w-8 h-8 text-fuchsia-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
          <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
        </div>
        <footer className="p-4 bg-black/20 border-t border-white/5 flex justify-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-sm transition-colors border border-white/5"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-lg shadow-fuchsia-500/20"
          >
            {confirmText}
          </button>
        </footer>
      </div>
    </div>
  );
};
