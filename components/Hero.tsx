
import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { isWorkshopExpired } from '../utils';

interface HeroProps {
    onExploreClick: () => void;
    onOpenWorkshopDetails: (workshopId: number) => void;
}

const CountdownUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="flex flex-col items-center mx-1.5 sm:mx-2">
        <span className="text-lg sm:text-xl font-bold text-black tracking-tight">
            {value.toString().padStart(2, '0')}
        </span>
        <span className="text-[8px] text-slate-500 uppercase tracking-wide mt-0.5 font-bold">{label}</span>
    </div>
);

const Hero: React.FC<HeroProps> = ({ onExploreClick, onOpenWorkshopDetails }) => {
    const { workshops, drhopeData } = useUser();

    const nextWorkshop = useMemo(() => {
        const upcomingWorkshops = workshops
            .filter(w => w.isVisible && !w.isRecorded && !isWorkshopExpired(w))
            .sort((a, b) => new Date(`${a.startDate}T${a.startTime}:00Z`).getTime() - new Date(`${b.startDate}T${b.startTime}:00Z`).getTime());
        return upcomingWorkshops[0];
    }, [workshops]);

    const calculateTimeLeft = () => {
        if (!nextWorkshop) return null;

        const targetDate = new Date(`${nextWorkshop.startDate}T${nextWorkshop.startTime}:00Z`);
        const difference = +targetDate - +new Date();

        let timeLeft: { days?: number; hours?: number; minutes?: number; seconds?: number } | null = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        } else {
            timeLeft = null; // Countdown finished
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        if (!nextWorkshop) return;

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [nextWorkshop]);

    const btnClasses = "bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold py-1.5 px-5 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md text-[10px] sm:text-xs flex items-center justify-center gap-2 group mx-auto";

    return (
        <section className="hero-section relative text-center pt-24 pb-8 overflow-hidden min-h-[40vh] flex flex-col justify-center">

            <div className="container mx-auto px-4 relative z-10">
                {nextWorkshop && timeLeft ? (
                    <div className="animate-fade-in-up max-w-xl mx-auto">
                        {/* White Card Container for Black Text visibility */}
                        <div className="bg-white rounded-xl p-4 shadow-xl relative overflow-hidden text-slate-900 border border-slate-100">

                            <div className="relative z-10">
                                <div className="inline-block mb-2">
                                    <span className="bg-fuchsia-100 text-fuchsia-700 text-[8px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                                        ✨ الورشة القادمة
                                    </span>
                                </div>

                                <h1 className="text-lg sm:text-xl font-black text-black mb-1 leading-snug">
                                    {nextWorkshop.title}
                                </h1>

                                <p className="text-[10px] sm:text-xs text-slate-600 mb-4 font-bold flex items-center justify-center gap-1">
                                    <span className="text-fuchsia-600">تقديم:</span>
                                    {nextWorkshop.instructor}
                                </p>

                                {/* Countdown with Black Numbers and Small Font */}
                                <div className="flex justify-center items-start gap-2 sm:gap-3 mb-4" dir="ltr">
                                    <CountdownUnit value={timeLeft.days || 0} label="أيام" />
                                    <span className="text-lg sm:text-xl font-light text-slate-300 mt-[-2px]">:</span>
                                    <CountdownUnit value={timeLeft.hours || 0} label="ساعات" />
                                    <span className="text-lg sm:text-xl font-light text-slate-300 mt-[-2px]">:</span>
                                    <CountdownUnit value={timeLeft.minutes || 0} label="دقائق" />
                                    <span className="text-lg sm:text-xl font-light text-slate-300 mt-[-2px]">:</span>
                                    <CountdownUnit value={timeLeft.seconds || 0} label="ثواني" />
                                </div>

                                <button
                                    onClick={() => onOpenWorkshopDetails(nextWorkshop.id)}
                                    className={btnClasses}
                                >
                                    <span>احجز مقعدك الآن</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 transform transition-transform group-hover:-translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-4 max-w-xl mx-auto">
                        <div className="bg-white rounded-xl p-5 shadow-xl border border-slate-100">
                            <h1 className="text-xl sm:text-2xl font-black mb-2 text-black leading-tight">
                                {drhopeData?.introText || "نوايا.. حيث يبدأ الأثر"}
                            </h1>
                            <p className="text-[10px] sm:text-xs text-slate-600 max-w-md mx-auto mb-4 font-medium leading-relaxed">
                                اكتشف ورش عمل مباشرة ومسجلة تمنحك المهارات والمعرفة لتحقيق أهدافك.
                            </p>
                            <button
                                onClick={onExploreClick}
                                className={btnClasses}
                            >
                                <span>تصفح جميع الورش</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 transform transition-transform group-hover:-translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default Hero;
