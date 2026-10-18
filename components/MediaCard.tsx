'use client';

import React from 'react';
import { Film, Tv, Music, BookOpen, Mic, Star, Heart, Play, Pause, Send, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { MediaItem, MediaType, PersonalItem, PersonalItemStatus } from '@/types/culture';

interface MediaCardProps {
  personalItem?: PersonalItem;
  mediaItem?: MediaItem;
  onOpenDetail: (media: MediaItem) => void;
  onDrop: (media: MediaItem) => void;
  onPlayAudio?: (url: string, title: string, creator: string, poster: string) => void;
  isPlayingAudio?: boolean;
  onUpdateStatus?: (id: string, status: PersonalItemStatus) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  personalItem,
  mediaItem,
  onOpenDetail,
  onDrop,
  onPlayAudio,
  isPlayingAudio = false,
  onUpdateStatus,
}) => {
  const media = personalItem ? personalItem.media : mediaItem!;
  if (!media) return null;

  // Type styling
  const getTypeInfo = (type: MediaType) => {
    switch (type) {
      case 'movie':
        return { label: 'Film', icon: Film, color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'tv':
        return { label: 'Série', icon: Tv, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'music':
        return { label: 'Musique', icon: Music, color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' };
      case 'book':
        return { label: 'Livre', icon: BookOpen, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'podcast':
        return { label: 'Podcast', icon: Mic, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    }
  };

  const typeInfo = getTypeInfo(media.type);
  const TypeIcon = typeInfo.icon;

  const handleAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (media.previewAudioUrl && onPlayAudio) {
      onPlayAudio(media.previewAudioUrl, media.title, media.creator, media.posterUrl);
    }
  };

  const handleDropClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDrop(media);
  };

  return (
    <div
      onClick={() => onOpenDetail(media)}
      className="group bg-club-900/70 hover:bg-club-850/90 border border-club-800/80 hover:border-club-700 rounded-3xl p-3.5 transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-keo-600/10 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Poster & Badges Container */}
        <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-club-950 mb-3 border border-club-800/50">
          <img
            src={media.posterUrl}
            alt={media.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Type Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md flex items-center space-x-1 ${typeInfo.color}`}
            >
              <TypeIcon className="w-3 h-3" />
              <span>{typeInfo.label}</span>
            </span>
          </div>

          {/* Rating Badge (if any) */}
          {media.rating && (
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-club-950/80 backdrop-blur-md text-amber-400 border border-amber-400/30 flex items-center space-x-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{media.rating}</span>
            </div>
          )}

          {/* Audio Play Button (Music & Podcast) */}
          {media.previewAudioUrl && (
            <button
              type="button"
              onClick={handleAudioClick}
              className={`absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full flex items-center justify-center transition shadow-xl active:scale-90 ${
                isPlayingAudio
                  ? 'bg-drop-pink text-white ring-4 ring-drop-pink/30 animate-pulse'
                  : 'bg-black/70 hover:bg-black text-white hover:text-drop-pink backdrop-blur-md'
              }`}
              title="Écouter un extrait 30s"
            >
              {isPlayingAudio ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>
          )}

          {/* "Droppé par..." Banner if recommended by a friend */}
          {personalItem?.droppedBy && (
            <div className="absolute bottom-2 left-2 right-2 p-1.5 rounded-xl bg-club-950/90 backdrop-blur-md border border-drop-pink/30 flex items-center space-x-2">
              <img
                src={personalItem.droppedBy.avatar}
                alt={personalItem.droppedBy.name}
                className="w-5 h-5 rounded-full object-cover ring-1 ring-drop-pink"
              />
              <span className="text-[10px] text-slate-200 font-semibold truncate">
                Droppé par <strong className="text-drop-pink">{personalItem.droppedBy.name}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Title & Creator */}
        <h3 className="font-extrabold text-sm text-white line-clamp-1 group-hover:text-keo-300 transition">
          {media.title}
        </h3>
        <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">
          {media.creator} {media.year ? `• ${media.year}` : ''}
        </p>

        {/* Note from friend if any */}
        {personalItem?.droppedBy?.note && (
          <p className="mt-2 text-[11px] text-slate-300 bg-club-950/60 p-2 rounded-xl border border-club-800 italic line-clamp-2">
            « {personalItem.droppedBy.note} »
          </p>
        )}
      </div>

      {/* Footer / Status / Action Buttons */}
      <div className="mt-3.5 pt-2.5 border-t border-club-800/60 flex items-center justify-between gap-2">
        {/* Status indicator if in personal list */}
        {personalItem ? (
          <div className="flex items-center space-x-1 text-[11px]">
            {personalItem.status === 'want' && (
              <span className="px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/20 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> À découvrir
              </span>
            )}
            {personalItem.status === 'in_progress' && (
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/20 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> En cours
              </span>
            )}
            {personalItem.status === 'completed' && (
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Vu/Écouté
              </span>
            )}
            {personalItem.status === 'favorite' && (
              <span className="px-2 py-0.5 rounded-lg bg-drop-pink/20 text-pink-300 border border-drop-pink/30 font-semibold flex items-center gap-1">
                <Heart className="w-3 h-3 fill-drop-pink text-drop-pink" /> Coup de cœur
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-slate-500">
            {media.genres?.[0] || 'Recommandé'}
          </span>
        )}

        {/* Quick Drop Button */}
        <button
          type="button"
          onClick={handleDropClick}
          className="p-1.5 rounded-xl bg-club-800 hover:bg-keo-600 text-slate-300 hover:text-white transition active:scale-90 flex items-center space-x-1 text-xs font-bold"
          title="Dropper à un ami"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="text-[10px] hidden sm:inline">Drop</span>
        </button>
      </div>
    </div>
  );
};
