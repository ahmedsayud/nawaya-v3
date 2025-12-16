import React, { useState, useEffect } from 'react';
import { User, Subscription, Workshop } from '../types';
import { CloseIcon, PrintIcon, DownloadIcon } from './icons';

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
    const [certificateHtml, setCertificateHtml] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchCertificate = async () => {
            if (!isOpen) return;

            setIsLoading(true);
            setError('');

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
                console.log('[CertificateModal] Fetching certificate for subscription:', subscriptionId);

                const response = await fetch(`/api/profile/subscription/${subscriptionId}/certificate`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'text/html'
                    }
                });

                console.log('[CertificateModal] Response status:', response.status);

                if (response.ok) {
                    const html = await response.text();
                    console.log('[CertificateModal] HTML length:', html.length);
                    console.log('[CertificateModal] HTML preview:', html.substring(0, 500));
                    // Sanitize the HTML to remove scripts and dangerous elements
                    const sanitizedHtml = sanitizeHtml(html);
                    setCertificateHtml(sanitizedHtml);
                } else {
                    const errorText = await response.text();
                    console.error('[CertificateModal] Error response:', errorText);
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
    }, [isOpen, subscription.id]);

    if (!isOpen) return null;

    const handlePrint = () => {
        const printContents = document.getElementById('printable-certificate')?.innerHTML;
        if (printContents) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>شهادة - ${user.fullName}</title>
                        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700;900&display=swap" rel="stylesheet">
                        <style>
                            body { 
                                font-family: 'Noto Sans Arabic', sans-serif;
                                direction: rtl;
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                                margin: 0;
                                padding: 0;
                            }
                            @page {
                                size: landscape;
                                margin: 0;
                            }
                        </style>
                    </head>
                    <body>${printContents}</body>
                    </html>
                `);
                printWindow.document.close();
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
        }
    };

    const handleDownload = async () => {
        const certificateElement = document.getElementById('printable-certificate');
        if (!certificateElement) return;

        // Check if html2canvas is available
        if (typeof (window as any).html2canvas === 'undefined') {
            // Fallback to print
            handlePrint();
            return;
        }

        try {
            const canvas = await (window as any).html2canvas(certificateElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: null,
            });

            // Create download link
            const link = document.createElement('a');
            link.download = `Certificate-${user.fullName.replace(/\s/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('Error downloading certificate:', err);
            // Fallback to print
            handlePrint();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[100] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 text-black rounded-lg shadow-2xl w-full max-w-5xl border border-yellow-500/50 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 bg-slate-800 flex justify-between items-center flex-shrink-0 rounded-t-lg">
                    <h2 className="text-lg font-bold text-white">شهادة إتمام الورشة</h2>
                    <div className="flex items-center gap-x-3">
                        {certificateHtml && (
                            <>
                                <button
                                    onClick={handleDownload}
                                    className="flex items-center gap-x-2 py-2 px-3 rounded-md bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-yellow-500/30 transition-all transform hover:scale-105 border border-yellow-500/20"
                                >
                                    <DownloadIcon className="w-5 h-5" />
                                    <span>تحميل</span>
                                </button>
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

                <div className="flex-grow p-4 overflow-y-auto bg-slate-700">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full min-h-[400px]">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
                                <p className="mt-4 text-slate-300">جاري تحميل الشهادة...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full min-h-[400px]">
                            <div className="text-center text-red-400">
                                <p className="text-xl mb-2">⚠️</p>
                                <p>{error}</p>
                            </div>
                        </div>
                    ) : certificateHtml ? (
                        <div
                            id="printable-certificate"
                            className="bg-white mx-auto shadow-2xl rounded-lg overflow-hidden"
                            style={{
                                direction: 'rtl',
                                maxWidth: '100%',
                            }}
                            dangerouslySetInnerHTML={{ __html: certificateHtml }}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default CertificateModal;
