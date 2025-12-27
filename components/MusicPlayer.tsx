
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { SpeakerWaveIcon, SpeakerXMarkIcon } from './icons';

const MusicPlayer: React.FC = () => {
  const { drhopeData } = useUser();
  const musicUrl = drhopeData.backgroundMusicUrl;
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [showSlider, setShowSlider] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const handleInteraction = () => {
      setHasInteracted(true);
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  useEffect(() => {
    if (hasInteracted && musicUrl && audioRef.current) {
      if (audioRef.current.src !== musicUrl) {
        audioRef.current.src = musicUrl;
      }
      audioRef.current.play().catch(() => { });
    }
  }, [hasInteracted, musicUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    } else if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
    }
  };

  if (!musicUrl) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 group"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <audio ref={audioRef} loop />
      <div className="relative flex flex-col items-center">
        <div
          className={`absolute bottom-full mb-3 p-2 bg-black/60 backdrop-blur-xl border border-fuchsia-500/20 rounded-full transition-all duration-300 origin-bottom ${showSlider ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
          style={{ pointerEvents: showSlider ? 'auto' : 'none' }}
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-4 h-24 accent-fuchsia-500 cursor-pointer"
            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
            aria-label="Volume"
          />
        </div>
        <button
          onClick={toggleMute}
          className="bg-gradient-to-br from-[#2e0235] to-[#4c1d95] border border-fuchsia-500/40 text-fuchsia-100 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg shadow-fuchsia-900/40 transform group-hover:scale-110 transition-transform duration-300"
          aria-label={isMuted ? "Unmute music" : "Mute music"}
        >
          {isMuted || volume === 0 ? (
            <SpeakerXMarkIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          ) : (
            <SpeakerWaveIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MusicPlayer;
