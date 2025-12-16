
import React from 'react';
import { CloseIcon, InstagramIcon } from './icons';
import { useUser } from '../context/UserContext';

interface InstagramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstagramModal: React.FC<InstagramModalProps> = ({ isOpen, onClose }) => {
  const { drhopeData } = useUser();
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-theme-gradient backdrop-blur-2xl rounded-lg shadow-2xl w-full max-w-lg border border-violet-500/50 relative flex flex-col text-center"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
      >
        <header className="p-4 flex justify-between items-center border-b border-violet-500/30">
          <h2 className="text-lg font-bold text-white">بثوث انستجرام</h2>
          <button 
            onClick={onClose} 
            aria-label="إغلاق النافذة"
            className="text-slate-300 bg-slate-800/70 hover:bg-fuchsia-500/80 hover:text-white rounded-full p-2 transition-all duration-300 transform hover:scale-110 shadow-lg border border-slate-600 hover:border-fuchsia-400"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="p-8">
            <InstagramIcon className="w-16 h-16 mx-auto mb-4 text-fuchsia-400" />
            <h3 className="text-xl font-bold text-slate-100 mb-2">
                اختر البث لمشاهدته
            </h3>
            <p className="text-slate-300 mb-6">
                سيتم فتح الرابط في نافذة جديدة لمشاهدة البث المباشر والمسجل.
            </p>
            <div className="space-y-3">
              {drhopeData.instagramLinks.length > 0 ? (
                drhopeData.instagramLinks.map(link => (
                  <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-x-2 bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-800/40 text-sm border border-fuchsia-500/20"
                  >
                      <InstagramIcon className="w-5 h-5" />
                      <span>{link.title}</span>
                  </a>
                ))
              ) : (
                 <p className="text-slate-400">لم يتم إضافة روابط بثوث بعد.</p>
              )}
            </div>
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

export default InstagramModal;
