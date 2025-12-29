import React, { useState } from 'react';
import { CloseIcon, LockClosedIcon } from './icons';

interface PaymentFrameModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
}

const PaymentFrameModal: React.FC<PaymentFrameModalProps> = ({ isOpen, onClose, url }) => {
    const [isLoading, setIsLoading] = useState(true);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white/90 text-slate-900 rounded-2xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col relative overflow-hidden animate-fade-in-up border border-white/20 backdrop-blur-md">
                {/* Header */}
                <header className="p-4 flex justify-between items-center border-b border-slate-100/50 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <LockClosedIcon className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800">بوابة الدفع الآمنة</h2>
                            <p className="text-[10px] text-slate-500">بياناتك مشفرة ومحمية</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </header>

                {/* Content */}
                <div className="flex-grow relative bg-slate-50/50">
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-fuchsia-100 border-t-fuchsia-600 mb-4"></div>
                            <p className="text-sm text-slate-500 font-medium">جاري الاتصال ببوابة الدفع...</p>
                        </div>
                    )}
                    <iframe
                        src={url}
                        className="w-full h-full border-0"
                        title="Payment Page"
                        onLoad={() => setIsLoading(false)}
                        allow="payment"
                    />
                </div>
            </div>
        </div>
    );
};

export default PaymentFrameModal;
