import React from 'react';
import { CloseIcon, PlayCircleIcon } from './icons';
import { Workshop, Subscription, RecordingStats } from '../types';
import { formatArabicDate } from '../utils';

interface RecordingStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription;
  workshop: Workshop;
}

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div 
            className="bg-gradient-to-r from-sky-500 to-cyan-400 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
        ></div>
    </div>
);

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="bg-slate-800/60 p-2 rounded-md text-center">
        <p className="text-xs text-sky-300 font-bold">{label}</p>
        <p className="text-base font-extrabold text-white">{value}</p>
    </div>
);


const RecordingStatsModal: React.FC<RecordingStatsModalProps> = ({ isOpen, onClose, subscription, workshop }) => {
  if (!isOpen) return null;
  
  const stats = subscription.recordingStats || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-80 p-4">
      <div className="bg-indigo-900/90 backdrop-blur-lg text-white rounded-lg shadow-2xl w-full max-w-2xl border border-sky-500/80 max-h-[90vh] flex flex-col">
        <header className="p-4 flex justify-between items-center border-b border-sky-500/50 flex-shrink-0">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-400">إحصائيات المشاهدة</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><CloseIcon className="w-6 h-6" /></button>
        </header>
        <div className="p-6 overflow-y-auto space-y-6">
            <div className="bg-black/20 p-4 rounded-lg">
                <p className="font-bold text-white">الورشة: {workshop.title}</p>
            </div>
            {(workshop.recordings || []).map(rec => {
                const recStats: RecordingStats = stats[rec.url] || { progress: 0, playCount: 0, lastTimestamp: 0 };
                return (
                    <div key={rec.url} className="bg-slate-800/40 p-4 rounded-lg border border-slate-700">
                        <h4 className="font-bold text-white mb-4 flex items-center gap-x-2"><PlayCircleIcon className="w-5 h-5 text-sky-300" /> {rec.name}</h4>
                        <div className="flex items-center gap-x-4 mb-4">
                            <span className="text-sm font-bold w-24 text-sky-300">نسبة الإكمال:</span>
                            <ProgressBar progress={recStats.progress} />
                            <span className="text-sm font-bold">{Math.round(recStats.progress)}%</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <StatItem label="مرات التشغيل" value={recStats.playCount} />
                            <StatItem label="آخر نقطة توقف" value={`${Math.floor(recStats.lastTimestamp / 60)} دقيقة`} />
                            <StatItem label="أول مشاهدة" value={recStats.firstWatched ? formatArabicDate(recStats.firstWatched) : '-'} />
                            <StatItem label="آخر مشاهدة" value={recStats.lastWatched ? formatArabicDate(recStats.lastWatched) : '-'} />
                        </div>
                    </div>
                );
            })}
             {(workshop.recordings || []).length === 0 && <p className="text-center text-slate-400">لا توجد تسجيلات لهذه الورشة.</p>}
        </div>
      </div>
       <style>{`.z-80 { z-index: 80; }`}</style>
    </div>
  );
};

export default RecordingStatsModal;
