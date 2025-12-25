
import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../types';
import { CloseIcon, CreditCardIcon, LockClosedIcon, BanknotesIcon, VisaIcon, MastercardIcon, GiftIcon, HeartIcon, ArrowRightIcon } from './icons';
import { useUser } from '../context/UserContext';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCardPaymentSubmit: () => void;
    onBankPaymentSubmit: () => void;
    itemTitle: string;
    itemPackageName?: string;
    amount: number;
    currentUser: User | null;
    onRequestLogin: (method: 'CARD' | 'BANK_TRANSFER') => void;
    paymentType: 'workshop' | 'consultation' | 'gift' | 'payItForward';
    paymentOptions?: { online_payment: boolean; bank_transfer: boolean };
    bankAccount?: {
        account_name: string;
        bank_name: string;
        IBAN_number: string;
        account_number: string;
        swift: string;
    };
    recipientDetails?: any;
    onBack?: () => void;
}

type PaymentMethod = 'CARD' | 'BANK_TRANSFER';

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onCardPaymentSubmit, onBankPaymentSubmit, itemTitle, itemPackageName, amount, currentUser, onRequestLogin, paymentType, paymentOptions, bankAccount, recipientDetails, onBack }) => {
    const { drhopeData } = useUser();

    const paymentSettings = useMemo(() => ({
        cardPaymentsEnabled: paymentOptions ? paymentOptions.online_payment : (drhopeData.paymentSettings?.cardPaymentsEnabled ?? true),
        bankTransfersEnabled: paymentOptions ? paymentOptions.bank_transfer : (drhopeData.paymentSettings?.bankTransfersEnabled ?? true),
    }), [drhopeData, paymentOptions]);

    const initialMethod = useMemo(() => {
        if (paymentType === 'gift' && paymentSettings.cardPaymentsEnabled) return 'CARD';
        if (paymentSettings.cardPaymentsEnabled) return 'CARD';
        if (paymentSettings.bankTransfersEnabled) return 'BANK_TRANSFER';
        return null;
    }, [paymentSettings, paymentType]);

    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(initialMethod);

    // Update selected method if initialMethod changes while modal is opening
    useEffect(() => {
        if (isOpen) setSelectedMethod(initialMethod);
    }, [isOpen, initialMethod]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardError, setCardError] = useState('');

    const isPaymentDisabled = useMemo(() => {
        if (amount === 0) return false;
        if (paymentType === 'gift') return !paymentSettings.cardPaymentsEnabled && !paymentSettings.bankTransfersEnabled;
        return !paymentSettings.cardPaymentsEnabled && !paymentSettings.bankTransfersEnabled;
    }, [paymentType, paymentSettings, amount]);

    if (isPaymentDisabled) {
        return (
            <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[70] p-4 backdrop-blur-sm">
                <div className="bg-gradient-to-br from-[#2e0235] to-[#4c1d95] text-slate-200 rounded-2xl shadow-2xl w-full max-w-lg border border-fuchsia-500/30 flex flex-col max-h-[90vh]">
                    <header className="p-4 flex justify-between items-center border-b border-fuchsia-500/30 flex-shrink-0">
                        <h2 className="text-xl font-bold text-white">إتمام عملية الدفع</h2>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors"><CloseIcon className="w-6 h-6" /></button>
                    </header>
                    <div className="p-6 text-center">
                        <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/30">
                            <p className="font-bold text-red-300 text-lg mb-2">طرق الدفع غير متاحة حالياً لهذا الخيار.</p>
                            <p className="text-sm text-red-200/70">نعتذر عن الإزعاج. يرجى المحاولة لاحقاً أو التواصل معنا.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isOpen) return null;



    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCardError('');

        if (!currentUser) {
            if (amount === 0 || selectedMethod) {
                onRequestLogin(selectedMethod || 'CARD');
            }
            return;
        }

        if (amount === 0) {
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                onCardPaymentSubmit();
            }, 1000);
            return;
        }

        if (selectedMethod === 'BANK_TRANSFER') {
            onBankPaymentSubmit();
        } else if (selectedMethod === 'CARD') {
            setIsProcessing(true);
            onCardPaymentSubmit();
        }
    };

    // Updated Method Button to darker gradient
    const methodButtonClass = (method: PaymentMethod) =>
        `flex-1 py-4 px-2 text-sm font-bold rounded-xl transition-all border flex items-center justify-center gap-x-2 relative overflow-hidden group ${selectedMethod === method
            ? 'bg-gradient-to-r from-purple-800 to-pink-600 border-pink-400 text-white shadow-lg shadow-purple-500/20'
            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
        }`;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[70] p-4 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-[#2e0235] via-[#3b0764] to-[#4c1d95] text-slate-200 rounded-2xl shadow-2xl w-full max-w-lg border border-fuchsia-500/30 flex flex-col max-h-[90vh] animate-fade-in-up">
                <header className="p-5 flex justify-between items-center border-b border-fuchsia-500/20 flex-shrink-0 bg-black/20">
                    <h2 className="text-xl font-bold flex items-center gap-x-2 text-white">
                        {paymentType === 'payItForward' && <HeartIcon className="w-6 h-6 text-pink-500" />}
                        <span>{amount === 0 ? 'تأكيد التسجيل المجاني' : 'إتمام عملية الدفع'}</span>
                    </h2>
                    {onBack ? (
                        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 transition-colors transform hover:-translate-x-1">
                            <ArrowRightIcon className="w-6 h-6" />
                        </button>
                    ) : (
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    )}
                </header>

                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <h3 className="text-xs font-bold text-pink-300 uppercase tracking-wider mb-2">
                            {paymentType === 'payItForward' ? 'تفاصيل المساهمة' : 'ملخص الطلب'}
                        </h3>
                        <p className="font-bold text-lg text-white">{itemTitle}</p>
                        {itemPackageName && <p className="text-sm text-slate-300 mt-1">الباقة: <span className="text-white">{itemPackageName}</span></p>}

                        {paymentType === 'gift' && recipientDetails?.recipients && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <h4 className="text-xs font-bold text-fuchsia-300 mb-2 uppercase tracking-wide">المهدى لهن:</h4>
                                <div className="space-y-1">
                                    {recipientDetails.recipients.map((r: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-400"></div>
                                            <span className="text-white font-medium">{r.name}</span>
                                            <span className="text-slate-400 text-xs">({r.whatsapp})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {paymentType === 'payItForward' && recipientDetails?.seats && (
                            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide">عدد المقاعد المتبرع بها:</h4>
                                <div className="bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                                    <span className="text-white font-bold">{recipientDetails.seats} مقاعد</span>
                                </div>
                            </div>
                        )}

                        <div className="text-center mt-6 pt-4 border-t border-white/10">
                            <p className="text-xs text-slate-400 font-medium">المبلغ الإجمالي للدفع</p>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400">{amount.toFixed(2)}</span>
                                <span className="text-sm font-bold text-yellow-500 mt-2">درهم</span>
                            </div>
                        </div>
                    </div>

                    {amount > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-300 mb-3 px-1">اختر طريقة الدفع</h3>
                            <div className="flex gap-4">
                                {paymentSettings.cardPaymentsEnabled && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedMethod('CARD');
                                            setIsProcessing(true);
                                            onCardPaymentSubmit();
                                        }}
                                        className={methodButtonClass('CARD')}
                                        disabled={isProcessing}
                                    >
                                        <CreditCardIcon className="w-6 h-6" /> <span>بطاقة بنكية</span>
                                    </button>
                                )}
                                {paymentSettings.bankTransfersEnabled && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedMethod('BANK_TRANSFER')}
                                        className={methodButtonClass('BANK_TRANSFER')}
                                        disabled={isProcessing}
                                    >
                                        <BanknotesIcon className="w-6 h-6" />
                                        <span>تحويل بنكي</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {amount > 0 && !paymentSettings.cardPaymentsEnabled && !paymentSettings.bankTransfersEnabled && paymentType !== 'gift' && (
                        <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30 text-center">
                            <p className="font-bold text-red-300">طرق الدفع غير متاحة مؤقتاً.</p>
                            <p className="text-sm text-red-200/70">يرجى التواصل معنا عبر الواتساب لإتمام الاشتراك.</p>
                        </div>
                    )}

                    <div>
                        {amount > 0 && selectedMethod === 'CARD' ? (
                            <div className="bg-black/20 p-8 rounded-2xl border border-fuchsia-500/20 text-center space-y-4">
                                <div className="w-16 h-16 bg-fuchsia-500/10 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <LockClosedIcon className="w-8 h-8 text-fuchsia-400" />
                                </div>
                                <h3 className="font-bold text-white text-lg">بوابة دفع آمنة</h3>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    سيتم تحويلك الآن إلى بوابة الدفع الخارجية لإتمام العملية بأمان.
                                </p>
                                <div className="flex items-center justify-center gap-4 pt-2 opacity-70">
                                    <VisaIcon className="w-10" />
                                    <MastercardIcon className="w-10" />
                                </div>
                            </div>
                        ) : amount > 0 && selectedMethod === 'BANK_TRANSFER' ? (
                            <div className="space-y-4 text-center">
                                <h3 className="font-bold text-pink-300 text-sm">تفاصيل الحساب البنكي للتحويل</h3>
                                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-3 text-right text-sm">
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-slate-400">اسم صاحب الحساب</span>
                                        <span className="font-bold text-white">{bankAccount?.account_name || drhopeData.accountHolderName || 'غير متوفر'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-slate-400">اسم البنك</span>
                                        <span className="font-bold text-white">{bankAccount?.bank_name || drhopeData.bankName || 'غير متوفر'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-slate-400">رقم IBAN</span>
                                        <span dir="ltr" className="font-mono text-pink-300 select-all">{bankAccount?.IBAN_number || drhopeData.ibanNumber || 'غير متوفر'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-slate-400">رقم الحساب</span>
                                        <span dir="ltr" className="font-mono text-white select-all">{bankAccount?.account_number || drhopeData.accountNumber || 'غير متوفر'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-2">
                                        <span className="text-slate-400">سويفت</span>
                                        <span dir="ltr" className="font-mono text-white select-all">{bankAccount?.swift || drhopeData.swiftCode || 'غير متوفر'}</span>
                                    </div>
                                </div>
                                <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/30 flex items-start gap-2 text-right">
                                    <span className="text-amber-400 text-lg">⚠️</span>
                                    <p className="text-xs font-bold text-amber-200/80 leading-relaxed">
                                        ملاحظة هامة: بعد التحويل، يرجى إرسال صورة من إثبات التحويل إلى رقم الواتساب لإتمام العملية.
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </form>

                <footer className="p-6 pt-2 flex-shrink-0 bg-black/20">
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isProcessing || (amount > 0 && !selectedMethod)}
                        className="w-full flex items-center justify-center gap-x-3 bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-purple-900/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-white/10"
                    >
                        {isProcessing ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        ) : (
                            amount === 0 ? (
                                <span>تأكيد التسجيل المجاني</span>
                            ) : selectedMethod === 'CARD' ? (
                                <>
                                    <LockClosedIcon className="w-5 h-5" />
                                    <span>دفع آمن {amount.toFixed(2)} درهم</span>
                                </>
                            ) : (
                                <span>لقد قمت بالتحويل، إرسال الإيصال</span>
                            )
                        )}
                    </button>
                    {amount > 0 && selectedMethod === 'CARD' && (
                        <div className="flex justify-center items-center gap-2 mt-3 opacity-60">
                            <LockClosedIcon className="w-3 h-3 text-slate-400" />
                            <p className="text-[10px] text-slate-400">جميع المعاملات مشفرة ومحمية بتقنية SSL</p>
                        </div>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default PaymentModal;
