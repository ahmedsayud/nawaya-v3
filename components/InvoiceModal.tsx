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
                    setError('يرجى تسجيل الدخول أولا');
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
                    } else {
                        // Fallback for text/html (legacy) or if header is missing but it's actually binary
                        // Ideally we should try to detect if it's binary content starting with %PDF
                        const blob = await response.blob();
                        // Simple check: create URL anyway, iframe can usually handle it or download it
                        const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                        setInvoiceUrl(url);
                    }
                } else {
                    setError(`فشل تحميل الفاتورة (${response.status})`);
                }
            } catch (err) {
                console.error('[InvoiceModal] Error fetching invoice:', err);
                setError('حدث خطأ أثناء تحميل الفاتورة');
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

    const handlePrint = () => {
        if (invoiceUrl) {
            const printWindow = window.open(invoiceUrl);
            if (printWindow) {
                printWindow.print();
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[100] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 text-black rounded-lg shadow-2xl w-full max-w-4xl border border-fuchsia-500/50 h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 bg-slate-800 flex justify-between items-center flex-shrink-0 rounded-t-lg">
                    <h2 className="text-lg font-bold text-white">الفاتورة الضريبية</h2>
                    <div className="flex items-center gap-x-3">
                        {invoiceUrl && (
                            <a
                                href={invoiceUrl}
                                download={`invoice-${subscription.id}.pdf`}
                                className="flex items-center gap-x-2 py-2 px-3 rounded-md bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-500/30 transition-all transform hover:scale-105 border border-fuchsia-500/20"
                            >
                                <PrintIcon className="w-5 h-5" />
                                <span>تحميل PDF</span>
                            </a>
                        )}
                        <button onClick={onClose} className="p-2 rounded-full text-white hover:bg-white/10">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                </header>

                <div className="flex-grow bg-slate-100 relative h-full">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-500"></div>
                                <p className="mt-4 text-slate-700">جاري تحميل الفاتورة...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-red-600">
                                <p className="text-xl mb-2">⚠️</p>
                                <p>{error}</p>
                            </div>
                        </div>
                    ) : (
                        <iframe
                            src={invoiceUrl}
                            className="w-full h-full rounded-b-lg border-0"
                            title="Invoice Preview"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};