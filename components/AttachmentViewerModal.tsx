import React, { useState, useEffect } from 'react';
import { CloseIcon, DownloadIcon } from './icons';
import { NoteResource } from '../types';

interface AttachmentViewerModalProps {
  note: NoteResource;
  onClose: () => void;
}

const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({ note, onClose }) => {
  const fileName = note.name || 'ملف';
  const displayUrl = note.value;
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName) || displayUrl.startsWith('data:image');
  const isPdf = /\.pdf$/i.test(fileName) || fileName.toLowerCase().includes('pdf');

  const handleDownload = (e?: React.MouseEvent) => {
    if (!displayUrl) return;
    const pureUrl = displayUrl.split('#')[0];
    const link = document.createElement('a');
    link.href = pureUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If it's a PDF and user wants no display, we can just trigger download and close
  useEffect(() => {
    if (isPdf) {
      handleDownload();
      onClose();
    }
  }, [isPdf]);

  if (isPdf) return null; // Modal will close itself via useEffect

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-slate-900/80 rounded-t-2xl border-b border-white/10 backdrop-blur-md">
          <div className="flex flex-col">
            <h3 className="text-white font-bold text-lg truncate max-w-[200px] sm:max-w-md" title={fileName}>
              {fileName}
            </h3>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-grow bg-slate-800/50 rounded-b-2xl overflow-hidden flex items-center justify-center min-h-[300px] relative">
          {isImage ? (
            <img
              src={displayUrl}
              alt={fileName}
              className="max-w-full max-h-[70vh] object-contain shadow-2xl"
              onContextMenu={(e) => e.preventDefault()}
            />
          ) : (
            <div className="text-center p-12">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <DownloadIcon className="w-10 h-10 text-white/50" />
              </div>
              <p className="text-white font-bold mb-4">هذا النوع من الملفات غير متاح للمعاينة المباشرة</p>
              <button
                onClick={() => handleDownload()}
                className="bg-theme-gradient-btn text-white font-bold py-2 px-6 rounded-xl hover:scale-105 transition-transform"
              >
                تحميل الملف الآن
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentViewerModal;
