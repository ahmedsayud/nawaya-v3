import React from 'react';
import { CloseIcon, DownloadIcon } from './icons';
import { NoteResource } from '../types';

interface AttachmentViewerModalProps {
  note: NoteResource | null;
  onClose: () => void;
}

const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({ note, onClose }) => {
  if (!note) return null;

  const isDataUrl = note.value.startsWith('data:');

  const renderContent = () => {
    // Handle new file uploads (Data URLs)
    if (isDataUrl) {
      const mimeType = note.value.substring(note.value.indexOf(':') + 1, note.value.indexOf(';'));

      if (mimeType.startsWith('image/')) {
        return <img src={note.value} alt={note.name} className="max-w-full max-h-full object-contain mx-auto" />;
      }

      if (mimeType === 'application/pdf') {
        // Using <object> is more reliable for data: URL PDFs.
        return (
          <div className="w-full h-full flex justify-center py-4">
            <div className="A4-pdf-container bg-white shadow-lg">
              <object data={note.value} type="application/pdf" width="100%" height="100%">
                <p className="p-4 text-black">متصفحك لا يدعم عرض ملفات PDF. يمكنك <a href={note.value} download={note.name} className="text-fuchsia-600 hover:underline">تحميل الملف بدلاً من ذلك</a>.</p>
              </object>
            </div>
          </div>
        );
      }

      // For other file types, offer download as preview isn't possible.
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <p className="text-lg font-bold text-white mb-2">المعاينة غير متاحة لهذا الملف</p>
          <p className="text-slate-300 mb-6">يمكنك تحميل الملف لعرضه.</p>
          <a
            href={note.value}
            download={note.name}
            className="bg-theme-gradient-btn text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 flex items-center gap-x-2"
          >
            <DownloadIcon className="w-5 h-5" />
            تحميل {note.name}
          </a>
        </div>
      );
    }

    // Check if it's a PDF based on extension or content
    const isPdf = note.name.toLowerCase().endsWith('.pdf') || note.value.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      return (
        <div className="w-full h-full bg-white flex justify-center">
          <embed
            src={`${note.value}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            type="application/pdf"
            className="w-full h-full border-0"
          />
        </div>
      );
    }

    // Fallback for old link-based attachments, using Google Docs viewer
    const viewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(note.value)}&embedded=true`;
    return <iframe src={viewUrl} className="w-full h-full border-0" title={note.name}></iframe>;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-theme-gradient backdrop-blur-2xl rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] border border-fuchsia-500/50 relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
      >
        <header className="p-4 flex justify-between items-center border-b border-fuchsia-500/30 flex-shrink-0">
          <h2 className="text-lg font-bold text-white truncate pr-4">{note.name}</h2>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="text-slate-300 bg-slate-800/70 hover:bg-pink-500/80 hover:text-white rounded-full p-2 transition-all"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="flex-grow p-1 bg-gray-800 overflow-auto">
          {renderContent()}
        </div>
      </div>
      <style>{`
        .z-80 { z-index: 80; }
        .A4-pdf-container {
            width: 100%;
            max-width: 21cm; /* A4 width */
            aspect-ratio: 210 / 297; /* A4 portrait aspect ratio */
            margin-left: auto;
            margin-right: auto;
        }
      `}</style>
    </div>
  );
};

export default AttachmentViewerModal;
