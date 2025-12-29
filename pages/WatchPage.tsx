
import React from 'react';
import { Workshop, Recording } from '../types';
import { useUser } from '../context/UserContext';
import { ArrowLeftIcon, LockClosedIcon, VideoIcon, ExternalLinkIcon } from '../components/icons';

interface WatchPageProps {
  workshop: Workshop;
  recording: Partial<Recording> & { name?: string, url: string }; // Allow partial for live links
  onBack: () => void;
}

const WatchPage: React.FC<WatchPageProps> = ({ workshop, recording, onBack }) => {
  const { currentUser } = useUser();

  React.useEffect(() => {
    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      // Restore body scroll
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const isSubscribed = currentUser?.subscriptions.some(
    sub => sub.workshopId === workshop.id && sub.isApproved !== false && !sub.isPayItForwardDonation
  );

  const getMediaType = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.match(/\.(mp4|webm|ogg|mov)$/i)) return 'video';
    if (url.match(/\.(mp3|wav|m4a|aac)$/i)) return 'audio';
    return 'iframe'; // Default to iframe/generic
  };

  const getEmbedUrl = (url: string, type: string) => {
    try {
      if (type === 'youtube') {
        const videoId = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
        return `https://www.youtube.com/embed/${videoId}`;
      }
      if (type === 'vimeo') {
        const videoId = url.split('/').pop();
        return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&dnt=1`;
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  const mediaType = getMediaType(recording.url);
  const embedUrl = getEmbedUrl(recording.url, mediaType);

  const renderPlayer = () => {
    switch (mediaType) {
      case 'youtube':
      case 'vimeo':
        return (
          <div className="w-full h-full">
            <div className="w-full h-full bg-black shadow-2xl">
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                title={recording.name || workshop.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        );
      case 'video':
        return (
          <div className="w-full h-full">
            <div className="w-full h-full bg-black shadow-2xl">
              <video controls className="w-full h-full object-contain block" poster={workshop.thumbnail}>
                <source src={recording.url} />
                متصفحك لا يدعم تشغيل الفيديو.
              </video>
            </div>
          </div>
        );
      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center gap-6 p-8 bg-slate-800/50 rounded-2xl border border-white/10 shadow-2xl mx-4">
            <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center animate-pulse">
              <VideoIcon className="w-12 h-12 text-purple-400" />
            </div>
            <audio controls className="w-full max-w-md">
              <source src={recording.url} />
              متصفحك لا يدعم تشغيل الصوت.
            </audio>
            <p className="text-slate-400 text-sm">تسجيل صوتي للورشة</p>
          </div>
        );
      default:
        return (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-full h-full bg-slate-900 overflow-hidden relative group shadow-2xl">
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                title={recording.name || workshop.title}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              ></iframe>
              <div className="absolute bottom-4 left-4 right-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={recording.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs flex items-center gap-2 hover:bg-white/20 transition-all border border-white/10"
                >
                  <ExternalLinkIcon className="w-3.5 h-3.5" />
                  فتح في نافذة مستقلة
                </a>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-black overflow-hidden font-arabic" dir="rtl">
      <header className="flex-shrink-0 p-4 bg-slate-900/80 backdrop-blur-xl flex justify-between items-center border-b border-white/10 z-10">
        <div className="flex-grow min-w-0 pr-2">
          <h1 className="text-base sm:text-lg font-bold text-white truncate">{workshop.title}</h1>
          <p className="text-xs sm:text-sm text-slate-400 truncate">{recording.name || 'محتوى الورشة'}</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-x-2 py-2 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all border border-white/10 active:scale-95 flex-shrink-0"
        >
          <ArrowLeftIcon className="w-4 h-4 ml-1 rotate-180" />
          <span>العودة</span>
        </button>
      </header>

      <main className="flex-grow flex items-center justify-center relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black">
        {isSubscribed ? (
          <div className={`w-full ${mediaType === 'audio' ? 'h-auto py-12' : 'h-full'} flex items-center justify-center`}>
            {renderPlayer()}
          </div>
        ) : (
          <div className="text-center p-8 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <LockClosedIcon className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">الوصول مرفوض</h2>
            <p className="text-slate-400 max-w-sm mx-auto leading-relaxed">
              يجب أن تكون مشتركاً في هذه الورشة بجسم كامل للوصول إلى هذا المحتوى. تأكد من إتمام عملية الاشتراك.
            </p>
            <button
              onClick={onBack}
              className="mt-8 bg-white text-black font-bold py-2.5 px-8 rounded-full hover:bg-slate-200 transition-colors"
            >
              مفهوم
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default WatchPage;
