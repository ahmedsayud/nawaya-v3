
import React from 'react';
import { CloseIcon, VideoIcon } from './icons';

interface ZoomRedirectModalProps {
  isOpen: boolean;
  zoomLink: string;
  onClose: () => void;
}

const ZoomRedirectModal: React.FC<ZoomRedirectModalProps> = ({ isOpen, zoomLink, onClose }) => {
  if (!isOpen) return null;

  const handleProceed = () => {
    // Open in a popup with no toolbar/location bar to reduce URL visibility
    // while maintaining reliability across devices (mobile/desktop)

    // We prioritize reliability over obfuscation here because users reported issues
    // with strict protocol links (zoommtg://) failing silently.

    const width = 800;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      zoomLink,
      'ZoomMeeting',
      `toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${width},height=${height},top=${top},left=${left}`
    );

    // If popup blocked or failed, fall back to simple new tab
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.open(zoomLink, '_blank', 'noopener,noreferrer');
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[70] p-4 transition-opacity"
      onClick={onClose}
    >
      <div
        className="bg-slate-900/70 backdrop-blur-2xl rounded-lg shadow-2xl w-full max-w-lg border border-fuchsia-500/50 relative flex flex-col text-center"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
      >
        <header className="p-4 flex justify-between items-center border-b border-fuchsia-500/30">
          <h2 className="text-lg font-bold text-white">الانتقال إلى زووم</h2>
          <button
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="text-slate-300 bg-slate-800/70 hover:bg-fuchsia-500/80 hover:text-white rounded-full p-2 transition-all duration-300 transform hover:scale-110 shadow-lg border border-slate-600 hover:border-fuchsia-400"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-fuchsia-500/20 rounded-full flex items-center justify-center">
            <VideoIcon className="w-8 h-8 text-fuchsia-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">
            الاستعداد للانضمام إلى البث المباشر
          </h3>
          <p className="text-slate-300 mb-6">
            سيتم الآن فتح تطبيق زووم للانضمام للاجتماع. إذا لم يكن لديك التطبيق، سيتم توجيهك لتنزيله. نحن في انتظارك!
          </p>
          <button
            onClick={handleProceed}
            className="inline-flex items-center justify-center gap-x-2 bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 text-sm border border-fuchsia-500/20"
          >
            <VideoIcon className="w-5 h-5" />
            <span>الانتقال إلى زووم</span>
          </button>
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

export default ZoomRedirectModal;
