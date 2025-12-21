import React from 'react';
import { CloseIcon, ShieldCheckIcon } from './icons';

interface PledgeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
    workshopTitle: string;
}

export const PledgeModal: React.FC<PledgeModalProps> = ({ isOpen, onClose, onAccept, workshopTitle }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-gradient-to-br from-[#270e4f] to-[#5b21b6] border border-white/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl transform transition-all animate-chatbot-in"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
            >
                {/* Header */}
                <div className="p-4 flex justify-between items-center border-b border-white/10">
                    <div className="flex items-center gap-x-2">
                        <span className="text-yellow-400 font-bold text-lg">ميثاق الأمانة</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto border border-yellow-400/20">
                        <ShieldCheckIcon className="w-12 h-12 text-yellow-400" />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white leading-tight">
                            تنبيه هام قبل مشاهدة تسجيل ورشة "{workshopTitle}"
                        </h3>

                        <p className="text-slate-200 text-base leading-relaxed font-medium">
                            أنت الآن على وشك مشاهدة محتوى خاص، نثق بك للحفاظ على أمانة هذا المحتوى وعدم مشاركته، أو تسجيله، أو التقاط صور للشاشة.
                        </p>

                        <p className="text-yellow-400 font-bold text-sm">
                            مشاهدتك تعني موافقتك على هذا الميثاق.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 mt-4">
                        <button
                            onClick={onAccept}
                            className="w-full bg-theme-gradient-btn text-white font-bold py-3.5 rounded-xl shadow-lg shadow-fuchsia-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            أوافق وأتابع المشاهدة
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full bg-white/5 hover:bg-white/10 text-white/80 font-bold py-3.5 rounded-xl border border-white/10 transition-all"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PledgeModal;
