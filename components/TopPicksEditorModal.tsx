'use client';

import React, { useState } from 'react';
import {
  X,
  Trophy,
  Crown,
  Film,
  Tv,
  Music,
  BookOpen,
  Mic,
  Search,
  Check,
  Sparkles,
  Bookmark,
  Trash2,
  Loader2,
  Edit3,
} from 'lucide-react';
import { MediaItem, MediaType, PersonalItem, UserTopPicks } from '@/types/culture';
import { searchAllCulture } from '@/lib/api-culture';

type TopCategory = 'overall' | 'movie' | 'tv' | 'music' | 'book' | 'podcast';

interface TopPicksEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  topPicks: UserTopPicks;
  onSaveTopPicks: (topPicks: UserTopPicks) => void;
  personalList: PersonalItem[];
  defaultCategory?: TopCategory;
}

export const TopPicksEditorModal: React.FC<TopPicksEditorModalProps> = ({
  isOpen,
  onClose,
  topPicks,
  onSaveTopPicks,
  personalList,
  defaultCategory = 'movie',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<TopCategory>(defaultCategory);
  const [currentTops, setCurrentTops] = useState<UserTopPicks>(topPicks);
  const [tab, setTab] = useState<'my_list' | 'search'>('my_list');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [personalNoteInput, setPersonalNoteInput] = useState('');

  if (!isOpen) return null;

  const categories: {
    key: TopCategory;
    label: string;
    icon: any;
    mediaType?: MediaType;
    color: string;
  }[] = [
    { key: 'overall', label: 'Coup de Cœur Absolu', icon: Crown, color: 'text-amber-400' },
    { key: 'movie', label: 'Film Préféré', icon: Film, mediaType: 'movie', color: 'text-amber-400' },
    { key: 'tv', label: 'Série Préférée', icon: Tv, mediaType: 'tv', color: 'text-keo-400' },
    { key: 'music', label: 'Musique / Album', icon: Music, mediaType: 'music', color: 'text-drop-pink' },
    { key: 'book', label: 'Livre Culte', icon: BookOpen, mediaType: 'book', color: 'text-emerald-400' },
    { key: 'podcast', label: 'Podcast Préféré', icon: Mic, mediaType: 'podcast', color: 'text-drop-cyan' },
  ];

  const currentCatConfig = categories.find((c) => c.key === selectedCategory)!;

  // Récupérer l'œuvre actuelle pour cette catégorie
  const getCurrentMedia = (cat: TopCategory): MediaItem | undefined => {
    switch (cat) {
      case 'overall': return currentTops.overallFavorite;
      case 'movie': return currentTops.movie;
      case 'tv': return currentTops.tv;
      case 'music': return currentTops.music;
      case 'book': return currentTops.book;
      case 'podcast': return currentTops.podcast;
    }
  };

  const getCurrentNote = (cat: TopCategory): string => {
    switch (cat) {
      case 'overall': return currentTops.overallNote || '';
      case 'movie': return currentTops.movieNote || '';
      case 'tv': return currentTops.tvNote || '';
      case 'music': return currentTops.musicNote || '';
      case 'book': return currentTops.bookNote || '';
      case 'podcast': return currentTops.podcastNote || '';
    }
  };

  const handleSelectCategory = (cat: TopCategory) => {
    setSelectedCategory(cat);
    setPersonalNoteInput(getCurrentNote(cat));
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSetMediaForCurrentCategory = (media: MediaItem) => {
    const note = personalNoteInput.trim() || getCurrentNote(selectedCategory);
    let updated: UserTopPicks = { ...currentTops };

    switch (selectedCategory) {
      case 'overall':
        updated = { ...updated, overallFavorite: media, overallNote: note };
        break;
      case 'movie':
        updated = { ...updated, movie: media, movieNote: note };
        break;
      case 'tv':
        updated = { ...updated, tv: media, tvNote: note };
        break;
      case 'music':
        updated = { ...updated, music: media, musicNote: note };
        break;
      case 'book':
        updated = { ...updated, book: media, bookNote: note };
        break;
      case 'podcast':
        updated = { ...updated, podcast: media, podcastNote: note };
        break;
    }

    setCurrentTops(updated);
    onSaveTopPicks(updated);
  };

  const handleRemoveCurrent = () => {
    let updated: UserTopPicks = { ...currentTops };
    switch (selectedCategory) {
      case 'overall':
        updated = { ...updated, overallFavorite: undefined, overallNote: undefined };
        break;
      case 'movie':
        updated = { ...updated, movie: undefined, movieNote: undefined };
        break;
      case 'tv':
        updated = { ...updated, tv: undefined, tvNote: undefined };
        break;
      case 'music':
        updated = { ...updated, music: undefined, musicNote: undefined };
        break;
      case 'book':
        updated = { ...updated, book: undefined, bookNote: undefined };
        break;
      case 'podcast':
        updated = { ...updated, podcast: undefined, podcastNote: undefined };
        break;
    }
    setCurrentTops(updated);
    onSaveTopPicks(updated);
  };

  const handleSaveNote = () => {
    let updated: UserTopPicks = { ...currentTops };
    const note = personalNoteInput.trim();
    switch (selectedCategory) {
      case 'overall': updated.overallNote = note; break;
      case 'movie': updated.movieNote = note; break;
      case 'tv': updated.tvNote = note; break;
      case 'music': updated.musicNote = note; break;
      case 'book': updated.bookNote = note; break;
      case 'podcast': updated.podcastNote = note; break;
    }
    setCurrentTops(updated);
    onSaveTopPicks(updated);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const typeFilter = currentCatConfig.mediaType || 'all';
      const results = await searchAllCulture(searchQuery.trim(), typeFilter);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Filtrer les éléments de Ma Liste pertinents
  const availableFromList = personalList.filter((item) => {
    if (!currentCatConfig.mediaType) return true; // overall accepte tout
    return item.media.type === currentCatConfig.mediaType;
  });

  const activeMedia = getCurrentMedia(selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-club-900 border border-club-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-club-800 bg-club-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Éditeur de mon Top Club</h3>
              <p className="text-[11px] text-slate-400">Configurez votre Panthéon culturel pour votre cercle</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-club-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Pills selector */}
        <div className="px-5 py-3 border-b border-club-800 bg-club-950/40 flex items-center space-x-2 overflow-x-auto scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.key;
            const hasChosen = !!getCurrentMedia(cat.key);
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleSelectCategory(cat.key)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 border ${
                  isSelected
                    ? 'bg-amber-500 text-club-950 border-amber-400 shadow-md'
                    : 'bg-club-950 text-slate-300 border-club-800 hover:border-club-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-club-950' : cat.color}`} />
                <span>{cat.label}</span>
                {hasChosen && (
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-club-950' : 'bg-emerald-400'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Currently Selected Media Card for this category */}
          <div className="p-4 rounded-2xl bg-club-950 border border-club-800 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <span>Sélection actuelle pour :</span>
              <strong className="text-amber-400">{currentCatConfig.label}</strong>
            </span>

            {activeMedia ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-club-900 rounded-xl border border-club-800">
                <div className="flex items-center space-x-3 min-w-0">
                  <img
                    src={activeMedia.posterUrl}
                    alt={activeMedia.title}
                    className="w-12 h-16 rounded-lg object-cover ring-1 ring-amber-400/50 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{activeMedia.title}</h4>
                    <p className="text-xs text-slate-400 truncate">{activeMedia.creator}</p>
                    <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block mt-1 font-semibold">
                      Déjà dans votre Top
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveCurrent}
                  className="py-1.5 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-semibold flex items-center space-x-1.5 transition active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Retirer</span>
                </button>
              </div>
            ) : (
              <div className="p-4 text-center border-2 border-dashed border-club-800 rounded-xl text-xs text-slate-400">
                Aucune œuvre définie pour cette catégorie. Choisissez-en une ci-dessous !
              </div>
            )}

            {/* Note personnelle / Pourquoi c'est mon œuvre préférée */}
            {activeMedia && (
              <div className="space-y-1.5 pt-2 border-t border-club-850">
                <label className="block text-[11px] font-bold text-slate-300 flex items-center space-x-1">
                  <Edit3 className="w-3 h-3 text-amber-400" />
                  <span>Votre mot personnalisé (visible par vos amis) :</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={personalNoteInput}
                    onChange={(e) => setPersonalNoteInput(e.target.value)}
                    placeholder="Ex: La claque visuelle et émotionnelle de ma vie..."
                    className="flex-1 bg-club-900 border border-club-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleSaveNote}
                    className="py-2 px-3 bg-amber-500 hover:bg-amber-400 text-club-950 rounded-xl text-xs font-black transition active:scale-95 shrink-0"
                  >
                    Valider le mot
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tab selector: From My List vs Search Global */}
          <div className="flex border-b border-club-800 bg-club-950/40 rounded-2xl p-1">
            <button
              type="button"
              onClick={() => setTab('my_list')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                tab === 'my_list'
                  ? 'bg-club-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-keo-400" />
              <span>Choisir dans Ma Liste ({availableFromList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('search')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                tab === 'search'
                  ? 'bg-club-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-drop-pink" />
              <span>Rechercher une œuvre</span>
            </button>
          </div>

          {/* Tab 1: Pick from My List */}
          {tab === 'my_list' && (
            <div className="space-y-3">
              {availableFromList.length === 0 ? (
                <div className="p-8 text-center bg-club-950/50 rounded-2xl border border-club-800">
                  <p className="text-xs text-slate-400">
                    Aucune œuvre correspondante dans Ma Liste pour le moment.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab('search')}
                    className="mt-2 text-xs text-amber-400 font-bold underline"
                  >
                    Rechercher une œuvre globale
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {availableFromList.map((item) => {
                    const isCurrent = activeMedia?.id === item.media.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSetMediaForCurrentCategory(item.media)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition active:scale-98 ${
                          isCurrent
                            ? 'bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-500/30'
                            : 'bg-club-950/70 border-club-800 hover:border-club-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <img
                            src={item.media.posterUrl}
                            alt={item.media.title}
                            className="w-9 h-12 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">{item.media.title}</h5>
                            <p className="text-[10px] text-slate-400 truncate">{item.media.creator}</p>
                          </div>
                        </div>

                        <span
                          className={`p-1.5 rounded-lg text-xs font-bold shrink-0 ${
                            isCurrent
                              ? 'bg-amber-400 text-club-950'
                              : 'bg-club-800 hover:bg-keo-600 text-white'
                          }`}
                        >
                          {isCurrent ? <Check className="w-3.5 h-3.5" /> : 'Choisir'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Live Search */}
          {tab === 'search' && (
            <div className="space-y-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Rechercher un ${currentCatConfig.label.toLowerCase()}...`}
                  className="flex-1 bg-club-950 border border-club-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-drop-pink"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-keo-600 to-drop-pink text-white text-xs font-bold flex items-center space-x-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Chercher</span>
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {searchResults.map((media) => {
                    const isCurrent = activeMedia?.id === media.id;
                    return (
                      <div
                        key={media.id}
                        onClick={() => handleSetMediaForCurrentCategory(media)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition active:scale-98 ${
                          isCurrent
                            ? 'bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-500/30'
                            : 'bg-club-950/70 border-club-800 hover:border-club-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <img
                            src={media.posterUrl}
                            alt={media.title}
                            className="w-9 h-12 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">{media.title}</h5>
                            <p className="text-[10px] text-slate-400 truncate">{media.creator}</p>
                          </div>
                        </div>

                        <span
                          className={`p-1.5 rounded-lg text-xs font-bold shrink-0 ${
                            isCurrent
                              ? 'bg-amber-400 text-club-950'
                              : 'bg-club-800 hover:bg-keo-600 text-white'
                          }`}
                        >
                          {isCurrent ? <Check className="w-3.5 h-3.5" /> : 'Choisir'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-club-800 bg-club-950/70 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 bg-gradient-to-r from-amber-500 to-drop-pink hover:opacity-95 text-club-950 font-black rounded-2xl text-xs transition shadow-lg shadow-amber-500/20 active:scale-98"
          >
            Terminer & Publier dans mon Cercle
          </button>
        </div>
      </div>
    </div>
  );
};
