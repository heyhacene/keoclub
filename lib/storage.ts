import { PersonalItem, DropItem, Friend, UserProfile, MediaItem, PersonalItemStatus, UserTopPicks } from '@/types/culture';
import { TRENDING_SUGGESTIONS } from './api-culture';
import { STORAGE_KEYS, persistCustomAvatar, idbSet, syncStorageGet, syncStorageSet, getCustomAvatarSync } from './persistentStorage';

// Profil utilisateur par défaut avec Top Culturel
export const DEFAULT_USER: UserProfile = {
  id: 'user-me',
  name: 'Hacène',
  handle: '@hacene',
  avatar: '',
  bio: 'Amateur de grands récits de SF, de vinyles et de récits immersifs.',
  shareCode: 'KEO-CLUB-4821',
  topPicks: {
    movie: TRENDING_SUGGESTIONS[5], // Interstellar
    movieNote: 'Mon film de science-fiction absolu. L\'émotion et la bande-son de Hans Zimmer me transportent à chaque visionnage.',
    tv: TRENDING_SUGGESTIONS[1], // Severance
    tvNote: 'Une mise en scène brillante et une intrigue psychologique impossible à lâcher.',
    music: TRENDING_SUGGESTIONS[2], // Daft Punk
    musicNote: 'Un chef-d\'œuvre intemporel aux sonorités rétro-futuristes.',
    book: TRENDING_SUGGESTIONS[3], // Le Problème à 3 corps
    bookNote: 'Une claque d\'imagination et de vertige cosmique.',
    podcast: TRENDING_SUGGESTIONS[4], // Transfert
    podcastNote: 'Des récits intimes et humains d\'une puissance rare.',
    overallFavorite: TRENDING_SUGGESTIONS[5],
    overallNote: 'L\'œuvre qui m\'a le plus marqué de toute la décennie.',
  },
};

// Amis pré-remplis avec leurs Tops Culturels consultables
export const DEFAULT_FRIENDS: Friend[] = [
  {
    id: 'friend-sarah',
    name: 'Sarah',
    handle: '@sarah_cine',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    bio: 'Cinéphile passionnée & dénicheuse de pépites indé.',
    favoriteGenres: ['Cinéma', 'Thriller', 'Série'],
    dropsCount: 14,
    isOnline: true,
    status: 'accepted',
    topPick: TRENDING_SUGGESTIONS[0], // Dune 2
    topPicks: {
      movie: TRENDING_SUGGESTIONS[0], // Dune 2
      movieNote: 'Un monument de cinéma visuel et sonore. À voir impérativement avec un système son de qualité.',
      tv: TRENDING_SUGGESTIONS[1], // Severance
      tvNote: 'La série la plus fascinante du moment. Le twist de fin de saison est fou.',
      music: TRENDING_SUGGESTIONS[2], // Daft Punk
      musicNote: 'La bande-son parfaite pour travailler ou conduire la nuit.',
      book: TRENDING_SUGGESTIONS[3], // Le Problème à 3 corps
      bookNote: 'Un roman de hard SF ultra captivant du début à la fin.',
      podcast: TRENDING_SUGGESTIONS[4], // Transfert
      podcastNote: 'Chaque témoignage est une tranche de vie bouleversante.',
      overallFavorite: TRENDING_SUGGESTIONS[0],
      overallNote: 'Le sommet du cinéma de science-fiction moderne.',
    },
  },
  {
    id: 'friend-thomas',
    name: 'Thomas',
    handle: '@thomas_sound',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    bio: 'DJ le week-end, toujours à la recherche du sample parfait.',
    favoriteGenres: ['Électro', 'Funk', 'Jazz'],
    dropsCount: 9,
    isOnline: false,
    status: 'pending',
    topPick: TRENDING_SUGGESTIONS[2], // Daft Punk
    topPicks: {
      movie: TRENDING_SUGGESTIONS[5], // Interstellar
      movieNote: 'Pour l\'orgue d\'église dans la musique de Zimmer qui fait vibrer les tripes.',
      tv: TRENDING_SUGGESTIONS[1], // Severance
      tvNote: 'Le sound design minimaliste est un modèle du genre.',
      music: TRENDING_SUGGESTIONS[2], // Daft Punk
      musicNote: 'Le morceau Touch à 4:20 est l\'un des plus beaux moments de la musique électronique contemporaine.',
      book: TRENDING_SUGGESTIONS[3], // Le Problème à 3 corps
      bookNote: 'Une partition mathématique et poétique.',
      podcast: TRENDING_SUGGESTIONS[4], // Transfert
      podcastNote: 'Une narration au casque très immersive.',
      overallFavorite: TRENDING_SUGGESTIONS[2],
      overallNote: 'L\'album que j\'emporterais sur une île déserte.',
    },
  },
  {
    id: 'friend-chloe',
    name: 'Chloé',
    handle: '@chloe_lit',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    bio: 'Dévoreuse de romans & BDs graphiques.',
    favoriteGenres: ['Roman', 'Science-Fiction', 'BD'],
    dropsCount: 21,
    isOnline: true,
    status: 'accepted',
    topPick: TRENDING_SUGGESTIONS[3], // Le Problème à 3 corps
    topPicks: {
      movie: TRENDING_SUGGESTIONS[0], // Dune 2
      movieNote: 'Une adaptation qui fait honneur à l\'œuvre monumentale de Frank Herbert.',
      tv: TRENDING_SUGGESTIONS[1], // Severance
      tvNote: 'Des métaphores orwelliennes très puissantes.',
      music: TRENDING_SUGGESTIONS[2], // Daft Punk
      musicNote: 'Idéal en musique de fond pour lire des heures durant.',
      book: TRENDING_SUGGESTIONS[3], // Le Problème à 3 corps
      bookNote: 'Si vous aimez la physique quantique et les énigmes cosmiques, ce livre va vous marquer durablement.',
      podcast: TRENDING_SUGGESTIONS[4], // Transfert
      podcastNote: 'Comme écouter des secrets de famille au creux de l\'oreille.',
      overallFavorite: TRENDING_SUGGESTIONS[3],
      overallNote: 'Une lecture qui change à jamais votre vision de l\'humanité dans le cosmos.',
    },
  },
  {
    id: 'friend-malik',
    name: 'Malik',
    handle: '@malik_stream',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    bio: 'Binge-watcher assumé & auditeur de podcasts en voyage.',
    favoriteGenres: ['Podcast', 'Séries', 'Docu'],
    dropsCount: 12,
    isOnline: true,
    status: 'accepted',
    topPick: TRENDING_SUGGESTIONS[1], // Severance
    topPicks: {
      movie: TRENDING_SUGGESTIONS[5], // Interstellar
      movieNote: 'Le passage sur la planète aux vagues géantes reste gravé dans ma mémoire.',
      tv: TRENDING_SUGGESTIONS[1], // Severance
      tvNote: 'Un cliffhanger final d\'anthologie, lancez le premier épisode ce soir !',
      music: TRENDING_SUGGESTIONS[2], // Daft Punk
      musicNote: 'La prod de Giorgio Moroder me donne toujours le sourire.',
      book: TRENDING_SUGGESTIONS[3], // Le Problème à 3 corps
      bookNote: 'L\'un des rares livres qui m\'a fait veiller jusqu\'à 4h du matin.',
      podcast: TRENDING_SUGGESTIONS[4], // Transfert
      podcastNote: 'L\'épisode "Le Grand Saut" est inoubliable, écoutez-le absolument.',
      overallFavorite: TRENDING_SUGGESTIONS[1],
      overallNote: 'Ma plus grande claque de narration sérielle de ces 5 dernières années.',
    },
  },
];

