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

                        // Trigger immediate download and close as requested
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `Certificate-${user.fullName.replace(/\s/g, '_')}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        onClose();
                    }
                } else {
                    setError(`فشل تحميل الشهادة (${response.status})`);
                }
            } catch (err) {

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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[100] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 text-black rounded-lg shadow-2xl w-full max-w-md border border-yellow-500/50 flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 bg-slate-800 flex justify-between items-center flex-shrink-0 rounded-t-lg">
                    <h2 className="text-lg font-bold text-white">شهادة إتمام الورشة</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-white hover:bg-white/10">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="bg-slate-700 relative min-h-[300px] rounded-b-lg">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
                                <p className="mt-4 text-slate-300">جاري تحميل الشهادة...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-red-400 p-8">
                                <p className="text-xl mb-2">⚠️</p>
                                <p>{error}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                            <div className="text-center p-8">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-lg font-bold text-white">تم تحميل الشهادة بنجاح</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CertificateModal;
