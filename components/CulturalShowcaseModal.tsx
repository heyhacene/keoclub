'use client';

import React, { useState } from 'react';
import {
  X,
  Trophy,
  Star,
  Crown,
  Film,
  Tv,
  Music,
  BookOpen,
  Mic,
  Plus,
  Check,
  CheckCircle2,
  Play,
  Pause,
  Send,
  Share2,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Friend, MediaItem, MediaType, UserTopPicks } from '@/types/culture';
import { UserAvatar } from './UserAvatar';

interface CulturalShowcaseModalProps {
  friend: Friend | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToList: (media: MediaItem) => void;
  onSendDrop: (media: MediaItem, friend: Friend) => void;
  onSelectMedia: (media: MediaItem) => void;
  onPlayAudio?: (url: string, title: string, creator: string, poster: string) => void;
  isPlayingAudioUrl?: string;
  isMediaInMyList?: (mediaId: string) => boolean;
}

export const CulturalShowcaseModal: React.FC<CulturalShowcaseModalProps> = ({
  friend,
  isOpen,
  onClose,
  onAddToList,
  onSendDrop,
  onSelectMedia,
  onPlayAudio,
  isPlayingAudioUrl,
  isMediaInMyList,
}) => {
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [copiedShare, setCopiedShare] = useState(false);

  if (!isOpen || !friend) return null;

  const top = friend.topPicks || {};

  const handleAdd = (media: MediaItem) => {
    onAddToList(media);
    setAddedIds((prev) => ({ ...prev, [media.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [media.id]: false }));
    }, 2500);
  };

  const handleShare = () => {
    const text = `Découvre le Panthéon Culturel de ${friend.name} (${friend.handle}) sur KeoClub !`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const pillars: {
    type: MediaType;
    label: string;
    icon: any;
    color: string;
    badgeBg: string;
    media?: MediaItem;
    note?: string;
  }[] = [
    {
      type: 'movie',
      label: 'Film Coup de Cœur',
      icon: Film,
      color: 'text-amber-400',
      badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      media: top.movie || (friend.topPick?.type === 'movie' ? friend.topPick : undefined),
      note: top.movieNote,
    },
    {
      type: 'tv',
      label: 'Série Incontournable',
      icon: Tv,
      color: 'text-keo-400',
      badgeBg: 'bg-keo-500/15 border-keo-500/30 text-keo-300',
      media: top.tv || (friend.topPick?.type === 'tv' ? friend.topPick : undefined),
      note: top.tvNote,
    },
    {
      type: 'music',
      label: 'Morceau ou Album Préféré',
      icon: Music,
      color: 'text-drop-pink',
      badgeBg: 'bg-drop-pink/15 border-drop-pink/30 text-drop-pink',
      media: top.music || (friend.topPick?.type === 'music' ? friend.topPick : undefined),
      note: top.musicNote,
    },
    {
      type: 'book',
      label: 'Livre Culte',
      icon: BookOpen,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      media: top.book || (friend.topPick?.type === 'book' ? friend.topPick : undefined),
      note: top.bookNote,
    },
    {
      type: 'podcast',
      label: 'Podcast Préféré',
      icon: Mic,
      color: 'text-drop-cyan',
      badgeBg: 'bg-drop-cyan/15 border-drop-cyan/30 text-drop-cyan',
      media: top.podcast || (friend.topPick?.type === 'podcast' ? friend.topPick : undefined),
      note: top.podcastNote,
    },
  ];

  const overall = top.overallFavorite || friend.topPick;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-club-900 border border-club-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative overflow-hidden border-b border-club-800 bg-gradient-to-r from-keo-950 via-club-950 to-drop-pink/20 px-6 py-5">
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center space-x-3.5">
              <div className="relative">
                <UserAvatar
                  src={friend.avatar}
                  name={friend.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-amber-400 shadow-xl"
                />
                <span className="absolute -bottom-1 -right-1 p-1 bg-amber-400 text-club-950 rounded-lg shadow-md" title="Panthéon Culturel">
                  <Trophy className="w-3.5 h-3.5" />
                </span>
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">{friend.name}</h3>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                    {friend.handle}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-md line-clamp-2 leading-relaxed">
                  {friend.bio || 'Membre passionné du Cercle KeoClub.'}
                </p>

                {/* Genres */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {friend.favoriteGenres?.map((g) => (
                    <span
                      key={g}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-club-800/80 text-slate-300 border border-club-700"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-club-800 transition"
                title="Partager"
              >
                {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-club-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Hero: Coup de Cœur Absolu */}
          {overall && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 via-club-950 to-club-900 border border-amber-500/40 p-4 sm:p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center space-x-1.5 text-xs font-black tracking-wider uppercase text-amber-400">
                  <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Coup de Cœur Absolu de {friend.name}</span>
                </span>
                <span className="text-[10px] font-bold text-amber-300/80 uppercase px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  N°1 Panthéon
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <img
                  src={overall.posterUrl}
                  alt={overall.title}
                  onClick={() => onSelectMedia(overall)}
                  className="w-20 h-28 sm:w-24 sm:h-32 rounded-2xl object-cover shadow-2xl ring-2 ring-amber-400/50 shrink-0 cursor-pointer hover:scale-102 transition"
                />

                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h4
                      onClick={() => onSelectMedia(overall)}
                      className="text-base sm:text-lg font-black text-white hover:text-amber-300 transition cursor-pointer truncate"
                    >
                      {overall.title}
                    </h4>
                    <p className="text-xs text-slate-300 font-semibold mt-0.5">
                      {overall.creator} {overall.year ? `• ${overall.year}` : ''}
                    </p>
                  </div>

                  {top.overallNote && (
                    <blockquote className="text-xs text-amber-200/90 italic bg-amber-950/40 border-l-2 border-amber-400 pl-3 py-1 rounded-r-lg">
                      « {top.overallNote} »
                    </blockquote>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAdd(overall)}
                      className="py-1.5 px-3 bg-gradient-to-r from-keo-600 to-drop-pink hover:opacity-95 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md active:scale-95"
                    >
                      {addedIds[overall.id] || isMediaInMyList?.(overall.id) ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Dans ma liste</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ajouter à ma liste</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onSendDrop(overall, friend)}
                      className="py-1.5 px-3 bg-club-800 hover:bg-club-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border border-club-700 active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5 text-drop-pink" />
                      <span>Échanger dessus</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Les 5 Piliers Culturels */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Le Top par Univers Culturel</span>
              </h4>
              <span className="text-[11px] text-slate-400">Films, séries, sons, livres & podcasts</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {pillars.map((pillar) => {
                const IconComponent = pillar.icon;
                const media = pillar.media;
                if (!media) return null;

                const isAdded = addedIds[media.id] || isMediaInMyList?.(media.id);
                const isPlaying = isPlayingAudioUrl === media.previewAudioUrl;

                return (
                  <div
                    key={pillar.type}
                    className="p-3.5 rounded-2xl bg-club-950/70 border border-club-800 hover:border-club-700 transition flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative shrink-0">
                        <img
                          src={media.posterUrl}
                          alt={media.title}
                          onClick={() => onSelectMedia(media)}
                          className="w-14 h-20 rounded-xl object-cover shadow-md cursor-pointer hover:scale-102 transition ring-1 ring-club-700"
                        />
                        {media.previewAudioUrl && onPlayAudio && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayAudio(media.previewAudioUrl!, media.title, media.creator, media.posterUrl);
                            }}
                            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-drop-pink text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition"
                            title={isPlaying ? 'Pause' : 'Écouter l\'extrait 30s'}
                          >
                            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                          </button>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className={`inline-flex items-center space-x-1 text-[9px] font-bold px-2 py-0.5 rounded-md border ${pillar.badgeBg} mb-1`}>
                          <IconComponent className="w-2.5 h-2.5" />
                          <span>{pillar.label}</span>
                        </span>

                        <h5
                          onClick={() => onSelectMedia(media)}
                          className="text-xs font-bold text-white hover:text-keo-300 transition truncate cursor-pointer"
                        >
                          {media.title}
                        </h5>
                        <p className="text-[11px] text-slate-400 truncate">
                          {media.creator} {media.year ? `(${media.year})` : ''}
                        </p>

                        {pillar.note && (
                          <p className="text-[10px] text-slate-300 italic mt-1 line-clamp-2 leading-tight">
                            « {pillar.note} »
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-club-850">
                      <button
                        type="button"
                        onClick={() => handleAdd(media)}
                        className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center space-x-1.5 ${
                          isAdded
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-club-800 hover:bg-club-700 text-white'
                        }`}
                      >
                        {isAdded ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3 text-keo-400" />}
                        <span>{isAdded ? 'Dans ma liste' : 'Prendre l\'inspi'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSendDrop(media, friend)}
                        className="p-1.5 rounded-xl bg-club-850 hover:bg-club-800 text-slate-300 hover:text-white transition"
                        title="Envoyer un Drop avec cette œuvre"
                      >
                        <Send className="w-3.5 h-3.5 text-drop-pink" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
