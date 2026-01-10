import React, { useState, useEffect } from 'react';
import { User, Subscription, Workshop } from '../types';
import { CloseIcon, PrintIcon, DownloadIcon } from './icons';
import DynamicCertificateRenderer, {
    getProcessedCertificateTemplate,
    generateUserWorkshopCertificate
} from './DynamicCertificateRenderer';

interface CertificateModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    subscription: Subscription;
    workshop?: Workshop;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ isOpen, onClose, user, subscription, workshop }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string>('');
    const [processedTemplate, setProcessedTemplate] = useState<any>(null);
    const [previewWorkshop, setPreviewWorkshop] = useState<Workshop | null>(null);

    useEffect(() => {
        const preparePreview = async () => {
            if (!isOpen) return;

            setIsLoading(true);
            setError('');

            try {
                const targetWorkshop = workshop || (subscription as any).workshop;
                if (!targetWorkshop) {
                    setError('بيانات الورشة غير متوفرة');
                    setIsLoading(false);
                    return;
                }

                // Prepare the template and workshop data once
                const template = getProcessedCertificateTemplate(targetWorkshop);

                // Ensure location is formatted nicely for the renderer
                const enhancedWorkshop = {
                    ...targetWorkshop,
                    location: targetWorkshop.location === 'حضوري' && targetWorkshop.city
                        ? `${targetWorkshop.city}, ${targetWorkshop.country}`
                        : targetWorkshop.location
                };

                setProcessedTemplate(template);
                setPreviewWorkshop(enhancedWorkshop);
                setIsLoading(false);
            } catch (err) {
                console.error('Certificate preview preparation error:', err);
                setError('حدث خطأ أثناء تحضير معاينة الشهادة');
                setIsLoading(false);
            }
        };

        preparePreview();
    }, [isOpen, subscription.id, user, workshop]);

    const handleDownload = async () => {
        if (!previewWorkshop || isDownloading) return;

        setIsDownloading(true);
        try {
            const result = await generateUserWorkshopCertificate(user, previewWorkshop, subscription);
            if (!result.success) {
                alert('حدث خطأ أثناء تحميل الملف');
            }
        } catch (error) {
            console.error('Download error:', error);
            alert('حدث خطأ غير متوقع');
        } finally {
            setIsDownloading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[100] p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-yellow-500/50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-chatbot-in" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 bg-slate-800 border-b border-yellow-500/20 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                            <PrintIcon className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white leading-tight">معاينة الشهادة</h2>
                            <p className="text-xs text-slate-400">يمكنك مراجعة البيانات قبل التحميل</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 ">
                        {!isLoading && !error && (
                            <button
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-lg ${isDownloading
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    : 'bg-yellow-600 hover:bg-yellow-500 text-white hover:scale-105 active:scale-95'
                                    }`}
                            >
                                {isDownloading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>جاري التحميل...</span>
                                    </>
                                ) : (
                                    <>
                                        <DownloadIcon className="w-4 h-4" />
                                        <span>تحميل PDF</span>
                                    </>
                                )}
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                <div className="flex-grow overflow-auto bg-slate-800/50 p-4 md:p-8 flex justify-center items-center custom-scrollbar ">
                    {isLoading ? (
                        <div className="text-center ">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-yellow-500/20 border-t-yellow-500"></div>
                            <p className="mt-4 text-slate-400 font-bold">جاري تجهيز الشهادة...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-400 max-w-xs">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <p className="font-bold">{error}</p>
                            <button onClick={onClose} className="mt-4 text-sm text-slate-400 underline">إغلاق</button>
                        </div>
                    ) : (
                        <div className="w-full max-w-3xl shadow-[0_40px_80px_rgba(0,0,0,0.6)] border border-white/5 relative">
                            <div style={{ aspectRatio: `${processedTemplate.imageWidth} / ${processedTemplate.imageHeight}` }}>
                                <DynamicCertificateRenderer
                                    template={processedTemplate}
                                    workshop={previewWorkshop!}
                                    user={user}
                                    subscription={subscription}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <footer className="p-3 bg-slate-900/80 border-t border-white/5 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Nawaya Events Certification System</p>
                </footer>
            </div>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
            `}</style>
        </div>
    );
};

export default CertificateModal;
