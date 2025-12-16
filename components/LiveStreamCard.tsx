
import React from 'react';
import { User, SubscriptionStatus } from '../types';
import { VideoIcon, LoginIcon, InformationCircleIcon } from './icons';

interface LiveStreamCardProps {
    workshopId: number;
    workshopTitle: string;
    zoomLink: string;
    user: User | null;
    onLoginRequest: () => void;
    onZoomRedirect: (zoomLink: string, workshopId: number) => void;
    onShowToast: (message: string, type?: 'success' | 'warning' | 'error') => void;
    onShowHelp: () => void;
}

const LiveStreamCard: React.FC<LiveStreamCardProps> = ({ workshopId, workshopTitle, zoomLink, user, onLoginRequest, onZoomRedirect, onShowToast, onShowHelp }) => {
    
    const isSubscribed = user?.subscriptions.some(
        sub => sub.workshopId === workshopId && 
        sub.status !== SubscriptionStatus.REFUNDED && 
        !sub.isPayItForwardDonation
    );

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
            {/* Outer animated glow - Deep Purple to Pink */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500 animate-pulse"></div>
            
            {/* Main card - Dark Royal Gradient Background */}
            <div className="relative bg-gradient-to-br from-[#2e0235] via-[#4c1d95] to-[#701a75] rounded-2xl shadow-2xl shadow-black/50 p-5 sm:p-6 text-center flex flex-col items-center transform group-hover:-translate-y-1 transition-transform duration-300 border border-purple-500/30">

                <button 
                    onClick={onShowHelp}
                    className="absolute top-4 right-4 text-pink-300 hover:text-white transition-colors flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-white/5 px-2 py-1 rounded-full hover:bg-white/10"
                >
                    <InformationCircleIcon className="w-4 h-4" />
                    <span>كيف أدخل؟</span>
                </button>

                {/* Icon section with pulsing effect */}
                <div className="relative mb-4 mt-2">
                    <span className="absolute -inset-3 animate-ping rounded-full bg-purple-500 opacity-10"></span>
                    <div className="relative bg-white/10 p-4 rounded-full border border-purple-400/30 shadow-[0_0_15px_rgba(147,51,234,0.3)] backdrop-blur-md">
                        <VideoIcon className="w-8 h-8 sm:w-10 sm:h-10 text-pink-200 drop-shadow-md"/>
                    </div>
                </div>

                {/* Title with "LIVE" badge */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-3">
                    <span className="text-sm sm:text-base font-bold text-pink-100 tracking-wide">البث المباشر عبر ZOOM</span>
                    <span className="flex items-center gap-1.5 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg shadow-red-900/50 border border-red-400/50 tracking-wider">
                        <span className="w-1 h-1 rounded-full bg-white"></span>
                        LIVE
                    </span>
                </div>
                
                <h4 className="text-base sm:text-xl font-black text-white mb-2 leading-tight drop-shadow-lg">
                    {workshopTitle}
                </h4>

                <p className="text-slate-300 mb-6 max-w-sm text-xs sm:text-sm font-medium leading-relaxed">
                    انضم الآن لتجربة تفاعلية مباشرة. تأكد من أنك في مكان هادئ ومستعد للإلهام!
                </p>
                
                {/* Action button - Updated to Dark Mauve Theme */}
                <button
                    onClick={handleLinkClick}
                    className="inline-flex items-center justify-center gap-x-2 bg-gradient-to-r from-purple-800 to-pink-600 hover:from-purple-700 hover:to-pink-500 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-900/30 hover:shadow-pink-500/30 text-sm sm:text-base border border-white/10"
                >
                    <LoginIcon className="w-5 h-5" />
                    <span>الدخول إلى البث</span>
                </button>
                
                {/* Helper text */}
                {!user && <p className="text-pink-200/60 text-center mt-4 text-[10px] sm:text-xs font-medium">يجب تسجيل الدخول أولاً للتحقق من اشتراكك.</p>}
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
