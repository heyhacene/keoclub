'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Film, Tv, Music, BookOpen, Mic, Loader2, Sparkles, Plus, Send, Play, Pause } from 'lucide-react';
import { MediaItem, MediaType } from '@/types/culture';
import { universalSearch, TRENDING_SUGGESTIONS } from '@/lib/api-culture';

interface SearchDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (media: MediaItem) => void;
  onDropMedia: (media: MediaItem) => void;
  onAddToList: (media: MediaItem) => void;
  onPlayAudio?: (url: string, title: string, creator: string, poster: string) => void;
  isPlayingAudioUrl?: string | null;
}

export const SearchDiscoveryModal: React.FC<SearchDiscoveryModalProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  onDropMedia,
  onAddToList,
  onPlayAudio,
  isPlayingAudioUrl,
}) => {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | MediaType>('all');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (!query.trim()) {
      setResults(
        selectedType === 'all'
          ? TRENDING_SUGGESTIONS
          : TRENDING_SUGGESTIONS.filter((m) => m.type === selectedType)
      );
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const found = await universalSearch(query, selectedType);
        setResults(found);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, selectedType, isOpen]);

  if (!isOpen) return null;

  const categories: { id: 'all' | MediaType; label: string; icon: any }[] = [
    { id: 'all', label: 'Tous', icon: Sparkles },
    { id: 'movie', label: 'Films', icon: Film },
    { id: 'tv', label: 'Séries', icon: Tv },
    { id: 'music', label: 'Musique', icon: Music },
    { id: 'book', label: 'Livres', icon: BookOpen },
    { id: 'podcast', label: 'Podcasts', icon: Mic },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-club-900 border border-club-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col h-[85vh]">
        {/* Header & Search Input */}
        <div className="p-4 sm:p-5 border-b border-club-800 bg-club-950/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-keo-400" />
              <h3 className="text-base font-extrabold text-white">Recherche & Découverte</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-club-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Input field */}
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Titre d'un film, série, artiste, album, roman, podcast..."
              className="w-full bg-club-900 border border-club-700 focus:border-drop-pink rounded-2xl py-3 pl-11 pr-10 text-sm text-white placeholder-slate-400 focus:outline-none transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 hover:text-white absolute right-3 top-3"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => {
              const Icon = c.icon;
              const isSelected = selectedType === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedType(c.id)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition ${
                    isSelected
                      ? 'bg-gradient-to-r from-keo-600 to-drop-pink text-white shadow-md'
                      : 'bg-club-900 hover:bg-club-800 text-slate-300 border border-club-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-drop-pink" />
              <p className="text-xs text-slate-400 font-semibold">
                Recherche dans les cinémas, bibliothèques et discographies...
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-2">
              <p className="text-sm font-bold text-white">Aucun résultat trouvé pour « {query} »</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Vérifiez l’orthographe ou essayez avec le nom de l’artiste, du réalisateur ou de l’auteur.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {!query.trim() && (
                <div className="flex items-center space-x-2 pb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pépites & Tendances recommandées</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.map((media) => {
                  const isPlaying = isPlayingAudioUrl === media.previewAudioUrl;
                  return (
                    <div
                      key={media.id}
                      onClick={() => onSelectMedia(media)}
                      className="group p-3 rounded-2xl bg-club-950/70 hover:bg-club-800/80 border border-club-800 transition flex items-start space-x-3 cursor-pointer"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-16 h-22 rounded-xl overflow-hidden bg-club-900 shrink-0 border border-club-800">
                        <img
                          src={media.posterUrl}
                          alt={media.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {media.previewAudioUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayAudio?.(media.previewAudioUrl!, media.title, media.creator, media.posterUrl);
                            }}
                            className={`absolute inset-0 bg-black/50 hover:bg-black/30 flex items-center justify-center transition ${
                              isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-drop-pink flex items-center justify-center text-white shadow-md">
                              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
                            </div>
                          </button>
                        )}
                      </div>

                      {/* Info & Actions */}
                      <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-drop-pink">
                            {media.type} {media.year ? `• ${media.year}` : ''}
                          </span>
                          <h4 className="text-sm font-extrabold text-white truncate leading-snug">
                            {media.title}
                          </h4>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{media.creator}</p>
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddToList(media);
                            }}
                            className="py-1 px-2.5 rounded-lg bg-club-800 hover:bg-club-700 text-slate-200 text-[11px] font-bold transition flex items-center space-x-1"
                          >
                            <Plus className="w-3 h-3 text-keo-400" />
                            <span>+ Ma Liste</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                              onDropMedia(media);
                            }}
                            className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-keo-600 to-drop-pink text-white text-[11px] font-bold transition flex items-center space-x-1 shadow-xs"
                          >
                            <Send className="w-3 h-3" />
                            <span>Dropper</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
