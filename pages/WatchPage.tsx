
import React from 'react';
import { Workshop, Recording } from '../types';
import { useUser } from '../context/UserContext';
import { ArrowLeftIcon, LockClosedIcon } from '../components/icons';

interface WatchPageProps {
  workshop: Workshop;
  recording: Recording;
  onBack: () => void;
}

const WatchPage: React.FC<WatchPageProps> = ({ workshop, recording, onBack }) => {
  const { currentUser } = useUser();

  // FIX: Ensure isPayItForwardDonation records are excluded from access check
  const isSubscribed = currentUser?.subscriptions.some(
    sub => sub.workshopId === workshop.id && sub.isApproved !== false && !sub.isPayItForwardDonation
  );

  const getVimeoPlayerUrl = (baseUrl: string) => {
    try {
      const url = new URL(baseUrl);
      // Add player controls and other params, but remove title, byline, portrait
      url.searchParams.set('title', '0');
      url.searchParams.set('byline', '0');
      url.searchParams.set('portrait', '0');
      url.searchParams.set('dnt', '1'); // Do Not Track
      return url.href;
    } catch (e) {
      // If it's not a valid URL (e.g., just an ID), construct the URL
      if (/^\d+$/.test(baseUrl)) {
        return `https://player.vimeo.com/video/${baseUrl}?title=0&byline=0&portrait=0&dnt=1`;
      }
      return baseUrl; // Return as is if we can't parse it
    }
  };

  const videoUrl = getVimeoPlayerUrl(recording.url);

  return (
    <div className="w-full min-h-screen flex flex-col bg-black">
      <header className="flex-shrink-0 p-4 bg-slate-900/50 backdrop-blur-lg flex justify-between items-center border-b border-fuchsia-500/30 z-10">
        <div>
            <h1 className="text-base sm:text-lg font-bold text-white truncate">مشاهدة: {workshop.title}</h1>
            <p className="text-xs sm:text-sm text-slate-300">{recording.name || 'تسجيل الورشة'}</p>
        </div>
        <button 
          onClick={onBack} 
          className="flex items-center gap-x-2 py-2 px-4 rounded-md bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition-colors"
        >
            <ArrowLeftIcon className="w-5 h-5"/>
            <span>العودة للملف الشخصي</span>
        </button>
      </header>
      <main className="flex-grow flex items-center justify-center">
        {isSubscribed ? (
            <div className="w-full h-full aspect-video">
                 <iframe
                    src={videoUrl}
                    className="w-full h-full border-0"
                    title={`Recording for ${workshop.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
        ) : (
            <div className="text-center p-8">
                <LockClosedIcon className="w-16 h-16 mx-auto text-red-400 mb-4" />
                <h2 className="text-2xl font-bold text-white">الوصول مرفوض</h2>
                <p className="text-slate-300 mt-2">
                    يجب أن تكون مشتركاً في هذه الورشة لمشاهدة هذا التسجيل.
                </p>
            </div>
        )}
      </main>
    </div>
  );
};

export default WatchPage;
