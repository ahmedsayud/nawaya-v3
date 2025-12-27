import React from 'react';
import { CloseIcon } from './icons';
import { useUser } from '../context/UserContext';

interface PhotoAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PhotoAlbumModal: React.FC<PhotoAlbumModalProps> = ({ isOpen, onClose }) => {
  const { drhopeData } = useUser();
  if (!isOpen) return null;

  const images = drhopeData.photos && drhopeData.photos.length > 0
    ? drhopeData.photos
    : Array.from({ length: 9 }, (_, i) => `https://picsum.photos/400/400?random=${i + 1}`);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-theme-gradient backdrop-blur-2xl rounded-lg shadow-2xl w-full max-w-3xl border border-violet-500/50 relative max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
      >
        <header className="p-4 flex justify-between items-center border-b border-violet-500/30 flex-shrink-0">
          <h2 className="text-lg font-bold text-white">ألبوم الصور</h2>
          <button 
            onClick={onClose} 
            aria-label="إغلاق النافذة"
            className="text-slate-300 bg-slate-800/70 hover:bg-fuchsia-500/80 hover:text-white rounded-full p-2 transition-all duration-300 transform hover:scale-110 shadow-lg border border-slate-600 hover:border-fuchsia-400"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="p-6 overflow-y-auto">
           {images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((src, index) => (
                <div key={index} className="aspect-square bg-slate-800 rounded-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
                  <img 
                    src={src} 
                    alt={`Gallery image ${index + 1}`} 
                    className="w-full h-full object-cover" 
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          ) : (
             <p className="text-center text-slate-400 py-8">لم يتم إضافة صور بعد.</p>
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

export default PhotoAlbumModal;