// Drops initiaux reçus d'amis (La magie de l'Inbox)
export const DEFAULT_DROPS: DropItem[] = [
  {
    id: 'drop-demo-1',
    media: TRENDING_SUGGESTIONS[1], // Severance
    senderId: 'friend-malik',
    senderName: 'Malik',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    note: 'Tu me disais que tu cherchais une série prenante : lance le premier épisode ce soir, le twist est fou !',
    status: 'pending',
    createdAt: Date.now() - 3600000 * 2, // Il y a 2h
  },
  {
    id: 'drop-demo-2',
    media: TRENDING_SUGGESTIONS[0], // Dune 2
    senderId: 'friend-sarah',
    senderName: 'Sarah',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    note: 'On en avait parlé le week-end dernier ! Mets un bon casque pour la bande-son de Hans Zimmer.',
    status: 'pending',
    createdAt: Date.now() - 3600000 * 8, // Il y a 8h
  },
  {
    id: 'drop-demo-3',
    media: TRENDING_SUGGESTIONS[2], // Daft Punk
    senderId: 'friend-thomas',
    senderName: 'Thomas',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    note: 'Je viens de réécouter cet album au casque. Le morceau "Touch" à 4:20 me donne toujours des frissons.',
    status: 'accepted',
    createdAt: Date.now() - 3600000 * 24, // Hier
  },
];

