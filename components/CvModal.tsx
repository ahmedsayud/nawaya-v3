import React from 'react';
import { CloseIcon } from './icons';
import { useUser } from '../context/UserContext';

interface CvModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CvModal: React.FC<CvModalProps> = ({ isOpen, onClose }) => {
  const { drhopeData } = useUser();
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900/70 backdrop-blur-2xl rounded-lg shadow-2xl w-full max-w-2xl border border-fuchsia-500/50 relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
      >
        <header className="p-4 flex justify-between items-center border-b border-fuchsia-500/30 flex-shrink-0">
          <h2 className="text-lg font-bold text-white">CV DRHOPE</h2>
          <button 
            onClick={onClose} 
            aria-label="إغلاق النافذة"
            className="text-slate-300 bg-slate-800/70 hover:bg-pink-500/80 hover:text-white rounded-full p-2 transition-all duration-300 transform hover:scale-110 shadow-lg border border-slate-600 hover:border-pink-400"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="flex-grow overflow-y-auto">
          {drhopeData.cvUrl ? (
            <iframe
              src={drhopeData.cvUrl}
              title="CV DRHOPE"
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p>لم يتم إضافة السيرة الذاتية بعد.</p>
            </div>
          )}
        </div>
      </div>
       <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default CvModal;
