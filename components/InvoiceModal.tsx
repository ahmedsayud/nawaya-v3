import React, { useState, useEffect } from 'react';
import { User, Subscription, Workshop } from '../types';
import { CloseIcon, PrintIcon } from './icons';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';

interface InvoiceModalProps {
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

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, user, subscription, workshop }) => {
    const [invoiceUrl, setInvoiceUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const fetchInvoice = async () => {
            if (!isOpen) return;

            setIsLoading(true);
            setError('');
            setInvoiceUrl('');

            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    setError('يرجى تسجيل الدخول أولاً');
                    setIsLoading(false);
                    return;
                }

                // Handle both "sub-123" format and raw numeric ID
                const rawId = String(subscription.id);
                const subscriptionId = rawId.startsWith('sub-') ? rawId.replace('sub-', '') : rawId;

                const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PROFILE.INVOICE(subscriptionId)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        // Accept PDF or HTML
                        'Accept': 'application/pdf, text/html'
                    }
                });

                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    // Treat as PDF if it's application/pdf or if we see the raw PDF header in the body
                    if (contentType?.includes('application/pdf')) {
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        setInvoiceUrl(url);

                        // Trigger immediate download and close as requested
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `invoice-${subscription.id}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        onClose();
                    } else {
                        // Fallback for text/html (legacy) or if header is missing but it's actually binary
                        const blob = await response.blob();
                        const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                        setInvoiceUrl(url);

                        // Trigger immediate download and close as requested
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `invoice-${subscription.id}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        onClose();
                    }
                } else {
                    // For any error (400, 404, 500 etc), show a friendly message
                    setError('الفاتورة غير متوفرة حالياً، يرجى مراجعتها لاحقاً.');
                }
            } catch (err) {
                setError('الفاتورة غير متوفرة حالياً، يرجى مراجعتها لاحقاً.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvoice();

        // Cleanup function to revoke object URL
        return () => {
            if (invoiceUrl) {
                URL.revokeObjectURL(invoiceUrl);
            }
        };
    }, [isOpen, subscription.id]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[100] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 text-black rounded-lg shadow-2xl w-full max-w-md border border-fuchsia-500/50 flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 bg-slate-800 flex justify-between items-center flex-shrink-0 rounded-t-lg">
                    <h2 className="text-lg font-bold text-white">تفاصيل الفاتورة</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-white hover:bg-white/10">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="bg-slate-100 relative min-h-[300px] rounded-b-lg">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
                                <p className="mt-4 text-slate-700 font-bold">جاري تحميل الفاتورة...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                            <div className="text-center p-8">
                                <div className="w-24 h-24 bg-fuchsia-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <svg className="w-12 h-12 text-fuchsia-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">{error}</h3>
                                <p className="text-slate-500 text-sm">سيتم توفير تفاصيل الفاتورة فور اكتمال معالجة البيانات. يمكنك المحاولة مرة أخرى لاحقاً.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                            <div className="text-center p-8">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-lg font-bold text-slate-800">تم تحميل الفاتورة بنجاح</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
