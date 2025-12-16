
import React from 'react';
import { CloseIcon } from './icons';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[100] p-4 backdrop-blur-sm">
      <div 
        className="bg-gradient-to-br from-[#2e0235] via-[#3b0764] to-[#4c1d95] text-slate-200 rounded-2xl shadow-2xl w-full max-w-3xl border border-fuchsia-500/30 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
      >
        <header className="p-5 flex justify-between items-center border-b border-fuchsia-500/20 flex-shrink-0 bg-black/20">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors"><CloseIcon className="w-6 h-6" /></button>
        </header>
        
        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-white/5">
            {content}
        </div>
        
        <footer className="p-4 border-t border-fuchsia-500/20 text-center flex-shrink-0 bg-black/20">
            <button onClick={onClose} className="px-8 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-bold transition-colors">
                إغلاق
            </button>
        </footer>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(217, 70, 239, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(217, 70, 239, 0.4); }
      `}</style>
    </div>
  );
};

export default LegalModal;
