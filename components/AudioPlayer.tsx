
import React, { useState, useRef, useEffect } from 'react';

const PlayIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const PauseIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

const MuteIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
    </svg>
);

const VolumeIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);

interface AudioPlayerProps {
    src: string;
    className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, className = '' }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => {
            if (!isDragging) setCurrentTime(audio.currentTime);
        };
        const updateDuration = () => setDuration(audio.duration);
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', onEnded);
        };
    }, [isDragging]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = () => {
        if (!audioRef.current) return;
        const newMuted = !isMuted;
        setIsMuted(newMuted);
        audioRef.current.muted = newMuted;
        if (newMuted) setVolume(0);
        else setVolume(1);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        setCurrentTime(time);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Calculate progress percentage for slider background
    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div
            className={`bg-slate-900/80 backdrop-blur rounded-xl p-3 border border-slate-700/50 flex flex-col gap-2 ${className}`}
            onContextMenu={(e) => e.preventDefault()} // Extra security
        >
            <audio ref={audioRef} src={src} preload="metadata" controlsList="nodownload" />

            <div className="flex items-center gap-3">
                <button
                    onClick={togglePlay}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-tr from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white shadow-lg transition-transform transform hover:scale-105 flex-shrink-0"
                >
                    {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5 ml-0.5" />}
                </button>

                <div className="flex-grow flex flex-col justify-center gap-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium px-0.5">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>

                    <div className="relative w-full h-2 rounded-full bg-slate-700 overflow-hidden cursor-pointer group">
                        {/* Custom Slider Overlay */}
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            onMouseDown={() => setIsDragging(true)}
                            onMouseUp={() => setIsDragging(false)}
                            onTouchStart={() => setIsDragging(true)}
                            onTouchEnd={() => setIsDragging(false)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        {/* Progress Bar Visual */}
                        <div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full transition-all duration-100 ease-linear"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={toggleMute} className="text-slate-400 hover:text-white transition-colors">
                        {isMuted ? <MuteIcon className="w-5 h-5" /> : <VolumeIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
