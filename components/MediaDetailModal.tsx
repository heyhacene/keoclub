'use client';

import React from 'react';
import { X, Send, Bookmark, BookmarkCheck, Star, Play, Pause, ExternalLink, CheckCircle2, Clock, Sparkles, Heart, Trash2 } from 'lucide-react';
import { MediaItem, MediaType, PersonalItem, PersonalItemStatus } from '@/types/culture';

interface MediaDetailModalProps {
  media: MediaItem | null;
  personalItem?: PersonalItem;
  isOpen: boolean;
  onClose: () => void;
  onTogglePersonalList: (media: MediaItem, status?: PersonalItemStatus) => void;
  onUpdateStatus?: (id: string, status: PersonalItemStatus) => void;
  onUpdateRating?: (id: string, rating: number) => void;
  onDrop: (media: MediaItem) => void;
  onPlayAudio?: (url: string, title: string, creator: string, poster: string) => void;
  isPlayingAudio?: boolean;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  media,
  personalItem,
  isOpen,
  onClose,
  onTogglePersonalList,
  onUpdateStatus,
  onUpdateRating,
  onDrop,
  onPlayAudio,
  isPlayingAudio = false,
}) => {
  if (!isOpen || !media) return null;

  const isInList = Boolean(personalItem);

  const getMediaLabel = (type: MediaType) => {
    switch (type) {
      case 'movie': return 'Film';
      case 'tv': return 'Série';
      case 'music': return 'Musique';
      case 'book': return 'Livre';
      case 'podcast': return 'Podcast';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-club-900 border border-club-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white backdrop-blur-md transition active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Poster & Quick Info */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-b from-club-800 to-club-900 border-b border-club-800/80 flex gap-4 sm:gap-5 items-start">
          {/* Cover Art */}
          <div className="relative w-28 sm:w-32 aspect-[3/4] rounded-2xl overflow-hidden bg-club-950 flex-shrink-0 shadow-2xl border border-club-700/80">
            <img
              src={media.posterUrl}
              alt={media.title}
              className="w-full h-full object-cover"
            />
            {media.previewAudioUrl && (
              <button
                type="button"
                onClick={() => onPlayAudio && onPlayAudio(media.previewAudioUrl!, media.title, media.creator, media.posterUrl)}
                className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center text-white transition group"
              >
                <div className="w-10 h-10 rounded-full bg-drop-pink flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  {isPlayingAudio ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                </div>
              </button>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-keo-600/20 text-keo-300 border border-keo-500/30 mb-1.5">
              {getMediaLabel(media.type)} {media.year ? `• ${media.year}` : ''}
            </span>

            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
              {media.title}
            </h2>

            <p className="text-sm font-semibold text-slate-300 mt-1">
              {media.creator}
            </p>

            {/* Meta Tags */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {media.genres?.map((g) => (
                <span
                  key={g}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-club-800 text-slate-400 border border-club-700"
                >
                  {g}
                </span>
              ))}
              {media.durationOrCount && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-400 bg-club-800 border border-club-700">
                  {media.durationOrCount}
                </span>
              )}
            </div>

            {/* Platforms */}
            {media.platforms && media.platforms.length > 0 && (
              <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-slate-400">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Disponible :</span>
                <span className="text-slate-300 font-semibold">{media.platforms.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Note from friend if present */}
          {personalItem?.droppedBy && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-drop-pink/15 via-keo-600/10 to-transparent border border-drop-pink/30 flex items-start space-x-3">
              <img
                src={personalItem.droppedBy.avatar}
                alt={personalItem.droppedBy.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-drop-pink shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white">
                  Conseillé par <span className="text-drop-pink">{personalItem.droppedBy.name}</span>
                </p>
                {personalItem.droppedBy.note && (
                  <p className="text-xs text-slate-300 italic mt-0.5 leading-relaxed">
                    « {personalItem.droppedBy.note} »
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Synopsis / Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              À propos de cette œuvre
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {media.overview || "Aucune description détaillée n'est disponible pour cette œuvre."}
            </p>
          </div>

          {/* User's Personal Status & Rating (if in list) */}
          {isInList && (
            <div className="p-4 bg-club-800/60 rounded-2xl border border-club-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Mon Suivi Personnel
                </span>
                {/* 5-star rating */}
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => onUpdateRating && onUpdateRating(personalItem!.id, star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          (personalItem?.myRating || 0) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateStatus && onUpdateStatus(personalItem!.id, 'want')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition ${
                    personalItem?.status === 'want'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-club-900 text-slate-400 border-club-700 hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>À découvrir</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateStatus && onUpdateStatus(personalItem!.id, 'in_progress')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition ${
                    personalItem?.status === 'in_progress'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                      : 'bg-club-900 text-slate-400 border-club-700 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>En cours</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateStatus && onUpdateStatus(personalItem!.id, 'completed')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition ${
                    personalItem?.status === 'completed'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : 'bg-club-900 text-slate-400 border-club-700 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Terminé</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateStatus && onUpdateStatus(personalItem!.id, 'favorite')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition ${
                    personalItem?.status === 'favorite'
                      ? 'bg-drop-pink text-white border-pink-400 shadow-md'
                      : 'bg-club-900 text-slate-400 border-club-700 hover:text-white'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>Coup de cœur</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-club-950 border-t border-club-800/80 flex items-center justify-between gap-3">
          {/* Add / Remove from Personal List */}
          <button
            type="button"
            onClick={() => onTogglePersonalList(media)}
            className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition ${
              isInList
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-club-800 hover:bg-club-700 text-white border border-club-700'
            }`}
          >
            {isInList ? (
              <>
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Retirer de ma liste</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-keo-400" />
                <span>Ajouter à ma liste</span>
              </>
            )}
          </button>

          {/* Action "Dropper à un ami" */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onDrop(media);
            }}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-keo-600 via-drop-pink to-amber-500 hover:opacity-95 text-white rounded-2xl text-xs sm:text-sm font-extrabold transition shadow-lg shadow-keo-600/30 flex items-center justify-center space-x-2 active:scale-98"
          >
            <Send className="w-4 h-4" />
            <span>Dropper à un ami</span>
          </button>
        </div>
      </div>
    </div>
  );
};
