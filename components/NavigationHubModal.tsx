
import React from 'react';
import { UserCircleIcon, VideoIcon, AcademicCapIcon, UsersIcon } from './icons';

interface NavigationHubModalProps {
  isOpen: boolean;
  userFullName?: string;
  onNavigate: (target: 'new' | 'recorded' | 'profile' | 'live') => void;
  hasActiveLiveStream?: boolean;
}

interface NavigationButtonProps {
    onClick: () => void;
    icon: React.FC<{className?: string}>;
    title: string;
    subtitle?: string;
    isLive?: boolean;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({ onClick, icon: Icon, title, subtitle, isLive }) => (
    <button 
        onClick={onClick}
        className={`relative group backdrop-blur-lg border rounded-2xl p-6 text-center transition-all duration-300 overflow-hidden ${
            isLive 
            ? 'bg-gradient-to-b from-purple-900/80 to-fuchsia-900/80 border-fuchsia-500 shadow-[0_0_30px_rgba(219,39,119,0.3)] hover:scale-105' 
            : 'bg-theme-gradient-card border-slate-700 hover:border-fuchsia-400/80 hover:-translate-y-2 hover:shadow-2xl hover:shadow-fuchsia-500/30'
        }`}
    >
        {/* Live Indicator Badge */}
        {isLive && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse border border-red-400/50 tracking-wider z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                <span>LIVE NOW</span>
            </div>
        )}

        {/* Glowing orb effect */}
        <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl transition-opacity duration-500 ${isLive ? 'bg-red-500/20 opacity-50' : 'bg-fuchsia-500/20 opacity-0 group-hover:opacity-100'}`}></div>
        
        <div className="relative">
            <div className={`relative mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full border-2 transition-colors ${
                isLive 
                ? 'bg-red-500/20 border-red-500 text-red-200' 
                : 'bg-slate-800/50 border-slate-600 group-hover:border-fuchsia-400/50'
            }`}>
                <Icon className={`w-8 h-8 transition-transform duration-300 group-hover:scale-110 ${isLive ? 'text-white' : 'text-fuchsia-300'}`} />
            </div>
            <h3 className={`text-base font-bold mb-1 transition-colors ${isLive ? 'text-white' : 'text-white group-hover:text-fuchsia-300'}`}>{title}</h3>
            {subtitle && (
                <p className={`mt-1 text-[13px] ${isLive ? 'text-fuchsia-200' : 'text-slate-400'}`}>
                    {subtitle}
                </p>
            )}
        </div>
    </button>
);


const NavigationHubModal: React.FC<NavigationHubModalProps> = ({ isOpen, userFullName, onNavigate, hasActiveLiveStream }) => {
  if (!isOpen) {
    return null;
  }

  const handleNavigation = (target: 'new' | 'recorded' | 'profile' | 'live') => {
    onNavigate(target);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
      <div 
        style={{ animation: 'fade-in-up 0.5s ease-out forwards' }} 
        className="bg-theme-gradient backdrop-blur-2xl text-slate-200 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl relative border border-violet-500/50 opacity-0"
      >
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-400 to-violet-400">
            أهلاً بك{userFullName && `, ${userFullName.split(' ')[0]}`}
          </h2>
          <p className="text-slate-300 sm:text-lg mb-8">إلى أين تود الذهاب؟</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <NavigationButton 
            onClick={() => handleNavigation('live')}
            icon={VideoIcon}
            title={hasActiveLiveStream ? "دخول البث الآن" : "ورش البث المباشر"}
            subtitle={hasActiveLiveStream ? "اضغط للانضمام فوراً" : "( خاص بالمشتركات )"}
            isLive={hasActiveLiveStream}
          />
          <NavigationButton 
            onClick={() => handleNavigation('profile')}
            icon={UserCircleIcon}
            title="ملفي الشخصي"
            subtitle="( خاص بالمشتركات )"
          />
          <NavigationButton 
            onClick={() => handleNavigation('new')}
            icon={AcademicCapIcon}
            title="استكشف الورش"
            subtitle="( التسجيل في الورش )"
          />
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default NavigationHubModal;
