
import React, { useState, useMemo } from 'react';
import { Workshop, Package } from '../types';
import { CloseIcon, HeartIcon, GiftIcon, UserIcon, PlusCircleIcon, TrashIcon, UserAddIcon, ArrowRightIcon } from './icons';
import { useUser } from '../context/UserContext';
import { toEnglishDigits } from '../utils';

interface UnifiedGiftModalProps {
    workshop: Workshop;
    selectedPackage: Package | null;
    onClose: () => void;
    onBack?: () => void;
    onProceed: (data: { type: 'friend' | 'fund'; recipients?: any[]; giftMessage?: string; seats?: number; totalAmount: number }) => void;
}

interface Recipient {
    id: number;
    name: string;
    phone: string;
    countryCode: string;
}

const UnifiedGiftModal: React.FC<UnifiedGiftModalProps> = ({ workshop, selectedPackage, onClose, onBack, onProceed }) => {
    const [activeTab, setActiveTab] = useState<'friend' | 'fund'>('friend');

    // Friend Gift State (Multiple individual recipients)
    const [friendRecipients, setFriendRecipients] = useState<Recipient[]>([
        { id: Date.now(), name: '', phone: '', countryCode: '' }
    ]);

    // Fund Gift State - Starts at 0 now
    const [fundSeats, setFundSeats] = useState(0);
    const [error, setError] = useState('');

    const pricePerSeat = selectedPackage?.discountPrice ?? selectedPackage?.price ?? workshop.price ?? 0;

    // --- Friend Logic ---
    const addRecipientField = () => {
        setFriendRecipients(prev => [
            ...prev,
            { id: Date.now(), name: '', phone: '', countryCode: '' }
        ]);
    };

    const removeRecipientField = (id: number) => {
        if (friendRecipients.length > 1) {
            setFriendRecipients(prev => prev.filter(r => r.id !== id));
        }
    };

    const updateRecipient = (id: number, field: keyof Recipient, value: string) => {
        setFriendRecipients(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    // --- Totals ---
    const totalAmount = useMemo(() => {
        const count = activeTab === 'friend' ? friendRecipients.length : fundSeats;
        return count * pricePerSeat;
    }, [activeTab, friendRecipients.length, fundSeats, pricePerSeat]);

    const handleProceed = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (activeTab === 'friend') {
            // Validate all fields
            const invalidRecipient = friendRecipients.find(r => !r.name.trim() || !r.phone.trim() || !r.countryCode);
            if (invalidRecipient) {
                setError('يرجى تعبئة الاسم ورقم الهاتف والدولة لجميع الصديقات.');
                return;
            }

            const formattedRecipients = friendRecipients.map(r => ({
                name: r.name,
                whatsapp: r.countryCode === 'OTHER' ? r.phone : r.countryCode + r.phone
            }));

            onProceed({
                type: 'friend',
                recipients: formattedRecipients,
                giftMessage: '',
                totalAmount: totalAmount
            });
        } else {
            if (fundSeats <= 0) {
                setError('يرجى تحديد مقعد واحد على الأقل للمساهمة.');
                return;
            }
            onProceed({
                type: 'fund',
                seats: fundSeats,
                totalAmount: totalAmount
            });
        }
    };

    const inputClass = "w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-fuchsia-500 transition-colors text-sm";
    const labelClass = "block text-xs font-bold text-fuchsia-300 mb-1.5 text-right";

    return (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-[#2e0235] via-[#3b0764] to-[#4c1d95] w-full max-w-2xl rounded-2xl shadow-2xl border border-fuchsia-500/30 flex flex-col max-h-[90vh] animate-fade-in-up">

                {/* Header */}
                <header className="p-5 flex justify-between items-center border-b border-fuchsia-500/20 flex-shrink-0 bg-black/20">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <GiftIcon className="w-6 h-6 text-fuchsia-400" />
                        <span>إهداء مقعد</span>
                    </h3>
                    {onBack ? (
                        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors transform hover:-translate-x-1">
                            <ArrowRightIcon className="w-6 h-6" />
                        </button>
                    ) : (
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    )}
                </header>

                {/* Tabs */}
                <div className="p-4 flex gap-3 bg-black/20">
                    <button
                        onClick={() => setActiveTab('friend')}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 border ${activeTab === 'friend' ? 'bg-purple-800 border-purple-600 text-white shadow-[0_0_15px_rgba(107,33,168,0.4)]' : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5'}`}
                    >
                        <UserIcon className="w-5 h-5" />
                        <span>لصديقة (أو أكثر)</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('fund')}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 border ${activeTab === 'fund' ? 'bg-purple-800 border-purple-600 text-white shadow-[0_0_15px_rgba(107,33,168,0.4)]' : 'bg-transparent border-transparent text-slate-400 hover:bg-white/5'}`}
                    >
                        <HeartIcon className="w-5 h-5" />
                        <span>صندوق الدعم</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
                    {activeTab === 'friend' ? (
                        <div className="space-y-6 animate-fade-in">

                            {/* Info Box */}
                            <div className="bg-fuchsia-900/20 border border-fuchsia-500/30 p-4 rounded-xl text-center">
                                <p className="text-slate-200 text-sm leading-relaxed">
                                    يمكنك إضافة أكثر من صديقة. سيتم إرسال الهدية لكل واحدة منهن بشكل منفصل.
                                </p>
                            </div>

                            {/* Recipients List */}
                            <div className="space-y-4">
                                {friendRecipients.map((recipient, index) => (
                                    <div key={recipient.id} className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700/50 relative group">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-sm font-bold text-slate-400">الصديقة رقم {index + 1}</span>
                                            {friendRecipients.length > 1 && (
                                                <button
                                                    onClick={() => removeRecipientField(recipient.id)}
                                                    className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded transition-colors"
                                                >
                                                    <TrashIcon className="w-3 h-3" /> حذف
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="order-2 md:order-1">
                                                <label className={labelClass}>رقم الواتساب</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="tel"
                                                        value={recipient.phone}
                                                        onChange={e => updateRecipient(recipient.id, 'phone', toEnglishDigits(e.target.value).replace(/\D/g, ''))}
                                                        className={`${inputClass} ltr-input`}
                                                        placeholder="5xxxxxxx"
                                                        dir="ltr"
                                                    />
                                                    <select
                                                        value={recipient.countryCode}
                                                        onChange={e => updateRecipient(recipient.id, 'countryCode', e.target.value)}
                                                        className={`${inputClass} w-32`}
                                                    >
                                                        <option value="" className="text-gray-500 bg-white" style={{ color: '#6b7280', backgroundColor: 'white' }}>الدولة</option>
                                                        {useUser().countries.map(c => <option key={c.id} value={c.code} className="text-black bg-white" style={{ color: 'black', backgroundColor: 'white' }}>{c.name}</option>)}
                                                        <option value="OTHER" className="text-black bg-white" style={{ color: 'black', backgroundColor: 'white' }}>أخرى</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="order-1 md:order-2">
                                                <label className={labelClass}>الاسم</label>
                                                <input
                                                    type="text"
                                                    value={recipient.name}
                                                    onChange={e => updateRecipient(recipient.id, 'name', e.target.value)}
                                                    className={inputClass}
                                                    placeholder="الاسم الثنائي..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Add More Button */}
                            <button
                                onClick={addRecipientField}
                                className="w-full py-4 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-fuchsia-500 hover:bg-fuchsia-500/10 transition-all flex items-center justify-center gap-2 font-bold"
                            >
                                <PlusCircleIcon className="w-5 h-5" />
                                <span>إضافة صديقة أخرى</span>
                            </button>

                            {error && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-500/20">{error}</p>}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in text-center pt-8">
                            <div className="bg-fuchsia-900/20 p-6 rounded-2xl border border-fuchsia-500/30">
                                <HeartIcon className="w-16 h-16 text-fuchsia-400 mx-auto mb-4 animate-pulse" />
                                <h4 className="text-lg font-bold text-white mb-2">ساهم في نشر المعرفة</h4>
                                <p className="text-slate-300 text-sm leading-relaxed">
                                    سيتم إضافة هذه المقاعد إلى صندوق الدعم لمنحها للمستحقين من الراغبين بالحضور وغير القادرين مادياً.
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-6 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 w-fit mx-auto shadow-inner">
                                <button onClick={() => setFundSeats(Math.max(0, fundSeats - 1))} className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-bold text-2xl transition-colors shadow-lg">-</button>
                                <div className="text-center min-w-[100px]">
                                    <p className="text-5xl font-bold text-white">{fundSeats}</p>
                                    <p className="text-sm text-slate-400 mt-1">مقاعد</p>
                                </div>
                                <button onClick={() => setFundSeats(fundSeats + 1)} className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-2xl transition-colors shadow-lg shadow-purple-900/30">+</button>
                            </div>

                            {error && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-500/20">{error}</p>}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="p-5 border-t border-fuchsia-500/20 bg-black/40 rounded-b-2xl">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <span className="text-slate-300 text-lg">الإجمالي:</span>
                        <span className="text-2xl font-bold text-white tracking-wider">{totalAmount.toFixed(2)} <span className="text-base font-normal text-fuchsia-400">درهم</span></span>
                    </div>
                    <button
                        onClick={handleProceed}
                        className="w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 border border-fuchsia-500/20"
                    >
                        {activeTab === 'friend' ? <GiftIcon className="w-6 h-6" /> : <HeartIcon className="w-6 h-6" />}
                        <span>متابعة الدفع ({activeTab === 'friend' ? 'إهداء' : 'دعم'})</span>
                    </button>
                </footer>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
};

export default UnifiedGiftModal;
