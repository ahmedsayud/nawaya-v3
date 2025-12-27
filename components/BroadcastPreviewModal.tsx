import React from 'react';
import { CloseIcon, PaperAirplaneIcon, EyeIcon } from './icons';
import { BroadcastCampaign } from '../types';

interface BroadcastPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  channel: 'email' | 'notification' | 'whatsapp';
  recipientsCount: number;
  subject?: string;
  messageHtml?: string;
  notificationMessage?: string;
  whatsappTitle?: string;
  whatsappMessage?: string;
  whatsappAttachment?: { dataUrl: string; file: File } | null;
  signature?: string;
}

const BroadcastPreviewModal: React.FC<BroadcastPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  channel,
  recipientsCount,
  subject,
  messageHtml,
  notificationMessage,
  whatsappTitle,
  whatsappMessage,
  whatsappAttachment,
  signature,
}) => {
  if (!isOpen) return null;

  const renderContent = () => {
    switch (channel) {
      case 'email':
        const fullHtml = (messageHtml || '') + (signature || '');
        return (
          <div className="bg-white text-black rounded-lg w-full flex-grow overflow-hidden">
            <div className="p-3 bg-slate-100 border-b border-slate-300 text-sm">
                <p><strong>الموضوع:</strong> {subject || '(بدون موضوع)'}</p>
            </div>
            <iframe 
                srcDoc={`
                    <!DOCTYPE html><html><head>
                    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">
                    <style>body { font-family: 'Noto Sans Arabic', sans-serif, Arial; direction: rtl; text-align: right; color: #333; margin: 0; padding: 20px; line-height: 1.6; } a { color: #007bff; } hr { border: none; border-top: 1px solid #ccc; } img { max-width: 100%; height: auto; }</style>
                    </head><body>${fullHtml}</body></html>
                `}
                title="Email Preview"
                className="w-full h-full border-0"
            />
          </div>
        );
      case 'notification':
        return (
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 w-full text-center">
                <p className="text-white whitespace-pre-wrap">{notificationMessage}</p>
            </div>
        );
      case 'whatsapp':
        return (
            <div className="bg-green-900/50 p-4 rounded-lg border border-green-700/50 w-full max-w-sm mx-auto">
                {whatsappAttachment && whatsappAttachment.file.type.startsWith('image/') && (
                    <img src={whatsappAttachment.dataUrl} alt="attachment preview" className="rounded-md mb-2 max-h-48" />
                )}
                {whatsappAttachment && !whatsappAttachment.file.type.startsWith('image/') && (
                    <div className="bg-slate-700 p-2 rounded-md mb-2 text-xs">مرفق: {whatsappAttachment.file.name}</div>
                )}
                <div className="text-white whitespace-pre-wrap">
                    {whatsappTitle && <p className="font-bold">{whatsappTitle}</p>}
                    <p>{whatsappMessage}</p>
                </div>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-yellow-500/50 rounded-lg shadow-xl w-full max-w-3xl h-[90vh] flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-yellow-500/50">
          <h3 className="text-lg font-bold text-yellow-300 flex items-center gap-x-2"><EyeIcon className="w-6 h-6"/> معاينة الرسالة</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
        </header>

        <div className="p-6 flex-grow overflow-y-auto flex flex-col items-center justify-center">
            {renderContent()}
        </div>

        <footer className="p-4 flex justify-between items-center border-t border-yellow-500/50 bg-black/20">
            <p className="text-sm text-slate-300">سيتم إرسال هذه الرسالة إلى <span className="font-bold text-white">{recipientsCount}</span> مستلم.</p>
            <div className="flex items-center gap-x-4">
                <button onClick={onClose} className="py-2 px-4 rounded-md bg-slate-600 hover:bg-slate-500 font-bold text-sm">إلغاء</button>
                <button onClick={onConfirm} className="py-2 px-6 rounded-md bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-sm flex items-center gap-x-2">
                    <PaperAirplaneIcon className="w-5 h-5"/>
                    <span>تأكيد وإرسال</span>
                </button>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default BroadcastPreviewModal;
