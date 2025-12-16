
import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';
import { useUser } from '../context/UserContext';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose }) => {
  const { drhopeData } = useUser();
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && drhopeData.videos && drhopeData.videos.length > 0) {
      setSelectedVideoUrl(drhopeData.videos[0].url);
    } else {
      setSelectedVideoUrl(null);
    }
  }, [isOpen, drhopeData.videos]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-theme-gradient backdrop-blur-2xl rounded-lg shadow-2xl w-full max-w-3xl border border-violet-500/50 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
      >
        <header className="p-4 flex justify-between items-center border-b border-violet-500/30">
          <h2 className="text-lg font-bold text-white">عرض الفيديو</h2>
          <button 
            onClick={onClose} 
            aria-label="إغلاق النافذة"
            className="text-slate-300 bg-slate-800/70 hover:bg-fuchsia-500/80 hover:text-white rounded-full p-2 transition-all duration-300 transform hover:scale-110 shadow-lg border border-slate-600 hover:border-fuchsia-400"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="p-4">
          <div className="aspect-video bg-black rounded-lg">
            {selectedVideoUrl ? (
              <iframe 
                className="w-full h-full rounded-lg"
                src={selectedVideoUrl}
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                لم يتم إضافة فيديوهات بعد.
              </div>
            )}
          </div>
          {drhopeData.videos && drhopeData.videos.length > 1 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {drhopeData.videos.map(video => (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideoUrl(video.url)}
                  className={`py-2 px-4 rounded-md text-sm font-bold transition-colors ${selectedVideoUrl === video.url ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
                >
                  {video.title}
                </button>
              ))}
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

export default VideoModal;
