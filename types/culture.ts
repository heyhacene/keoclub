export type MediaType = 'movie' | 'tv' | 'music' | 'book' | 'podcast';

export interface MediaItem {
  id: string;
  type: MediaType;
  title: string;
  creator: string; // Réalisateur, Artiste, Auteur, Animateur
  year?: number | string;
  posterUrl: string;
  overview: string;
  genres: string[];
  rating?: number; // 0 to 10 ou 0 to 5
  durationOrCount?: string; // "2h 10m", "4 Saisons", "320 pages", etc.
  previewAudioUrl?: string; // URL audio 30s (iTunes / Podcast)
  externalUrl?: string;
  platforms?: string[]; // Netflix, Prime, Canal+, Spotify, etc.
}

export interface DropItem {
  id: string;
  media: MediaItem;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId?: string;
  recipientName?: string;
  note: string; // Ex: "Tu m'en diras des nouvelles !", "Écoute ce morceau à fond"
  status: 'pending' | 'accepted' | 'ignored';
  createdAt: number;
}

export type PersonalItemStatus = 'want' | 'in_progress' | 'completed' | 'favorite';

export interface PersonalItem {
  id: string;
  media: MediaItem;
  status: PersonalItemStatus;
  myRating?: number; // 1 to 5
  myReview?: string;
  droppedBy?: {
    name: string;
    avatar: string;
    note?: string;
  };
  addedAt: number;
  updatedAt: number;
}

/**
 * Top Culturel / Panthéon personnel consultable par le cercle d'amis
 */
export interface UserTopPicks {
  movie?: MediaItem;
  movieNote?: string;
  tv?: MediaItem;
  tvNote?: string;
  music?: MediaItem;
  musicNote?: string;
  book?: MediaItem;
  bookNote?: string;
  podcast?: MediaItem;
  podcastNote?: string;
  overallFavorite?: MediaItem;
  overallNote?: string;
}

export interface Friend {
  id: string;
  name: string;
  handle: string; // @pseudo
  avatar: string;
  bio?: string;
  favoriteGenres: string[];
  topPick?: MediaItem;
  topPicks?: UserTopPicks;
  dropsCount: number;
  isOnline?: boolean;
  status?: 'pending' | 'accepted';
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  shareCode: string;
  topPicks?: UserTopPicks;
}
