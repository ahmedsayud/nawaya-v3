import React from 'react';
import { CloseIcon, ShieldCheckIcon } from './icons';
import { Workshop } from '../types';

interface RecordingPledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  workshop: Workshop | null;
}

const RecordingPledgeModal: React.FC<RecordingPledgeModalProps> = ({ isOpen, onClose, onConfirm, workshop }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-70 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-theme-gradient backdrop-blur-2xl rounded-lg shadow-2xl w-full max-w-lg border border-yellow-500/50 relative flex flex-col text-center"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
      >
        <header className="p-4 flex justify-between items-center border-b border-yellow-500/30">
          <h2 className="text-lg font-bold text-yellow-300">ميثاق الأمانة</h2>
          <button 
            onClick={onClose} 
            aria-label="إغلاق النافذة"
            className="text-slate-300 bg-slate-800/70 hover:bg-pink-500/80 hover:text-white rounded-full p-2 transition-all"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="p-8">
            <ShieldCheckIcon className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-xl font-bold text-slate-100 mb-4">
                تنبيه هام قبل مشاهدة تسجيل ورشة "{workshop?.title}"
            </h3>
            <p className="text-slate-200 mb-6">
                أنت الآن على وشك مشاهدة محتوى خاص. نثق بك للحفاظ على أمانة هذا المحتوى وعدم مشاركته، أو تسجيله، أو التقاط صور للشاشة. 
                <br/><br/>
                <strong className="text-yellow-300">مشاهدتك تعني موافقتك على هذا الميثاق.</strong>
            </p>
            <div className="flex justify-center gap-4">
                <button
                    onClick={onClose}
                    className="py-2 px-6 rounded-md bg-slate-600 hover:bg-slate-500 transition-colors text-white font-bold text-sm"
                >
                    إلغاء
                </button>
                <button
                    onClick={onConfirm}
                    className="inline-flex items-center justify-center gap-x-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold py-2 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-amber-800/40"
                >
                    أوافق وأتابع المشاهدة
                </button>
            </div>
        </div>
      </div>
      <style>{`.z-70 { z-index: 70; }`}</style>
    </div>
  );
};

export default RecordingPledgeModal;