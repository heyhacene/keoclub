'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Flame,
  Bookmark,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Heart,
  Plus,
  Send,
  Play,
  Pause,
  Film,
  Tv,
  Music,
  BookOpen,
  Mic,
  Trash2,
  ArrowUpDown,
  UserPlus,
  Compass,
  Check,
  Star,
} from 'lucide-react';
import {
  MediaItem,
  MediaType,
  PersonalItem,
  DropItem,
  Friend,
  UserProfile,
  PersonalItemStatus,
} from '@/types/culture';
import {
  loadPersonalList,
  savePersonalList,
  loadDrops,
  saveDrops,
  loadFriends,
  saveFriends,
  loadUserProfile,
  saveUserProfile,
} from '@/lib/storage';
import { Navbar } from '@/components/Navbar';
import { BottomNav, MainTab } from '@/components/BottomNav';
import { MediaCard } from '@/components/MediaCard';
import { MediaDetailModal } from '@/components/MediaDetailModal';
import { DropModal } from '@/components/DropModal';
import { SearchDiscoveryModal } from '@/components/SearchDiscoveryModal';
import { AudioPlayerDrawer } from '@/components/AudioPlayerDrawer';
import { SettingsModal } from '@/components/SettingsModal';
import { AuthModal } from '@/components/AuthModal';
import { pushDropToCloud, searchFriendsInCloud, pullDropsFromCloud } from '@/lib/supabase';

