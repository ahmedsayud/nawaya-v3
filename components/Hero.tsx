
import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { isWorkshopExpired } from '../utils';

interface HeroProps {
    onExploreClick: () => void;
    onOpenWorkshopDetails: (workshopId: number) => void;
    onLoginRequest: () => void;
    workshop?: any;
}

const CountdownUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="flex flex-col items-center transition-all hover:scale-110 group px-2">
        <span className="text-2xl sm:text-4xl font-black bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent leading-none tracking-tighter">
            {value.toString().padStart(2, '0')}
        </span>
        <span className="text-[10px] sm:text-[11px] text-fuchsia-600 font-extrabold mt-2 uppercase tracking-widest group-hover:text-pink-500 transition-colors">{label}</span>
    </div>
);

const Hero: React.FC<HeroProps> = ({ onExploreClick, onOpenWorkshopDetails, onLoginRequest, workshop: passedWorkshop }) => {
    const { workshops, earliestWorkshop } = useUser();

    const displayWorkshop = useMemo(() => {
        // Higher priority: Use the workshop passed from parent (synced with LiveStreamCard)
        if (passedWorkshop) {
            return {
                ...passedWorkshop,
                // Ensure internal date/time keys match what the countdown expects
                start_date: passedWorkshop.startDate || passedWorkshop.start_date,
                start_time: passedWorkshop.startTime || passedWorkshop.start_time
            };
        }

        const getWorkshopDate = (w: any) => {
            const dateStr = w.startDate || w.start_date;
            const timeStr = w.startTime || w.start_time;
            if (!dateStr) return new Date(8640000000000000); // Far future

            try {
                const normTime = parseArabicTime(timeStr);
                const [h, m] = normTime.split(':').map(p => parseInt(p));
                const dParts = dateStr.split(/[-/]/).map(p => parseInt(p));
                let y, mo, d;
                if (dParts[0] > 1000) [y, mo, d] = dParts;
                else[d, mo, y] = dParts;
                return new Date(y, mo - 1, d, h, m, 0);
            } catch (e) { return new Date(8640000000000000); }
        };

        const now = new Date();
        const upcoming = workshops
            .filter(w => w.isVisible && !w.isRecorded)
            .map(w => ({ ...w, targetDate: getWorkshopDate(w) }))
            .filter(w => w.targetDate.getTime() + (4 * 60 * 60 * 1000) > now.getTime()) // Still live if started < 4h ago
            .sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime());

        const candidate = upcoming[0] || null;

        if (candidate && earliestWorkshop && Number(earliestWorkshop.id) === Number(candidate.id)) {
            return {
                ...candidate,
                zoomLink: earliestWorkshop.online_link || candidate.zoomLink,
                startDate: earliestWorkshop.start_date || candidate.startDate,
                startTime: earliestWorkshop.start_time || candidate.startTime,
                is_subscribed: earliestWorkshop.is_subscribed,
                requires_authentication: earliestWorkshop.requires_authentication,
                instructor: earliestWorkshop.instructor || candidate.instructor
            };
        }

        if (candidate) return candidate;

        return null;
    }, [workshops, earliestWorkshop, passedWorkshop]);

    const calculateDiff = (targetDate: Date) => {
        const difference = +targetDate - +new Date();
        if (difference > 0) {
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    // Parse time format like "مساءً 11:40", "صباحاً 9:30", "am 9:00", "5:00 PM"
    const parseArabicTime = (timeStr: string): string => {
        if (!timeStr) return "00:00";

        const cleanTime = timeStr.toLowerCase().trim();
        // If already in HH:MM format, return as is
        if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
            return cleanTime;
        }

        const isPM = cleanTime.includes('مساءً') || cleanTime.includes('pm');
        const isAM = cleanTime.includes('صباحاً') || cleanTime.includes('am');

        const timeMatch = cleanTime.match(/(\d{1,2}):(\d{2})/);
        if (!timeMatch) return "00:00";

        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2];

        if (isPM && hours !== 12) {
            hours += 12;
        } else if (isAM && hours === 12) {
            hours = 0;
        } else if (!isPM && !isAM && hours >= 1 && hours <= 11) {
            // Default heuristic: if 1-11 and no indicator, assume PM for workshops
            hours += 12;
        }

        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    };

    const calculateTimeLeft = () => {
        if (!displayWorkshop) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        const datePart = displayWorkshop.start_date || (displayWorkshop as any).startDate || "";
        const timePart = displayWorkshop.start_time || (displayWorkshop as any).startTime || "";

        if (!datePart || !timePart) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

        try {
            const normalizedTime = parseArabicTime(timePart);
            const dParts = datePart.split(/[-/]/).map(p => parseInt(p));
            const tParts = normalizedTime.split(':').map(p => parseInt(p));

            if (dParts.some(isNaN) || tParts.some(isNaN)) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

            let year, month, day;
            if (dParts[0] > 1000) { [year, month, day] = dParts; }
            else { [day, month, year] = dParts; }

            const target = new Date(year, month - 1, day, tParts[0], tParts[1], tParts[2] || 0);
            const now = new Date();
            const diffMs = target.getTime() - now.getTime();

            if (diffMs > 0) {
                return {
                    days: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diffMs / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((diffMs / (1000 * 60)) % 60),
                    seconds: Math.floor((diffMs / 1000) % 60)
                };
            }
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        } catch (e) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
    };

    const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

    useEffect(() => {
        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [displayWorkshop]);

    const handleAction = () => {
        if (displayWorkshop.is_subscribed && (displayWorkshop as any).online_link) {
            window.open((displayWorkshop as any).online_link, '_blank');
        } else if (displayWorkshop.requires_authentication) {
            onLoginRequest();
        } else if (displayWorkshop.id) {
            onOpenWorkshopDetails(displayWorkshop.id);
        } else {
            onExploreClick();
        }
    };

    const btnClasses = "bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold py-2.5 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg text-xs sm:text-sm flex items-center justify-center gap-2 group mx-auto font-bold";

    return (
        <section className="hero-section relative text-center pt-24 pb-8 overflow-hidden flex flex-col justify-center min-h-[45vh]">
            <div className="container mx-auto px-4 relative z-10">
                <div className="animate-fade-in-up max-w-xl mx-auto px-4">
                    <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.08)] relative overflow-hidden text-slate-900 border border-slate-100">
                        <div className="relative z-10">
                            {displayWorkshop && (
                                <>
                                    <div className="inline-block mb-4">
                                        <span className="bg-fuchsia-100/50 text-fuchsia-600 text-[10px] font-extrabold px-3 py-1 rounded-full border border-fuchsia-100 uppercase tracking-widest flex items-center gap-1.5">
                                            ✨ الورشة القادمة
                                        </span>
                                    </div>

                                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 leading-tight tracking-tight">
                                        {displayWorkshop.title}
                                    </h1>

                                    {displayWorkshop.instructor && (
                                        <p className="text-xs sm:text-sm text-slate-500 mb-10 font-bold">
                                            <span className="text-fuchsia-600 ml-1">تقديم:</span>
                                            {displayWorkshop.instructor}
                                        </p>
                                    )}

                                    <div className="flex justify-center items-center gap-3 sm:gap-6 mb-10" dir="ltr">
                                        <CountdownUnit value={timeLeft.days || 0} label="أيام" />
                                        <div className="flex flex-col gap-2 mt-[-20px] opacity-20">
                                            <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
                                            <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
                                        </div>
                                        <CountdownUnit value={timeLeft.hours || 0} label="ساعات" />
                                        <div className="flex flex-col gap-2 mt-[-20px] opacity-20">
                                            <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
                                            <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
                                        </div>
                                        <CountdownUnit value={timeLeft.minutes || 0} label="دقائق" />
                                        <div className="flex flex-col gap-2 mt-[-20px] opacity-20">
                                            <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
                                            <div className="w-1.5 h-1.5 bg-slate-900 rounded-full"></div>
                                        </div>
                                        <CountdownUnit value={timeLeft.seconds || 0} label="ثواني" />
                                    </div>

                                    <button
                                        onClick={handleAction}
                                        className={btnClasses}
                                    >
                                        <span>{displayWorkshop.is_subscribed ? 'انضم للورشة الآن' : 'احجز مقعدك الآن'}</span>
                                        {displayWorkshop.is_subscribed ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform transition-transform group-hover:-translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                </>
                            )}
                            {!displayWorkshop && (
                                <>
                                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4 leading-tight tracking-tight">
                                        نلهمك لتكون أفضل نسخة من نفسك
                                    </h1>
                                    <p className="text-sm sm:text-base text-slate-600 mb-8 max-w-lg mx-auto leading-relaxed">
                                        اكتشفي شغفك وطوري مهاراتك في بيئة ملهمة وإيجابية.
                                    </p>
                                    <button
                                        onClick={onExploreClick}
                                        className={btnClasses}
                                    >
                                        <span>استكشفي الورش الآن </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform transition-transform group-hover:-translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