// Liste personnelle initiale (Ma Liste)
export const DEFAULT_PERSONAL_LIST: PersonalItem[] = [
  {
    id: 'perso-1',
    media: TRENDING_SUGGESTIONS[3], // Le Problème à 3 corps
    status: 'in_progress',
    myRating: 5,
    myReview: 'Fascinant du début à la fin. La physique quantique mêlée au récit historique.',
    droppedBy: {
      name: 'Chloé',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
      note: 'Si tu aimes la Hard-SF, ce livre va te retourner le cerveau.',
    },
    addedAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'perso-2',
    media: TRENDING_SUGGESTIONS[5], // Interstellar
    status: 'favorite',
    myRating: 5,
    myReview: 'Mon film préféré de la décennie. Une leçon de cinéma et d\'émotion.',
    addedAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 20,
  },
  {
    id: 'perso-3',
    media: TRENDING_SUGGESTIONS[4], // Transfert
    status: 'want',
    droppedBy: {
      name: 'Malik',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
      note: 'Écoute l\'épisode "Le Grand Saut", incroyable.',
    },
    addedAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
];

/**
 * Fonctions de persistance LocalStorage
 */

export function loadPersonalList(): PersonalItem[] {
  if (typeof window === 'undefined') return DEFAULT_PERSONAL_LIST;
  try {
    const raw = syncStorageGet(STORAGE_KEYS.PERSONAL_LIST);
    if (!raw) {
      savePersonalList(DEFAULT_PERSONAL_LIST);
      return DEFAULT_PERSONAL_LIST;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PERSONAL_LIST;
  }
}

export function savePersonalList(list: PersonalItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(list);
    syncStorageSet(STORAGE_KEYS.PERSONAL_LIST, raw);
    idbSet(STORAGE_KEYS.PERSONAL_LIST, list).catch(() => {});
  } catch (e) {
    console.error('savePersonalList error', e);
  }
}

export function loadDrops(): DropItem[] {
  if (typeof window === 'undefined') return DEFAULT_DROPS;
  try {
    const raw = syncStorageGet(STORAGE_KEYS.DROPS_INBOX);
    if (!raw) {
      saveDrops(DEFAULT_DROPS);
      return DEFAULT_DROPS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DROPS;
  }
}

export function saveDrops(drops: DropItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(drops);
    syncStorageSet(STORAGE_KEYS.DROPS_INBOX, raw);
    idbSet(STORAGE_KEYS.DROPS_INBOX, drops).catch(() => {});
  } catch (e) {
    console.error('saveDrops error', e);
  }
}

export function loadFriends(): Friend[] {
  if (typeof window === 'undefined') return DEFAULT_FRIENDS;
  try {
    const raw = syncStorageGet(STORAGE_KEYS.FRIENDS);
    if (!raw) {
      saveFriends(DEFAULT_FRIENDS);
      return DEFAULT_FRIENDS;
    }
    const parsed: Friend[] = JSON.parse(raw);
    // Assurer que les amis possèdent leurs topPicks par défaut si absents
    return parsed.map((f) => {
      if (!f.topPicks) {
        const defaultMatch = DEFAULT_FRIENDS.find((df) => df.id === f.id);
        if (defaultMatch?.topPicks) {
          return { ...f, topPicks: defaultMatch.topPicks, topPick: f.topPick || defaultMatch.topPick };
        }
      }
      return f;
    });
  } catch {
    return DEFAULT_FRIENDS;
  }
}

export function saveFriends(friends: Friend[]): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(friends);
    syncStorageSet(STORAGE_KEYS.FRIENDS, raw);
    idbSet(STORAGE_KEYS.FRIENDS, friends).catch(() => {});
  } catch (e) {
    console.error('saveFriends error', e);
  }
}

export function loadUserProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_USER;
  try {
    const raw = syncStorageGet(STORAGE_KEYS.USER_PROFILE);
    const customAvatar = getCustomAvatarSync();

    if (!raw) {
      return {
        ...DEFAULT_USER,
        ...(customAvatar ? { avatar: customAvatar } : {}),
      };
    }

    const parsed: UserProfile = JSON.parse(raw);
    const parsedAv = parsed.avatar && parsed.avatar.trim() ? parsed.avatar.trim() : null;
    let resolvedAvatar = DEFAULT_USER.avatar;

    if (customAvatar) {
      resolvedAvatar = customAvatar;
    } else if (parsedAv && !parsedAv.includes('photo-1534528741775-53994a69daeb')) {
      resolvedAvatar = parsedAv;
    }

    parsed.avatar = resolvedAvatar;

    // S'assurer que la structure topPicks existe
    if (!parsed.topPicks) {
      parsed.topPicks = {};
    }
    return parsed;
  } catch {
    const customAvatar = getCustomAvatarSync();
    return {
      ...DEFAULT_USER,
      ...(customAvatar ? { avatar: customAvatar } : {}),
    };
  }
}

export function saveUserProfile(user: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(user);
    syncStorageSet(STORAGE_KEYS.USER_PROFILE, raw);
    idbSet(STORAGE_KEYS.USER_PROFILE, user).catch(() => {});
    if (user.avatar && user.avatar.trim()) {
      persistCustomAvatar(user.avatar.trim()).catch(() => {});
    }
  } catch (e) {
    console.error('saveUserProfile error', e);
  }
}
