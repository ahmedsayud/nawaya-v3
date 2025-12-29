
import React from 'react';
import { useUser } from '../context/UserContext';

interface IntroAnimationProps {
  stage: 'loading' | 'welcome';
}

const IntroAnimation: React.FC<IntroAnimationProps> = ({ stage }) => {
  const { drhopeData } = useUser();
  const introText = drhopeData.introText || 'يُحِبُّهُمْ وَيُحِبُّونَهُۥٓ';

  return (
    <div className="fixed inset-0 bg-theme-gradient flex flex-col justify-center items-center z-[100] overflow-hidden transition-all duration-1000">
      <div className="relative z-10 flex flex-col items-center">
        {stage === 'loading' ? (
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-700">
            <div className="w-16 h-16 border-4 border-white/20 border-t-fuchsia-500 rounded-full animate-spin shadow-[0_0_15px_rgba(236,72,153,0.3)]"></div>
            <span className="text-white/50 text-sm font-arabic animate-pulse">جاري التحميل...</span>
          </div>
        ) : (
          <h1 className="nawaya-intro-text text-4xl sm:text-5xl font-bold animate-in zoom-in fade-in duration-700">
            {introText}
          </h1>
        )}
      </div>
    </div>
  );
};

export default IntroAnimation;
