import React, { useState, useEffect } from 'react';
import { User, Subscription, Workshop } from '../types';
import { CloseIcon, PrintIcon, DownloadIcon } from './icons';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';

interface CertificateModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    subscription: Subscription;
    workshop?: Workshop;
}

// Function to sanitize HTML - remove scripts and dangerous elements
const sanitizeHtml = (html: string): string => {
    // Remove script tags and their content
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Remove onclick and other event handlers
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    // Remove javascript: URLs
    sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
    // Remove target="_blank" to prevent opening new tabs
    sanitized = sanitized.replace(/target\s*=\s*["']_blank["']/gi, '');
    return sanitized;
};

export const CertificateModal: React.FC<CertificateModalProps> = ({ isOpen, onClose, user, subscription, workshop }) => {
    const [certificateUrl, setCertificateUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchCertificate = async () => {
            if (!isOpen) return;

            setIsLoading(true);
            setError('');
            setCertificateUrl('');

            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    setError('يرجى تسجيل الدخول أولا');
                    setIsLoading(false);
                    return;
                }

                // Handle both "sub-123" format and raw numeric ID
                const rawId = String(subscription.id);
                const subscriptionId = rawId.startsWith('sub-') ? rawId.replace('sub-', '') : rawId;

                const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.CERTIFICATE(subscriptionId)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/pdf, text/html'
                    }
                });

                if (response.ok) {
                    const contentType = response.headers.get('content-type');

                    if (contentType?.includes('application/pdf')) {
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        setCertificateUrl(url);
                    } else {
                        // Fallback for text/html or generic binary
                        const blob = await response.blob();
                        const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                        setCertificateUrl(url);
                    }
                } else {
                    setError(`فشل تحميل الشهادة (${response.status})`);
                }
            } catch (err) {
                console.error('[CertificateModal] Error fetching certificate:', err);
                setError('حدث خطأ أثناء تحميل الشهادة');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCertificate();

        return () => {
            if (certificateUrl) {
                URL.revokeObjectURL(certificateUrl);
            }
        };
    }, [isOpen, subscription.id]);

    if (!isOpen) return null;

    const handlePrint = () => {
        if (certificateUrl) {
            const printWindow = window.open(certificateUrl);
            if (printWindow) {
                printWindow.print();
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[100] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 text-black rounded-lg shadow-2xl w-full max-w-5xl border border-yellow-500/50 h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 bg-slate-800 flex justify-between items-center flex-shrink-0 rounded-t-lg">
                    <h2 className="text-lg font-bold text-white">شهادة إتمام الورشة</h2>
                    <div className="flex items-center gap-x-3">
                        {certificateUrl && (
                            <>
                                <a
                                    href={certificateUrl}
                                    download={`Certificate-${user.fullName.replace(/\s/g, '_')}.pdf`}
                                    className="flex items-center gap-x-2 py-2 px-3 rounded-md bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-yellow-500/30 transition-all transform hover:scale-105 border border-yellow-500/20"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                    <span>تحميل</span>
                                </a>
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-x-2 py-2 px-3 rounded-md bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-500/30 transition-all transform hover:scale-105 border border-fuchsia-500/20"
                                >
                                    <PrintIcon className="w-5 h-5" />
                                    <span>طباعة</span>
                                </button>
                            </>
                        )}
                        <button onClick={onClose} className="p-2 rounded-full text-white hover:bg-white/10">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                <div className="flex-grow bg-slate-700 relative h-full">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
                                <p className="mt-4 text-slate-300">جاري تحميل الشهادة...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-red-400">
                                <p className="text-xl mb-2">⚠️</p>
                                <p>{error}</p>
                            </div>
                        </div>
                    ) : (
                        <iframe
                            src={certificateUrl}
                            className="w-full h-full rounded-b-lg border-0 bg-white"
                            title="Certificate Preview"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CertificateModal;