export default function KeoClubHome() {
  const [currentTab, setCurrentTab] = useState<MainTab>('drops');
  const [user, setUser] = useState<UserProfile>(loadUserProfile());
  const [personalList, setPersonalList] = useState<PersonalItem[]>([]);
  const [drops, setDrops] = useState<DropItem[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Filtres de Ma Liste
  const [selectedMediaType, setSelectedMediaType] = useState<'all' | MediaType>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | PersonalItemStatus>('all');
  const [searchInList, setSearchInList] = useState('');

  // Modales
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [mediaToDrop, setMediaToDrop] = useState<MediaItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // État lecteur audio flottant
  const [activeAudio, setActiveAudio] = useState<{
    url: string;
    title: string;
    creator: string;
    poster: string;
  } | null>(null);

  // Onglet secondaire dans l'Inbox de Drops (Reçus vs Envoyés)
  const [dropsFilter, setDropsFilter] = useState<'pending' | 'all'>('pending');

  // Ajout d'ami par code ou pseudo
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [addFriendFeedback, setAddFriendFeedback] = useState<string | null>(null);

  useEffect(() => {
    setPersonalList(loadPersonalList());
    setDrops(loadDrops());
    setFriends(loadFriends());
    setUser(loadUserProfile());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      savePersonalList(personalList);
    }
  }, [personalList, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      saveDrops(drops);
    }
  }, [drops, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      saveFriends(friends);
    }
  }, [friends, isLoaded]);

  // Nombre de drops reçus en attente
  const pendingDropsCount = useMemo(() => {
    return drops.filter((d) => d.status === 'pending').length;
  }, [drops]);

  // Lecteur audio
  const handlePlayAudio = (url: string, title: string, creator: string, poster: string) => {
    if (activeAudio?.url === url) {
      setActiveAudio(null);
    } else {
      setActiveAudio({ url, title, creator, poster });
    }
  };

  // 1. Action : Accepter un Drop -> Ajoute à ma liste
  const handleAcceptDrop = (drop: DropItem) => {
    // Vérifier si déjà présent
    const existing = personalList.find((p) => p.media.id === drop.media.id);
    if (!existing) {
      const newItem: PersonalItem = {
        id: `perso-${Date.now()}`,
        media: drop.media,
        status: 'want',
        droppedBy: {
          name: drop.senderName,
          avatar: drop.senderAvatar,
          note: drop.note,
        },
        addedAt: Date.now(),
        updatedAt: Date.now(),
      };
      setPersonalList((prev) => [newItem, ...prev]);
    }

    // Marquer le drop comme accepté
    setDrops((prev) =>
      prev.map((d) => (d.id === drop.id ? { ...d, status: 'accepted' } : d))
    );
  };

  // 2. Action : Refuser / Ignorer un Drop
  const handleIgnoreDrop = (dropId: string) => {
    setDrops((prev) =>
      prev.map((d) => (d.id === dropId ? { ...d, status: 'ignored' } : d))
    );
  };

  // 3. Action : Envoyer un Drop à un ami
  const handleSendDrop = (media: MediaItem, friendId: string, note: string) => {
    const friend = friends.find((f) => f.id === friendId);
    const newDrop: DropItem = {
      id: `drop-${Date.now()}`,
      media,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      recipientId: friendId,
      recipientName: friend?.name,
      note,
      status: 'pending',
      createdAt: Date.now(),
    };

    setDrops((prev) => [newDrop, ...prev]);
    pushDropToCloud(newDrop).catch(() => {});

    // Incrémenter le compteur de drops de l'ami
    if (friend) {
      setFriends((prev) =>
        prev.map((f) => (f.id === friendId ? { ...f, dropsCount: f.dropsCount + 1 } : f))
      );
    }
  };

  // 4. Action : Ajouter / Retirer une œuvre de ma liste
  const handleTogglePersonalList = (media: MediaItem, status: PersonalItemStatus = 'want') => {
    const existingIndex = personalList.findIndex((p) => p.media.id === media.id);
    if (existingIndex !== -1) {
      setPersonalList((prev) => prev.filter((p) => p.media.id !== media.id));
    } else {
      const newItem: PersonalItem = {
        id: `perso-${Date.now()}`,
        media,
        status,
        addedAt: Date.now(),
        updatedAt: Date.now(),
      };
      setPersonalList((prev) => [newItem, ...prev]);
    }
  };

  // 5. Action : Mettre à jour le statut personnel
  const handleUpdateStatus = (id: string, status: PersonalItemStatus) => {
    setPersonalList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status, updatedAt: Date.now() } : p))
    );
  };

  // 6. Action : Mettre à jour la note personnelle
  const handleUpdateRating = (id: string, rating: number) => {
    setPersonalList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, myRating: rating, updatedAt: Date.now() } : p))
    );
  };

  // 7. Action : Ajouter un ami par son code ou pseudo (Cloud + local)
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = friendCodeInput.trim();
    if (!clean) return;

    try {
      const cloudResults = await searchFriendsInCloud(clean);
      if (cloudResults.length > 0) {
        const found = cloudResults[0];
        if (!friends.some((f) => f.id === found.id || f.handle.toLowerCase() === found.handle.toLowerCase())) {
          setFriends((prev) => [found, ...prev]);
          setFriendCodeInput('');
          setAddFriendFeedback(`Ami ${found.name} (${found.handle}) ajouté au cercle !`);
          setTimeout(() => setAddFriendFeedback(null), 3000);
          return;
        }
      }
    } catch {}

    const pseudo = clean.startsWith('@') ? clean : `@${clean.toLowerCase()}`;
    const newFriend: Friend = {
      id: `friend-${Date.now()}`,
      name: clean.replace('@', ''),
      handle: pseudo,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${clean}`,
      bio: 'Membre du Cercle KeoClub.',
      favoriteGenres: ['Cinéma', 'Musique'],
      dropsCount: 0,
      isOnline: true,
    };

    setFriends((prev) => [newFriend, ...prev]);
    setFriendCodeInput('');
    setAddFriendFeedback(`Ami ${newFriend.name} ajouté au cercle !`);
    setTimeout(() => setAddFriendFeedback(null), 3000);
  };

  const handleLoginSuccess = (loggedUser: UserProfile) => {
    setUser(loggedUser);
    saveUserProfile(loggedUser);
    pullDropsFromCloud(loggedUser.id)
      .then((cloudDrops) => {
        if (cloudDrops && cloudDrops.length > 0) {
          setDrops((prev) => {
            const ids = new Set(prev.map((d) => d.id));
            const toAdd = cloudDrops.filter((d) => !ids.has(d.id));
            return [...toAdd, ...prev];
          });
        }
      })
      .catch(() => {});
  };

  // 8. Filtrage de Ma Liste
  const filteredPersonalList = useMemo(() => {
    return personalList.filter((item) => {
      if (selectedMediaType !== 'all' && item.media.type !== selectedMediaType) return false;
      if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
      if (searchInList.trim()) {
        const q = searchInList.toLowerCase();
        const matchTitle = item.media.title.toLowerCase().includes(q);
        const matchCreator = item.media.creator.toLowerCase().includes(q);
        return matchTitle || matchCreator;
      }
      return true;
    });
  }, [personalList, selectedMediaType, selectedStatus, searchInList]);

  // Drops affichés dans l'inbox
  const displayedDrops = useMemo(() => {
    if (dropsFilter === 'pending') {
      return drops.filter((d) => d.status === 'pending');
    }
    return drops;
  }, [drops, dropsFilter]);

  const mediaCategories: { id: 'all' | MediaType; label: string; icon: any }[] = [
    { id: 'all', label: 'Tous', icon: Sparkles },
    { id: 'movie', label: 'Films', icon: Film },
    { id: 'tv', label: 'Séries', icon: Tv },
    { id: 'music', label: 'Musique', icon: Music },
    { id: 'book', label: 'Livres', icon: BookOpen },
    { id: 'podcast', label: 'Podcasts', icon: Mic },
  ];

  return (
    <div className="min-h-screen bg-club-950 text-slate-100 flex flex-col font-sans selection:bg-drop-pink selection:text-white pb-28">
      {/* 1. TOP NAVBAR */}
      <Navbar
        user={user}
        pendingDropsCount={pendingDropsCount}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNavigateToDrops={() => setCurrentTab('drops')}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* 2. MAIN CONTAINER */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5">
        {/* ============================================================== */}
        {/* TAB 1: DROPS (INBOX & RECOMMANDATIONS REÇUES)                 */}
        {/* ============================================================== */}
        {currentTab === 'drops' && (
          <div className="space-y-6">
            {/* Bannière Profil & Code Ami */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-keo-600/15 via-drop-pink/15 to-transparent border border-club-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-drop-pink shrink-0"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-white">{user.name}</span>
                    <span className="text-xs font-mono font-bold text-drop-pink">{user.handle}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Code Ami : <strong className="text-white font-mono">{user.shareCode}</strong> • Donnez votre pseudo ou ce code à vos amis pour échanger des Drops !
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="py-1.5 px-3 bg-club-800 hover:bg-club-700 text-slate-200 text-xs font-bold rounded-xl transition border border-club-700 shrink-0 self-start sm:self-auto"
              >
                Changer de compte
              </button>
            </div>

            {/* Header Drops */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-drop-pink" />
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    Boîte de Drops
                  </h1>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Les pépites culturelles sélectionnées et recommandées par vos amis
                </p>
              </div>

              {/* Filter Pending / All */}
              <div className="flex items-center space-x-1 p-1 bg-club-900 rounded-2xl border border-club-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setDropsFilter('pending')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                    dropsFilter === 'pending'
                      ? 'bg-drop-pink text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>En attente</span>
                  {pendingDropsCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-white/20 text-white text-[10px] flex items-center justify-center font-black">
                      {pendingDropsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setDropsFilter('all')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                    dropsFilter === 'all'
                      ? 'bg-club-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tous les Drops
                </button>
              </div>
            </div>

            {/* Drops List */}
            {displayedDrops.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-club-900/40 rounded-3xl border border-club-850 p-6">
                <div className="w-16 h-16 rounded-full bg-club-800/80 flex items-center justify-center text-drop-pink">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {dropsFilter === 'pending'
                      ? 'Aucun Drop en attente'
                      : 'Aucun Drop reçu pour le moment'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Quand un ami de votre cercle vous conseillera un film, une série, un son ou un livre, il apparaîtra directement ici !
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMediaToDrop(null);
                    setIsDropModalOpen(true);
                  }}
                  className="py-2.5 px-5 bg-gradient-to-r from-keo-600 to-drop-pink text-white rounded-2xl text-xs font-bold shadow-lg shadow-drop-pink/20 transition active:scale-95 flex items-center space-x-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer le premier Drop à un ami</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedDrops.map((drop) => {
                  const isAccepted = drop.status === 'accepted';
                  const isIgnored = drop.status === 'ignored';
                  const isPlaying = activeAudio?.url === drop.media.previewAudioUrl;

                  return (
                    <div
                      key={drop.id}
                      className={`p-4 sm:p-5 rounded-3xl border transition flex flex-col justify-between ${
                        isAccepted
                          ? 'bg-club-900/40 border-club-800/60 opacity-80'
                          : isIgnored
                          ? 'bg-club-900/20 border-club-850 opacity-50'
                          : 'bg-club-900/90 border-club-700/80 hover:border-drop-pink/50 shadow-xl'
                      }`}
                    >
                      <div>
                        {/* Header Sender Info */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-club-800/60">
                          <div className="flex items-center space-x-2.5">
                            <img
                              src={drop.senderAvatar}
                              alt={drop.senderName}
                              className="w-8 h-8 rounded-full object-cover ring-2 ring-drop-pink shrink-0"
                            />
                            <div>
                              <p className="text-xs font-bold text-white">
                                {drop.senderName}
                              </p>
                              <span className="text-[10px] text-slate-400">
                                vous a droppé une recommandation
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-club-800 text-drop-pink border border-drop-pink/20">
                            {drop.media.type}
                          </span>
                        </div>

                        {/* Note from friend */}
                        <div className="mb-3.5 p-3 rounded-2xl bg-gradient-to-r from-drop-pink/10 to-transparent border border-drop-pink/25">
                          <p className="text-xs text-slate-200 italic leading-relaxed">
                            « {drop.note} »
                          </p>
                        </div>

                        {/* Media Item Card Preview */}
                        <div
                          onClick={() => {
                            setSelectedMedia(drop.media);
                            setIsDetailOpen(true);
                          }}
                          className="flex items-start space-x-3 p-2.5 rounded-2xl bg-club-950/70 border border-club-800/80 hover:border-club-700 transition cursor-pointer group"
                        >
                          <div className="relative w-16 h-22 rounded-xl overflow-hidden bg-club-900 shrink-0 border border-club-800">
                            <img
                              src={drop.media.posterUrl}
                              alt={drop.media.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {drop.media.previewAudioUrl && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayAudio(
                                    drop.media.previewAudioUrl!,
                                    drop.media.title,
                                    drop.media.creator,
                                    drop.media.posterUrl
                                  );
                                }}
                                className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center text-white transition"
                              >
                                <div className="w-7 h-7 rounded-full bg-drop-pink flex items-center justify-center shadow-md">
                                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
                                </div>
                              </button>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-extrabold text-white truncate group-hover:text-keo-300 transition">
                              {drop.media.title}
                            </h4>
                            <p className="text-xs text-slate-400 truncate mt-0.5 font-medium">
                              {drop.media.creator} {drop.media.year ? `• ${drop.media.year}` : ''}
                            </p>
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                              {drop.media.overview}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Drop Actions (Accepter / Déjà vu / Passer) */}
                      <div className="mt-4 pt-3 border-t border-club-800/60 flex items-center justify-between gap-2">
                        {drop.status === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleIgnoreDrop(drop.id)}
                              className="py-2 px-3 rounded-xl bg-club-800 hover:bg-club-700 text-slate-400 hover:text-white text-xs font-semibold transition"
                            >
                              Passer
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAcceptDrop(drop)}
                              className="flex-1 py-2 px-3.5 bg-gradient-to-r from-keo-600 via-drop-pink to-amber-500 hover:opacity-95 text-white rounded-xl text-xs font-extrabold transition shadow-md shadow-drop-pink/20 flex items-center justify-center space-x-1.5 active:scale-98"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Ajouter à ma liste</span>
                            </button>
                          </>
                        ) : isAccepted ? (
                          <div className="w-full flex items-center justify-between text-xs text-emerald-400 font-bold bg-emerald-500/10 py-1.5 px-3 rounded-xl border border-emerald-500/20">
                            <span className="flex items-center space-x-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Ajouté à votre liste</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMedia(drop.media);
                                setIsDetailOpen(true);
                              }}
                              className="text-slate-300 hover:text-white text-[11px] font-semibold underline"
                            >
                              Voir la fiche
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">Drop archivé</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: MA LISTE (BIBLIOTHÈQUE CULTURELLE PERSONNELLE)           */}
        {/* ============================================================== */}
        {currentTab === 'list' && (
          <div className="space-y-5">
            {/* Header Ma Liste */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Bookmark className="w-5 h-5 text-keo-400" />
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    Ma Liste Culturelle
                  </h1>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vos œuvres à découvrir, en cours et coups de cœur ({filteredPersonalList.length} éléments)
                </p>
              </div>

              {/* Add to list trigger */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="py-2.5 px-4 bg-keo-600 hover:bg-keo-500 text-white rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-keo-600/30 active:scale-95 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Découvrir & Ajouter</span>
              </button>
            </div>

            {/* Media Type Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {mediaCategories.map((c) => {
                const Icon = c.icon;
                const isSelected = selectedMediaType === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedMediaType(c.id)}
                    className={`py-2 px-3 rounded-2xl text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition ${
                      isSelected
                        ? 'bg-keo-600 text-white shadow-md'
                        : 'bg-club-900 hover:bg-club-850 text-slate-300 border border-club-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Status Subfilters (À découvrir / En cours / Terminé / Coup de cœur) */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                Statut :
              </span>
              {[
                { id: 'all', label: 'Tous les statuts' },
                { id: 'want', label: '⏳ À découvrir' },
                { id: 'in_progress', label: '✨ En cours' },
                { id: 'completed', label: '✅ Vu/Écouté' },
                { id: 'favorite', label: '❤️ Coups de cœur' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStatus(s.id as any)}
                  className={`py-1 px-2.5 rounded-xl font-bold transition ${
                    selectedStatus === s.id
                      ? 'bg-club-800 text-white border border-slate-600'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Search filter in personal list */}
            {personalList.length > 4 && (
              <div className="relative max-w-sm">
                <input
                  type="text"
                  value={searchInList}
                  onChange={(e) => setSearchInList(e.target.value)}
                  placeholder="Filtrer dans ma liste..."
                  className="w-full bg-club-900 border border-club-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-keo-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              </div>
            )}

            {/* Media Grid */}
            {filteredPersonalList.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 bg-club-900/40 rounded-3xl border border-club-850 p-6">
                <Bookmark className="w-10 h-10 text-slate-600" />
                <h3 className="text-base font-extrabold text-white">
                  Aucune œuvre dans cette sélection
                </h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  Recherchez un film, une série, un morceau ou un livre pour l'ajouter à vos listes.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="py-2 px-4 rounded-xl bg-keo-600 hover:bg-keo-500 text-white text-xs font-bold transition"
                >
                  Ouvrir la recherche
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
                {filteredPersonalList.map((item) => (
                  <MediaCard
                    key={item.id}
                    personalItem={item}
                    onOpenDetail={(m) => {
                      setSelectedMedia(m);
                      setIsDetailOpen(true);
                    }}
                    onDrop={(m) => {
                      setMediaToDrop(m);
                      setIsDropModalOpen(true);
                    }}
                    onPlayAudio={handlePlayAudio}
                    isPlayingAudio={activeAudio?.url === item.media.previewAudioUrl}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: MON CERCLE (AMIS & AFFINITÉS CULTURELLES)               */}
        {/* ============================================================== */}
        {currentTab === 'circle' && (
          <div className="space-y-6">
            {/* Header Cercle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-drop-cyan" />
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    Mon Cercle d'Amis
                  </h1>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vos curateurs de confiance avec qui vous échangez vos coups de cœur
                </p>
              </div>

              {/* Share My Code */}
              <div className="p-2.5 rounded-2xl bg-club-900 border border-club-800 flex items-center space-x-3 self-start sm:self-auto">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Mon Code :</span>
                <span className="font-mono font-bold text-xs text-drop-cyan">{user.shareCode}</span>
              </div>
            </div>

            {/* Add Friend Form */}
            <form
              onSubmit={handleAddFriend}
              className="p-4 rounded-3xl bg-club-900/80 border border-club-800 flex flex-col sm:flex-row gap-2.5 items-center justify-between"
            >
              <div className="flex items-center space-x-2.5 w-full sm:w-auto flex-1">
                <UserPlus className="w-4 h-4 text-drop-cyan shrink-0 ml-1" />
                <input
                  type="text"
                  value={friendCodeInput}
                  onChange={(e) => setFriendCodeInput(e.target.value)}
                  placeholder="Entrez un pseudo (@alex) ou un code ami..."
                  className="w-full bg-club-950 border border-club-800 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-drop-cyan"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto py-2 px-4 rounded-xl bg-drop-cyan hover:bg-cyan-400 text-club-950 text-xs font-black transition active:scale-95 shrink-0"
              >
                Ajouter au Cercle
              </button>
            </form>

            {addFriendFeedback && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-2xl border border-emerald-500/20 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>{addFriendFeedback}</span>
              </p>
            )}

            {/* Friends Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="p-4 sm:p-5 rounded-3xl bg-club-900 border border-club-800 hover:border-club-700 transition flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-drop-cyan/50"
                        />
                        {friend.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-club-900" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h3 className="font-extrabold text-sm text-white">{friend.name}</h3>
                          <span className="text-[11px] text-slate-400 font-mono">{friend.handle}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{friend.bio}</p>

                        {/* Favorite Genres */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {friend.favoriteGenres?.map((g) => (
                            <span
                              key={g}
                              className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-club-800 text-slate-400 border border-club-700"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Drops count */}
                    <span className="text-[10px] font-bold text-drop-pink bg-drop-pink/10 px-2 py-1 rounded-xl border border-drop-pink/20 shrink-0">
                      {friend.dropsCount} Drops
                    </span>
                  </div>

                  {/* Friend's Top Pick if any */}
                  {friend.topPick && (
                    <div
                      onClick={() => {
                        setSelectedMedia(friend.topPick!);
                        setIsDetailOpen(true);
                      }}
                      className="p-2.5 rounded-2xl bg-club-950 border border-club-800 flex items-center space-x-3 cursor-pointer hover:border-club-700 transition"
                    >
                      <img
                        src={friend.topPick.posterUrl}
                        alt={friend.topPick.title}
                        className="w-10 h-14 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-bold text-amber-400 uppercase flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-400" /> Son Coup de Cœur
                        </span>
                        <h4 className="text-xs font-bold text-white truncate">{friend.topPick.title}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{friend.topPick.creator}</p>
                      </div>
                    </div>
                  )}

                  {/* Drop to this friend button */}
                  <button
                    type="button"
                    onClick={() => {
                      setMediaToDrop(friend.topPick || null);
                      setIsDropModalOpen(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-2xl bg-club-800 hover:bg-keo-600 text-white text-xs font-bold transition flex items-center justify-center space-x-2 active:scale-98"
                  >
                    <Send className="w-3.5 h-3.5 text-drop-pink" />
                    <span>Lui faire un Drop</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 3. FLOATING MINI AUDIO PLAYER */}
      <AudioPlayerDrawer
        audioUrl={activeAudio?.url || null}
        title={activeAudio?.title || ''}
        creator={activeAudio?.creator || ''}
        posterUrl={activeAudio?.poster || ''}
        onClose={() => setActiveAudio(null)}
      />

      {/* 4. BOTTOM NAVIGATION BAR */}
      <BottomNav
        currentTab={currentTab}
        onChangeTab={(tab) => setCurrentTab(tab)}
        onOpenDropAction={() => {
          setMediaToDrop(null);
          setIsDropModalOpen(true);
        }}
        pendingDropsCount={pendingDropsCount}
      />

      {/* 5. MODALES */}
      {/* Search / Discovery Modal */}
      <SearchDiscoveryModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMedia={(media) => {
          setSelectedMedia(media);
          setIsDetailOpen(true);
        }}
        onDropMedia={(media) => {
          setMediaToDrop(media);
          setIsDropModalOpen(true);
        }}
        onAddToList={(media) => handleTogglePersonalList(media, 'want')}
        onPlayAudio={handlePlayAudio}
        isPlayingAudioUrl={activeAudio?.url}
      />

      {/* Media Detail Modal */}
      <MediaDetailModal
        media={selectedMedia}
        personalItem={personalList.find((p) => p.media.id === selectedMedia?.id)}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onTogglePersonalList={handleTogglePersonalList}
        onUpdateStatus={handleUpdateStatus}
        onUpdateRating={handleUpdateRating}
        onDrop={(media) => {
          setMediaToDrop(media);
          setIsDropModalOpen(true);
        }}
        onPlayAudio={handlePlayAudio}
        isPlayingAudio={activeAudio?.url === selectedMedia?.previewAudioUrl}
      />

      {/* Drop Modal (Heart of KeoClub) */}
      <DropModal
        media={mediaToDrop}
        friends={friends}
        isOpen={isDropModalOpen}
        onClose={() => {
          setIsDropModalOpen(false);
          setMediaToDrop(null);
        }}
        onSendDrop={handleSendDrop}
        onOpenSearchMedia={() => {
          setIsDropModalOpen(false);
          setIsSearchOpen(true);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onSaveUser={(u) => {
          setUser(u);
          saveUserProfile(u);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        totalSavedItems={personalList.length}
        totalDrops={drops.length}
      />

      {/* Auth Modal (Pseudo + PIN) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
