import React, { useState } from 'react';
import { CloseIcon, ChevronDownIcon } from './icons';
import { NoteResource } from '../types';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface AttachmentViewerModalProps {
  note: NoteResource | null;
  onClose: () => void;
}

const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({ note, onClose }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState(1.0);

  if (!note) return null;

  const isDataUrl = note.value.startsWith('data:');
  const mimeType = isDataUrl ? note.value.substring(note.value.indexOf(':') + 1, note.value.indexOf(';')) : '';
  const isPdf = note.name.toLowerCase().endsWith('.pdf') || note.value.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf';

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => Math.min(Math.max(1, prevPageNumber + offset), numPages || 1));
  };

  const renderContent = () => {
    if (isPdf) {
      return (
        <div className="flex flex-col items-center justify-start min-h-full bg-slate-900/50 p-4 select-none" onContextMenu={(e) => e.preventDefault()}>
          <div className="relative pdf-container shadow-2xl border border-slate-700">
            {/* Overlay to prevent dragging/saving images */}
            <div className="absolute inset-0 z-10 bg-transparent" onContextMenu={(e) => e.preventDefault()}></div>

            <Document
              file={note.value}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="flex items-center justify-center p-12 text-white"><div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div></div>}
              error={<div className="text-red-400 p-8">فشل تحميل ملف PDF. ربما يكون الرابط غير صالح.</div>}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="pdf-page"
              />
            </Document>
          </div>

          {/* PDF Controls */}
          {numPages && (
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-slate-800/90 backdrop-blur border border-slate-700 rounded-full px-6 py-3 shadow-xl z-50">
              <button
                onClick={() => changePage(-1)}
                disabled={pageNumber <= 1}
                className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors"
              >
                <ChevronDownIcon className="w-5 h-5 rotate-90" />
              </button>

              <span className="text-white font-mono dir-ltr">
                {pageNumber} / {numPages}
              </span>

              <button
                onClick={() => changePage(1)}
                disabled={pageNumber >= numPages}
                className="p-2 hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors"
              >
                <ChevronDownIcon className="w-5 h-5 -rotate-90" />
              </button>

              <div className="w-px h-6 bg-slate-600 mx-2"></div>

              <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="text-xl text-white px-2 hover:text-fuchsia-400">-</button>
              <button onClick={() => setScale(s => Math.min(2.5, s + 0.1))} className="text-xl text-white px-2 hover:text-fuchsia-400">+</button>
            </div>
          )}
        </div>
      );
    }

    // Image viewer
    if (isDataUrl && mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full select-none" onContextMenu={(e) => e.preventDefault()}>
          <img src={note.value} alt={note.name} className="max-w-full max-h-full object-contain mx-auto pointer-events-none" />
        </div>
      );
    }

    // Fallback for other files (potentially hide download if strictly secure, but for now just show message)
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <p className="text-lg font-bold text-white mb-2">المعاينة غير متاحة لهذا الملف</p>
        <p className="text-slate-400 text-sm">هذا النوع من الملفات لا يدعم المعاينة الآمنة.</p>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 flex justify-center items-center z-[80] p-0 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="w-full h-full flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fade-in-up 0.3s ease-out forwards' }}
      >
        <header className="p-4 flex justify-between items-center bg-slate-900/80 backdrop-blur border-b border-white/10 absolute top-0 left-0 right-0 z-50">
          <h2 className="text-base font-bold text-white truncate pr-4">{note.name}</h2>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="text-slate-300 bg-white/10 hover:bg-red-500/80 hover:text-white rounded-full p-2 transition-all"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-grow pt-20 pb-24 overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {renderContent()}
        </div>
      </div>
      <style>{`
        .z-80 { z-index: 80; }
        .pdf-page canvas {
            max-width: 100%;
            height: auto !important;
            margin: 0 auto;
            display: block;
        }
      `}</style>
    </div>
  );
};

export default AttachmentViewerModal;
