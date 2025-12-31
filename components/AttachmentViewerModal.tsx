import React, { useState, useEffect } from 'react';
import { CloseIcon, DownloadIcon, PrintIcon } from './icons';
import { NoteResource } from '../types';

interface AttachmentViewerModalProps {
  note: NoteResource | null;
  onClose: () => void;
}

const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({ note, onClose }) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const isPdf = note?.name.toLowerCase().endsWith('.pdf') || note?.value.toLowerCase().endsWith('.pdf') || (note?.value.startsWith('data:application/pdf'));

  useEffect(() => {
    const fetchPdf = async () => {
      if (!note || !isPdf) return;

      // For data URLs, we don't need to fetch
      if (note.value.startsWith('data:')) {
        // Try to get page count from data URL if possible later
        return;
      }

      setIsLoading(true);
      setFetchFailed(false);
      try {
        const response = await fetch(note.value);
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);

          // Attempt to get page count using a simple PDF parser or pdf.js
          try {
            // We can try to load pdf.js dynamically to get the count
            const pdfjs = await import('pdfjs-dist');
            pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

            const arrayBuffer = await blob.arrayBuffer();
            const loadingTask = pdfjs.getDocument(arrayBuffer);
            const pdf = await loadingTask.promise;
            setTotalPages(pdf.numPages);
          } catch (e) {
            // Silently fail if pdf.js count fails, we still have the iframe
          }
        } else {
          setFetchFailed(true);
        }
      } catch (err) {
        setFetchFailed(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPdf();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [note, isPdf]);

  if (!note) return null;

  const isDataUrl = note.value.startsWith('data:');
  const displayUrl = isDataUrl ? note.value : (pdfUrl || note.value);

  const handlePrint = () => {
    if (displayUrl) {
      const pureUrl = displayUrl.split('#')[0];
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '-1000px';
      iframe.style.bottom = '-1000px';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = pureUrl;

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.error('Print failed:', e);
            // Fallback to opening in new window if printing from hidden iframe is blocked
            window.open(pureUrl, '_blank');
          }
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        }, 500);
      };
      document.body.appendChild(iframe);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    // For the download, we use a hidden link to trigger it
    if (!displayUrl) return;
    const pureUrl = displayUrl.split('#')[0];

    // If it's a blob or data URL, we can download it directly
    const link = document.createElement('a');
    link.href = pureUrl;
    link.download = note.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
            <p className="mt-4 text-slate-300">جاري تحميل الملف...</p>
          </div>
        </div>
      );
    }

    // Handle Image Preview
    if (note.value.startsWith('data:image/') || note.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return <img src={note.value} alt={note.name} className="max-w-full max-h-full object-contain mx-auto" />;
    }

    // Handle PDF Preview
    if (isPdf) {
      return (
        <div className="w-full h-full bg-white">
          <iframe
            src={`${displayUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
            className="w-full h-full border-0"
            title={note.name}
          />
        </div>
      );
    }

    // Fallback for old link-based attachments, using Google Docs viewer
    if (!isDataUrl && (note.name.toLowerCase().match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/))) {
      const viewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(note.value)}&embedded=true`;
      return <iframe src={viewUrl} className="w-full h-full border-0" title={note.name}></iframe>;
    }

    // For other file types, offer download
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <p className="text-lg font-bold text-white mb-2">المعاينة غير متاحة لهذا الملف</p>
        <p className="text-slate-300 mb-6">يمكنك تحميل الملف لعرضه.</p>
        <button
          onClick={handleDownload}
          className="bg-theme-gradient-btn text-white font-bold py-2 px-6 rounded-lg transition-transform transform hover:scale-105 flex items-center gap-x-2"
        >
          <DownloadIcon className="w-5 h-5" />
          تحميل {note.name}
        </button>
      </div>
    );
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
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-white truncate pr-4">{note.name}</h2>
            {totalPages !== null && (
              <span className="text-xs text-fuchsia-300 font-bold px-4">
                عدد الصفحات: {totalPages}
              </span>
            )}
          </div>
          <div className="flex items-center gap-x-3">
            {isPdf && !isLoading && (
              <div className="flex items-center gap-x-2 ml-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-x-2 py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-all border border-white/10"
                >
                  <PrintIcon className="w-4 h-4" />
                  <span>طباعة</span>
                </button>
                <a
                  href={displayUrl.split('#')[0]}
                  download={note.name}
                  onClick={(e) => {
                    if (displayUrl.startsWith('blob:') || displayUrl.startsWith('data:')) {
                      // Let native download happen for BLOBS/DATA
                    } else {
                      // For remote, handleDownload handles it better or we just let it be
                      handleDownload(e);
                    }
                  }}
                  className="flex items-center gap-x-2 py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-all border border-white/10"
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span>تحميل</span>
                </a>
              </div>
            )}
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="text-slate-300 bg-slate-800/70 hover:bg-pink-500/80 hover:text-white rounded-full p-2 transition-all"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </header>
        <div className="flex-grow p-1 bg-gray-800 overflow-hidden">
          {renderContent()}
        </div>
      </div>
      <style>{`
        .z-80 { z-index: 80; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AttachmentViewerModal;
