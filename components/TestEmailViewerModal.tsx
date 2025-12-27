import React from 'react';
import { useUser } from '../context/UserContext';
import { CloseIcon } from './icons';

interface TestEmailViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: string;
  messageHtml: string;
  title?: string;
  isHistoryView?: boolean;
}

const TestEmailViewerModal: React.FC<TestEmailViewerModalProps> = ({ 
  isOpen, 
  onClose, 
  subject, 
  messageHtml, 
  title,
  isHistoryView = false 
}) => {
  const { drhopeData } = useUser();

  if (!isOpen) return null;

  const fullHtml = isHistoryView ? messageHtml : messageHtml + (drhopeData.signature || '');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-80 p-4">
      <div className="bg-white text-black rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <header className="p-4 bg-slate-100 flex justify-between items-center border-b border-slate-300 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {title || (isHistoryView ? 'معاينة رسالة من السجل' : 'معاينة رسالة تجريبية')}
            </h2>
            <p className="text-sm text-slate-600">
                <strong>من:</strong> info@nawayaevent.com
            </p>
            <p className="text-sm text-slate-600">
                <strong>الموضوع:</strong> {subject || '(بدون موضوع)'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-600 hover:bg-slate-200">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="flex-grow p-1 bg-white overflow-y-auto">
            <iframe 
                srcDoc={`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">
                        <style>
                            body { 
                                font-family: 'Noto Sans Arabic', sans-serif, Arial; 
                                direction: rtl;
                                text-align: right;
                                color: #333;
                                margin: 0;
                                padding: 20px;
                                line-height: 1.6;
                            }
                            a { color: #007bff; }
                            hr { border: none; border-top: 1px solid #ccc; }
                            img { max-width: 100%; height: auto; }
                        </style>
                    </head>
                    <body>
                        ${fullHtml}
                    </body>
                    </html>
                `}
                title="Email Preview"
                className="w-full h-full border-0"
            />
        </div>
      </div>
      <style>{`.z-80 { z-index: 80; }`}</style>
    </div>
  );
};

export default TestEmailViewerModal;
