'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, X, Music, Volume2 } from 'lucide-react';

interface AudioPlayerDrawerProps {
  audioUrl: string | null;
  title: string;
  creator: string;
  posterUrl: string;
  onClose: () => void;
}

export const AudioPlayerDrawer: React.FC<AudioPlayerDrawerProps> = ({
  audioUrl,
  title,
  creator,
  posterUrl,
  onClose,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = audioUrl;
        audioRef.current.load();
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Audio play autoplay blocked or failed:', err);
            setIsPlaying(false);
          });
      }
    } else {
      setIsPlaying(false);
    }
  }, [audioUrl]);

  if (!audioUrl) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-20 inset-x-0 z-40 px-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto bg-club-900/95 backdrop-blur-xl border border-drop-pink/40 rounded-2xl shadow-2xl p-3 flex items-center space-x-3 text-white animate-in slide-in-from-bottom-4 duration-200">
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />

        {/* Poster */}
        <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-club-950 shrink-0 border border-club-800 shadow-md">
          <img src={posterUrl} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-drop-pink/20 animate-pulse" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1.5">
            <Volume2 className="w-3.5 h-3.5 text-drop-pink shrink-0" />
            <h4 className="text-xs font-extrabold text-white truncate">{title}</h4>
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{creator}</p>

          {/* Progress bar */}
          <div className="w-full bg-club-800 h-1 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-drop-pink to-amber-400 h-full rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-drop-pink hover:bg-pink-600 text-white flex items-center justify-center transition active:scale-95 shadow-md shrink-0"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            if (audioRef.current) audioRef.current.pause();
            setIsPlaying(false);
            onClose();
          }}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
