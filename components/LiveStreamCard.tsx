import React, { useState, useEffect } from 'react';
import { User, SubscriptionStatus } from '../types';
import { VideoIcon, LoginIcon, InformationCircleIcon } from './icons';

interface LiveStreamCardProps {
    workshopId: number;
    workshopTitle: string;
    zoomLink: string;
    startDate?: string;
    startTime?: string;
    user: User | null;
    onLoginRequest: () => void;
    onZoomRedirect: (zoomLink: string, workshopId: number) => void;
    onShowToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
    onShowHelp: () => void;
}

const LiveStreamCard: React.FC<LiveStreamCardProps> = ({
    workshopId, workshopTitle, zoomLink, startDate, startTime,
    user, onLoginRequest, onZoomRedirect, onShowToast, onShowHelp
}) => {

    const isSubscribed = user?.subscriptions.some(
        sub => Number(sub.workshopId) === Number(workshopId) &&
            sub.status !== SubscriptionStatus.REFUNDED &&
            !sub.isPayItForwardDonation
    );

    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, mins: number, secs: number } | null>(null);

    useEffect(() => {
        if (!startDate || !startTime) return;

        const parseTime = (timeStr: string) => {
            if (!timeStr) return [0, 0];
            const cleanTime = timeStr.toLowerCase().trim();
            const isPM = cleanTime.includes('pm') || cleanTime.includes('مساءً');
            const isAM = cleanTime.includes('am') || cleanTime.includes('صباحاً');

            const match = cleanTime.match(/(\d{1,2}):(\d{2})/);
            if (!match) return [0, 0];

            let hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);

            if (isPM && hours !== 12) hours += 12;
            else if (isAM && hours === 12) hours = 0;
            else if (!isPM && !isAM && hours >= 1 && hours <= 11) {
                // Heuristic: if no AM/PM, and hours 1-11, usually it's PM for events
                // But let's be safe and only convert if it matches common patterns
            }

            return [hours, minutes];
        };

        const calculate = () => {
            try {
                if (!startDate || !startTime) return;

                const dParts = startDate.split(/[-/]/).map(p => parseInt(p));
                const [hours, minutes] = parseTime(startTime);

                if (dParts.some(isNaN)) {
                    setTimeLeft(null);
                    return;
                }

                let year, month, day;
                if (dParts[0] > 1000) {
                    [year, month, day] = dParts;
                } else if (dParts[2] > 1000) {
                    [day, month, year] = dParts;
                } else {
                    setTimeLeft(null);
                    return;
                }

                const target = new Date(year, month - 1, day, hours, minutes, 0);
                const now = new Date();
                const diff = target.getTime() - now.getTime();

                if (diff > 0) {
                    setTimeLeft({
                        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                        mins: Math.floor((diff / 1000 / 60) % 60),
                        secs: Math.floor((diff / 1000) % 60)
                    });
                } else {
                    setTimeLeft(null);
                }
            } catch (e) {
                console.error("Card countdown failed", e);
                setTimeLeft(null);
            }
        };

        calculate();
        const timer = setInterval(calculate, 1000);
        return () => clearInterval(timer);
    }, [startDate, startTime]);

    const handleLinkClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!user) {
            e.preventDefault();
            onLoginRequest();
            return;
        }

        if (!isSubscribed) {
            e.preventDefault();
            onShowToast(`عفواً، الوصول إلى بث ورشة "${workshopTitle}" متاح فقط للمشتركين.`, 'warning');
        } else {
            onZoomRedirect(zoomLink, workshopId);
        }
    };

    return (
        <div className="group relative max-w-lg mx-auto my-6 sm:my-8">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500 animate-pulse"></div>

            <div className="relative bg-gradient-to-br from-[#2e0235] via-[#4c1d95] to-[#701a75] rounded-2xl shadow-2xl shadow-black/50 p-5 sm:p-6 text-center flex flex-col items-center transform group-hover:-translate-y-1 transition-transform duration-300 border border-purple-500/30">

                <button
                    onClick={onShowHelp}
                    className="absolute top-4 right-4 text-pink-300 hover:text-white transition-colors flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-white/5 px-2 py-1 rounded-full hover:bg-white/10"
                >
                    <InformationCircleIcon className="w-4 h-4" />
                    <span>كيف أدخل؟</span>
                </button>

                <div className="relative mb-4 mt-2">
                    <span className="absolute -inset-3 animate-ping rounded-full bg-purple-500 opacity-10"></span>
                    <div className="relative bg-white/10 p-4 rounded-full border border-purple-400/30 shadow-[0_0_15px_rgba(147,51,234,0.3)] backdrop-blur-md">
                        <VideoIcon className="w-8 h-8 sm:w-10 sm:h-10 text-pink-200 drop-shadow-md" />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-3">
                    <span className="text-sm sm:text-base font-bold text-pink-100 tracking-wide">البث المباشر عبر ZOOM</span>
                    <span className="flex items-center gap-1.5 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg shadow-red-900/50 border border-red-400/50 tracking-wider">
                        <span className="w-1 h-1 rounded-full bg-white"></span>
                        LIVE
                    </span>
                </div>

                <h4 className="text-xl sm:text-2xl font-black text-white mb-2 leading-tight drop-shadow-lg">
                    {workshopTitle}
                </h4>

                <p className="text-slate-200 mb-6 max-w-sm text-xs sm:text-sm font-bold leading-relaxed">
                    انضم الآن لتجربة تفاعلية مباشرة. البث بدأ بالفعل!
                </p>

                {(!timeLeft || !zoomLink) && (
                    <div className="flex flex-col items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10 w-full mb-6">
                        <div className="flex items-center gap-2 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                            <InformationCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                            <span className="text-base sm:text-lg font-black tracking-tight">رابط البث سيظهر قريباً</span>
                        </div>
                        <p className="text-[12px] sm:text-sm text-slate-100 font-bold leading-relaxed mb-1">
                            استعدوا لرحلة ملهمة
                        </p>
                        <div dir="ltr" className="text-[10px] sm:text-xs text-slate-400 font-medium leading-relaxed">
                            {(() => {
                                if (!startTime || !startDate) return "";
                                const cleanTime = startTime.toLowerCase().trim();
                                const timeMatch = cleanTime.match(/(\d{1,2}:\d{2})/);
                                const amPmMatch = cleanTime.match(/(pm|am|مساءً|صباحاً)/);
                                const time = timeMatch ? timeMatch[1] : cleanTime;
                                const amPm = amPmMatch ? (amPmMatch[1] === 'مساءً' ? 'pm' : amPmMatch[1] === 'صباحاً' ? 'am' : amPmMatch[1]) : '';
                                return (
                                    <div className="flex items-center gap-2 justify-center">
                                        <span className="text-slate-100 font-bold">{`${amPm} ${time} | ${startDate}`}</span>
                                        <div className="flex items-center gap-2 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/20 shadow-inner">
                                            <span className="text-sm" role="img" aria-label="UAE Flag">🇦🇪</span>
                                            <span className="text-xs font-black text-slate-300 uppercase tracking-tighter">UAE</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {!timeLeft && zoomLink && (
                    <button
                        onClick={handleLinkClick}
                        className="inline-flex items-center justify-center gap-x-2 bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-900/30 hover:shadow-pink-500/30 text-sm sm:text-base border border-white/10"
                    >
                        <LoginIcon className="w-5 h-5" />
                        <span>الدخول إلى البث</span>
                    </button>
                )}

                {!user && <p className="text-pink-200/60 text-center mt-4 text-[10px] sm:text-xs font-bold">يجب تسجيل الدخول أولاً للتحقق من اشتراكك.</p>}
                {user && !isSubscribed && (
                    <div className="mt-4 flex items-center gap-2 text-amber-300 bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-500/30">
                        <span className="text-base">⚠️</span>
                        <p className="text-[10px] sm:text-xs font-bold">للوصول إلى البث، يرجى الاشتراك في هذه الورشة أولاً.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveStreamCard;
