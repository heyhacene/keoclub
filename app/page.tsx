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
  Trophy,
  Crown,
  Edit3,
  Share2,
} from 'lucide-react';
import {
  MediaItem,
  MediaType,
  PersonalItem,
  DropItem,
  Friend,
  UserProfile,
  PersonalItemStatus,
  UserTopPicks,
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
  DEFAULT_USER,
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
import { CulturalShowcaseModal } from '@/components/CulturalShowcaseModal';
import { TopPicksEditorModal } from '@/components/TopPicksEditorModal';
import { PullToRefresh } from '@/components/PullToRefresh';
import { UserAvatar } from '@/components/UserAvatar';
import { restorePersistentState, persistCustomAvatar, getCustomAvatarSync } from '@/lib/persistentStorage';
import { pushDropToCloud, searchFriendsInCloud, pullDropsFromCloud, updateUserInCloud } from '@/lib/supabase';

export default function KeoClubHome() {
  const [currentTab, setCurrentTab] = useState<MainTab>('drops');
  const [user, setUser] = useState<UserProfile>(() => {
    const u = loadUserProfile();
    const customAvatarSync = getCustomAvatarSync();
    if (customAvatarSync) {
      u.avatar = customAvatarSync;
    }
    return u;
  });
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
  const [selectedFriendForShowcase, setSelectedFriendForShowcase] = useState<Friend | null>(null);
  const [isTopEditorOpen, setIsTopEditorOpen] = useState(false);
  const [topEditorCategory, setTopEditorCategory] = useState<'overall' | 'movie' | 'tv' | 'music' | 'book' | 'podcast'>('movie');
  const [copiedMyTopShare, setCopiedMyTopShare] = useState(false);

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
    // 1. Chargement synchrone immédiat (depuis AndroidNativeStorage + LocalStorage)
    setPersonalList(loadPersonalList());
    setDrops(loadDrops());
    setFriends(loadFriends());
    const initialUser = loadUserProfile();
    const customAvatarSync = getCustomAvatarSync();
    if (customAvatarSync) {
      initialUser.avatar = customAvatarSync;
    }
    setUser(initialUser);
    setIsLoaded(true);

    // 2. Restauration asynchrone complémentaire (Capacitor Preferences, IndexedDB SQLite & SharedPreferences)
    restorePersistentState().then(({ customAvatar, userProfile }) => {
      const cleanAvatar = customAvatar && customAvatar.trim() ? customAvatar.trim() : null;

      setUser((prev) => {
        // Si l'utilisateur en mémoire a déjà des topPicks, ne jamais les écraser avec des valeurs par défaut
        const finalTopPicks = prev.topPicks || userProfile?.topPicks || {};
        const finalAvatar = cleanAvatar || (userProfile?.avatar && userProfile.avatar.trim() ? userProfile.avatar.trim() : prev.avatar);

        return {
          ...prev,
          ...(userProfile || {}),
          topPicks: finalTopPicks,
          avatar: finalAvatar,
        };
      });
    });
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
    setPersonalList((prev) => {
      const existingIndex = prev.findIndex((p) => p.media.id === media.id);
      let updated: PersonalItem[];
      if (existingIndex !== -1) {
        updated = prev.filter((p) => p.media.id !== media.id);
      } else {
        const newItem: PersonalItem = {
          id: `perso-${Date.now()}`,
          media,
          status,
          addedAt: Date.now(),
          updatedAt: Date.now(),
        };
        updated = [newItem, ...prev];
      }
      savePersonalList(updated);
      return updated;
    });
  };

  // 4b. Action : Supprimer définitivement une œuvre de ma liste
  const handleRemovePersonalItem = (id: string, title?: string) => {
    setPersonalList((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      savePersonalList(updated);
      return updated;
    });
  };

  // 4c. Action : Retirer un ami du cercle
  const handleRemoveFriend = (friendId: string, friendName: string) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`Voulez-vous vraiment retirer ${friendName} de votre cercle ?`);
      if (!confirmed) return;
    }
    setFriends((prev) => {
      const updated = prev.filter((f) => f.id !== friendId);
      saveFriends(updated);
      return updated;
    });
  };

  // 4d. Action : Supprimer définitivement un Drop de la boîte
  const handleDeleteDrop = (dropId: string) => {
    setDrops((prev) => {
      const updated = prev.filter((d) => d.id !== dropId);
      saveDrops(updated);
      return updated;
    });
  };

  // 4e. Action : Retirer un coup de cœur du Panthéon
  const handleRemoveTopPick = (category: 'overall' | 'movie' | 'tv' | 'music' | 'book' | 'podcast') => {
    setUser((prev) => {
      const currentTop = { ...(prev.topPicks || {}) };
      switch (category) {
        case 'overall':
          delete currentTop.overallFavorite;
          delete currentTop.overallNote;
          break;
        case 'movie':
          delete currentTop.movie;
          delete currentTop.movieNote;
          break;
        case 'tv':
          delete currentTop.tv;
          delete currentTop.tvNote;
          break;
        case 'music':
          delete currentTop.music;
          delete currentTop.musicNote;
          break;
        case 'book':
          delete currentTop.book;
          delete currentTop.bookNote;
          break;
        case 'podcast':
          delete currentTop.podcast;
          delete currentTop.podcastNote;
          break;
      }
      const updated: UserProfile = { ...prev, topPicks: currentTop };
      saveUserProfile(updated);
      updateUserInCloud(updated).catch(() => {});
      return updated;
    });
  };

  // 5. Action : Mettre à jour le statut personnel
  const handleUpdateStatus = (id: string, status: PersonalItemStatus) => {
    setPersonalList((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, status, updatedAt: Date.now() } : p));
      savePersonalList(updated);
      return updated;
    });
  };

  // 6. Action : Mettre à jour la note personnelle
  const handleUpdateRating = (id: string, rating: number) => {
    setPersonalList((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, myRating: rating, updatedAt: Date.now() } : p));
      savePersonalList(updated);
      return updated;
    });
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
    if (loggedUser.avatar) {
      persistCustomAvatar(loggedUser.avatar);
    }
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

  const handleSaveUserTopPicks = (newTopPicks: UserTopPicks) => {
    setUser((prev) => {
      const updated: UserProfile = {
        ...prev,
        topPicks: newTopPicks,
      };
      saveUserProfile(updated);
      if (updated.avatar) {
        persistCustomAvatar(updated.avatar);
      }
      updateUserInCloud(updated).catch(() => {});
      return updated;
    });
  };

  /**
   * Action de rafraîchissement au tirage vers le bas (Pull-to-refresh)
   */
  const handleRefreshApp = async () => {
    const freshUser = loadUserProfile();
    const freshDrops = loadDrops();
    const freshList = loadPersonalList();
    const freshFriends = loadFriends();

    setPersonalList(freshList);
    setDrops(freshDrops);
    setFriends(freshFriends);

    try {
      const { customAvatar } = await restorePersistentState();
      const finalAvatar = customAvatar || freshUser.avatar;
      setUser({ ...freshUser, avatar: finalAvatar });
    } catch {
      setUser(freshUser);
    }

    try {
      if (freshUser.id) {
        const cloudDrops = await pullDropsFromCloud(freshUser.id);
        if (cloudDrops && cloudDrops.length > 0) {
          setDrops((prev) => {
            const ids = new Set(prev.map((d) => d.id));
            const toAdd = cloudDrops.filter((d) => !ids.has(d.id));
            const merged = [...toAdd, ...prev];
            saveDrops(merged);
            return merged;
          });
        }
      }
    } catch {}

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
  };

  const handleShareMyTop = () => {
    const top = user.topPicks || {};
    const lines = [
      `🏆 Découvrez le Panthéon Culturel de ${user.name} (${user.handle}) sur KeoClub !`,
      top.overallFavorite ? `👑 Coup de Cœur Absolu : ${top.overallFavorite.title} (${top.overallFavorite.creator})` : '',
      top.movie ? `🎬 Film : ${top.movie.title}` : '',
      top.tv ? `📺 Série : ${top.tv.title}` : '',
      top.music ? `🎵 Musique : ${top.music.title} - ${top.music.creator}` : '',
      top.book ? `📚 Livre : ${top.book.title}` : '',
      top.podcast ? `🎙️ Podcast : ${top.podcast.title}` : '',
      `Code Ami : ${user.shareCode}`,
    ].filter(Boolean).join('\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(lines);
      setCopiedMyTopShare(true);
      setTimeout(() => setCopiedMyTopShare(false), 2500);
    }
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

  const renderPillarCard = (
    category: 'movie' | 'tv' | 'music' | 'book' | 'podcast',
    label: string,
    IconComponent: any,
    media: MediaItem | undefined,
    note: string | undefined,
    color: string,
    badgeBg: string
  ) => {
    const isPlaying = activeAudio?.url === media?.previewAudioUrl;
    return (
      <div className="p-4 rounded-3xl bg-club-900 border border-club-800 hover:border-club-700 transition flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center space-x-1.5 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${badgeBg}`}>
            <IconComponent className="w-3 h-3" />
            <span>{label}</span>
          </span>
          <div className="flex items-center space-x-1.5">
            {media && (
              <button
                type="button"
                onClick={() => handleRemoveTopPick(category)}
                className="p-1 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition"
                title={`Retirer ce ${label.toLowerCase()}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setTopEditorCategory(category);
                setIsTopEditorOpen(true);
              }}
              className="text-[11px] font-semibold text-slate-400 hover:text-white transition flex items-center space-x-1"
            >
              <Edit3 className="w-3 h-3 text-amber-400" />
              <span>{media ? 'Modifier' : 'Définir'}</span>
            </button>
          </div>
        </div>

        {media ? (
          <div className="flex items-start space-x-3.5">
            <div className="relative shrink-0">
              <img
                src={media.posterUrl}
                alt={media.title}
                onClick={() => {
                  setSelectedMedia(media);
                  setIsDetailOpen(true);
                }}
                className="w-16 h-22 rounded-xl object-cover shadow-lg cursor-pointer hover:scale-102 transition ring-1 ring-club-700"
              />
              {media.previewAudioUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayAudio(media.previewAudioUrl!, media.title, media.creator, media.posterUrl);
                  }}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-drop-pink text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition"
                  title={isPlaying ? 'Pause' : 'Écouter l\'extrait 30s'}
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                </button>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <h4
                onClick={() => {
                  setSelectedMedia(media);
                  setIsDetailOpen(true);
                }}
                className="text-xs sm:text-sm font-extrabold text-white hover:text-amber-300 transition truncate cursor-pointer"
              >
                {media.title}
              </h4>
              <p className="text-xs text-slate-400 truncate">
                {media.creator} {media.year ? `(${media.year})` : ''}
              </p>
              {note ? (
                <p className="text-[11px] text-slate-300 italic line-clamp-2 leading-relaxed pt-1">
                  « {note} »
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 italic pt-1">
                  Aucun mot ajouté pour ce favori.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div
            onClick={() => {
              setTopEditorCategory(category);
              setIsTopEditorOpen(true);
            }}
            className="p-4 text-center border border-dashed border-club-800 hover:border-club-600 rounded-2xl cursor-pointer transition bg-club-950/30 text-xs text-slate-400"
          >
            + Définir mon {label.toLowerCase()}
          </div>
        )}
      </div>
    );
  };

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

      {/* 2. MAIN CONTAINER WITH PULL-TO-REFRESH */}
      <PullToRefresh onRefresh={handleRefreshApp}>
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5">
          {/* ============================================================== */}
          {/* TAB 1: DROPS (INBOX & RECOMMANDATIONS REÇUES)                 */}
          {/* ============================================================== */}
          {currentTab === 'drops' && (
            <div className="space-y-6">
              {/* Bannière Profil & Code Ami */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-keo-600/15 via-drop-pink/15 to-transparent border border-club-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <UserAvatar
                    src={user.avatar}
                    name={user.name}
                    onClick={() => setIsSettingsOpen(true)}
                    className="w-10 h-10 rounded-2xl object-cover ring-2 ring-drop-pink shrink-0 cursor-pointer hover:ring-keo-400 active:scale-95 transition"
                    title="Modifier mon avatar et profil"
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

                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-club-800 text-drop-pink border border-drop-pink/20">
                              {drop.media.type}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDrop(drop.id);
                              }}
                              className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                              title="Supprimer ce Drop"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
                  Recherchez un film, une série, un morceau ou un livre pour l&#39;ajouter à vos listes.
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
                    onRemovePersonalItem={handleRemovePersonalItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: MON PANTHÉON / MON TOP CLUB (PAGE CONSULTABLE DU CERCLE) */}
        {/* ============================================================== */}
        {currentTab === 'top' && (
          <div className="space-y-6">
            {/* Header Mon Top */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    Mon Panthéon Culturel
                  </h1>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Votre vitrine culturelle officielle, visible et consultable par tous les membres de votre cercle
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleShareMyTop}
                  className="py-2 px-3 bg-club-900 hover:bg-club-800 text-slate-200 border border-club-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95"
                  title="Partager mon Top"
                >
                  {copiedMyTopShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{copiedMyTopShare ? 'Copié !' : 'Partager'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTopEditorCategory('overall');
                    setIsTopEditorOpen(true);
                  }}
                  className="py-2 px-3.5 bg-gradient-to-r from-amber-500 to-drop-pink hover:opacity-95 text-club-950 font-black rounded-xl text-xs transition flex items-center space-x-1.5 shadow-md shadow-amber-500/20 active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Modifier mon Top</span>
                </button>
              </div>
            </div>

            {/* Profile Bar */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-keo-600/10 to-drop-pink/15 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <UserAvatar
                  src={user.avatar}
                  name={user.name}
                  onClick={() => setIsSettingsOpen(true)}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-400 shadow-md cursor-pointer hover:scale-105 transition"
                  title="Modifier mon avatar et profil"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-white">{user.name}</span>
                    <span className="text-xs font-mono font-bold text-amber-400">{user.handle}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{user.bio}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedFriendForShowcase({
                    id: user.id,
                    name: user.name,
                    handle: user.handle,
                    avatar: user.avatar,
                    bio: user.bio,
                    favoriteGenres: ['Cinéma', 'Musique', 'SF'],
                    topPicks: user.topPicks,
                    dropsCount: drops.length,
                    isOnline: true,
                  });
                }}
                className="hidden sm:flex py-1.5 px-3 rounded-xl bg-club-900 hover:bg-club-800 text-slate-300 hover:text-white text-xs font-semibold border border-club-700 transition"
              >
                Aperçu pour mes amis
              </button>
            </div>

            {/* 1. HERO : Coup de Cœur Absolu */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 via-club-950 to-club-900 border border-amber-500/40 p-4 sm:p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-3.5">
                <span className="flex items-center space-x-1.5 text-xs font-black tracking-wider uppercase text-amber-400">
                  <Crown className="w-4 h-4 fill-amber-400" />
                  <span>Mon Coup de Cœur Absolu</span>
                </span>
                <div className="flex items-center space-x-2">
                  {user.topPicks?.overallFavorite && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTopPick('overall')}
                      className="p-1 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition"
                      title="Retirer ce coup de cœur absolu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setTopEditorCategory('overall');
                      setIsTopEditorOpen(true);
                    }}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline"
                  >
                    {user.topPicks?.overallFavorite ? 'Changer' : 'Définir'}
                  </button>
                </div>
              </div>

              {user.topPicks?.overallFavorite ? (
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <img
                    src={user.topPicks.overallFavorite.posterUrl}
                    alt={user.topPicks.overallFavorite.title}
                    onClick={() => {
                      setSelectedMedia(user.topPicks!.overallFavorite!);
                      setIsDetailOpen(true);
                    }}
                    className="w-24 h-34 sm:w-28 sm:h-40 rounded-2xl object-cover shadow-2xl ring-2 ring-amber-400/60 shrink-0 cursor-pointer hover:scale-102 transition"
                  />

                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <h3
                        onClick={() => {
                          setSelectedMedia(user.topPicks!.overallFavorite!);
                          setIsDetailOpen(true);
                        }}
                        className="text-lg sm:text-xl font-black text-white hover:text-amber-300 transition cursor-pointer truncate"
                      >
                        {user.topPicks.overallFavorite.title}
                      </h3>
                      <p className="text-xs text-slate-300 font-semibold mt-0.5">
                        {user.topPicks.overallFavorite.creator} {user.topPicks.overallFavorite.year ? `• ${user.topPicks.overallFavorite.year}` : ''}
                      </p>
                    </div>

                    {user.topPicks.overallNote ? (
                      <blockquote className="text-xs text-amber-200/90 italic bg-amber-950/40 border-l-2 border-amber-400 pl-3 py-1.5 rounded-r-lg">
                        « {user.topPicks.overallNote} »
                      </blockquote>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Aucun mot ajouté. Cliquez sur &quot;Changer&quot; pour ajouter une citation ou avis personnalisé !
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMedia(user.topPicks!.overallFavorite!);
                          setIsDetailOpen(true);
                        }}
                        className="py-1.5 px-3 bg-club-800 hover:bg-club-700 text-slate-200 rounded-xl text-xs font-bold transition border border-club-700"
                      >
                        Voir la fiche
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setTopEditorCategory('overall');
                    setIsTopEditorOpen(true);
                  }}
                  className="p-8 text-center border-2 border-dashed border-amber-500/30 rounded-2xl cursor-pointer hover:border-amber-400 transition bg-club-950/40"
                >
                  <Crown className="w-8 h-8 text-amber-400/50 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">Vous n&#39;avez pas encore défini votre Coup de Cœur Absolu</p>
                  <p className="text-xs text-slate-400 mt-1">
                    L&#39;œuvre emblématique qui vous représente le plus auprès de vos amis
                  </p>
                  <span className="inline-block mt-3 py-1.5 px-3.5 bg-amber-500 text-club-950 font-black rounded-xl text-xs shadow-md">
                    + Choisir mon Coup de Cœur
                  </span>
                </div>
              )}
            </div>

            {/* 2. THE 5 PILLARS OF CULTURE */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Mon Top 5 par Univers</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Film, série, musique, livre et podcast préférés de votre profil
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderPillarCard('movie', 'Film Coup de Cœur', Film, user.topPicks?.movie, user.topPicks?.movieNote, 'text-amber-400', 'bg-amber-500/15 border-amber-500/30 text-amber-300')}
                {renderPillarCard('tv', 'Série Incontournable', Tv, user.topPicks?.tv, user.topPicks?.tvNote, 'text-keo-400', 'bg-keo-500/15 border-keo-500/30 text-keo-300')}
                {renderPillarCard('music', 'Musique / Album Préféré', Music, user.topPicks?.music, user.topPicks?.musicNote, 'text-drop-pink', 'bg-drop-pink/15 border-drop-pink/30 text-drop-pink')}
                {renderPillarCard('book', 'Livre Culte', BookOpen, user.topPicks?.book, user.topPicks?.bookNote, 'text-emerald-400', 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300')}
                {renderPillarCard('podcast', 'Podcast Incontournable', Mic, user.topPicks?.podcast, user.topPicks?.podcastNote, 'text-drop-cyan', 'bg-drop-cyan/15 border-drop-cyan/30 text-drop-cyan')}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: MON CERCLE (AMIS & AFFINITÉS CULTURELLES)               */}
        {/* ============================================================== */}
        {currentTab === 'circle' && (
          <div className="space-y-6">
            {/* Header Cercle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-drop-cyan" />
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    Mon Cercle d&#39;Amis
                  </h1>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vos curateurs de confiance : consultez leurs Tops et échangez vos pépites
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
                    <div
                      onClick={() => setSelectedFriendForShowcase(friend)}
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <div className="relative">
                        <UserAvatar
                          src={friend.avatar}
                          name={friend.name}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-drop-cyan/50 group-hover:scale-105 transition"
                        />
                        {friend.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-club-900" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h3 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition">{friend.name}</h3>
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

                    {/* Drops count & Remove Friend Button */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] font-bold text-drop-pink bg-drop-pink/10 px-2 py-1 rounded-xl border border-drop-pink/20">
                        {friend.dropsCount} Drops
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFriend(friend.id, friend.name);
                        }}
                        className="p-1.5 rounded-xl bg-club-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-club-700/60 hover:border-red-500/30 transition active:scale-90"
                        title="Retirer cet ami du cercle"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Friend's Top Pick if any */}
                  {friend.topPick && (
                    <div
                      onClick={() => setSelectedFriendForShowcase(friend)}
                      className="p-2.5 rounded-2xl bg-club-950 border border-club-800 flex items-center space-x-3 cursor-pointer hover:border-amber-400/50 transition group"
                    >
                      <img
                        src={friend.topPick.posterUrl}
                        alt={friend.topPick.title}
                        className="w-10 h-14 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-bold text-amber-400 uppercase flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5 fill-amber-400" /> Coup de Cœur de son Panthéon
                        </span>
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition">{friend.topPick.title}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{friend.topPick.creator}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons for Friend */}
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedFriendForShowcase(friend)}
                      className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-drop-pink/15 to-keo-600/20 hover:from-amber-500/30 hover:to-drop-pink/30 text-amber-300 text-xs font-black transition flex items-center justify-center space-x-2 border border-amber-500/30 active:scale-98 shadow-sm"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Consulter son Top & Coups de Cœur</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMediaToDrop(friend.topPick || null);
                        setIsDropModalOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-2xl bg-club-800 hover:bg-club-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-2 active:scale-98"
                    >
                      <Send className="w-3.5 h-3.5 text-drop-pink" />
                      <span>Lui faire un Drop</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveFriend(friend.id, friend.name)}
                      className="w-full py-1.5 px-3 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-400 text-[11px] font-semibold transition flex items-center justify-center space-x-1.5 active:scale-98"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Retirer de mon Cercle</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      </PullToRefresh>

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
          const fresh = { ...u };
          setUser(fresh);
          saveUserProfile(fresh);
          if (fresh.avatar) {
            persistCustomAvatar(fresh.avatar);
          }
          updateUserInCloud(fresh).catch(() => {});
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

      {/* Cultural Showcase Modal (Panthéon consultable d'un ami ou de soi-même) */}
      <CulturalShowcaseModal
        friend={selectedFriendForShowcase}
        isOpen={!!selectedFriendForShowcase}
        onClose={() => setSelectedFriendForShowcase(null)}
        onAddToList={(media) => {
          handleTogglePersonalList(media, 'want');
        }}
        onSendDrop={(media, friend) => {
          setSelectedFriendForShowcase(null);
          setMediaToDrop(media);
          setIsDropModalOpen(true);
        }}
        onSelectMedia={(media) => {
          setSelectedFriendForShowcase(null);
          setSelectedMedia(media);
          setIsDetailOpen(true);
        }}
        onPlayAudio={handlePlayAudio}
        isPlayingAudioUrl={activeAudio?.url}
        isMediaInMyList={(id) => personalList.some((p) => p.media.id === id)}
      />

      {/* Top Picks Editor Modal (Éditeur de mon Top Club) */}
      <TopPicksEditorModal
        isOpen={isTopEditorOpen}
        onClose={() => setIsTopEditorOpen(false)}
        topPicks={user.topPicks || {}}
        onSaveTopPicks={handleSaveUserTopPicks}
        personalList={personalList}
        defaultCategory={topEditorCategory}
      />
    </div>
  );
}
