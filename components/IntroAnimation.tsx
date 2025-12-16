
import React from 'react';
import { useUser } from '../context/UserContext';

const IntroAnimation: React.FC = () => {
  const { drhopeData } = useUser();
  const introText = drhopeData.introText || 'يُحِبُّهُمْ وَيُحِبُّونَهُۥٓ';

  return (
    <div className="fixed inset-0 bg-theme-gradient flex flex-col justify-center items-center z-[100] overflow-hidden">
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="nawaya-intro-text text-4xl sm:text-5xl font-bold">
            {introText}
        </h1>
      </div>
    </div>
  );
};

export default IntroAnimation;
