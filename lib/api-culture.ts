import { MediaItem, MediaType } from '@/types/culture';
import { STORAGE_KEYS, syncStorageGet, syncStorageSet } from './persistentStorage';

// Clé publique TMDB par défaut (avec fallback automatique si indisponible)
const DEFAULT_TMDB_API_KEY = '8265bd1679663a7ea12ac168da84d2e8';

export function getTmdbApiKey(): string {
  if (typeof window !== 'undefined') {
    const saved = syncStorageGet(STORAGE_KEYS.TMDB_KEY);
    if (saved && saved.trim()) return saved.trim();
  }
  return DEFAULT_TMDB_API_KEY;
}

export function saveTmdbApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    syncStorageSet(STORAGE_KEYS.TMDB_KEY, key.trim());
  }
}

/**
 * 1. Recherche Musique via iTunes Search API (100% gratuit, sans clé, avec extraits audio 30s)
 */
export async function searchMusic(query: string): Promise<MediaItem[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=15&country=FR`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];

    return data.results.map((item: any) => {
      const highResArt = (item.artworkUrl100 || '').replace('100x100bb', '600x600bb');
      const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : undefined;
      const durationMin = item.trackTimeMillis ? Math.round(item.trackTimeMillis / 60000) : undefined;

      return {
        id: `music-itunes-${item.trackId || item.collectionId || Math.random()}`,
        type: 'music' as MediaType,
        title: item.trackName || item.collectionName || 'Morceau inconnu',
        creator: item.artistName || 'Artiste',
        year,
        posterUrl: highResArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
        overview: `Titre extrait de l'album "${item.collectionName || 'Single'}" • Genre : ${item.primaryGenreName || 'Musique'}`,
        genres: [item.primaryGenreName || 'Musique'],
        durationOrCount: durationMin ? `${durationMin} min` : undefined,
        previewAudioUrl: item.previewUrl || undefined,
        externalUrl: item.trackViewUrl || item.collectionViewUrl || undefined,
        platforms: ['Apple Music', 'Spotify', 'Deezer'],
      };
    });
  } catch (err) {
    console.warn('Erreur searchMusic:', err);
    return [];
  }
}

/**
 * 2. Recherche Podcasts via iTunes Podcast API (100% gratuit)
 */
export async function searchPodcasts(query: string): Promise<MediaItem[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=podcast&entity=podcast&limit=15&country=FR`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];

    return data.results.map((item: any) => {
      const highResArt = (item.artworkUrl100 || item.artworkUrl600 || '').replace('100x100bb', '600x600bb');
      const year = item.releaseDate ? new Date(item.releaseDate).getFullYear() : undefined;

      return {
        id: `pod-itunes-${item.collectionId || Math.random()}`,
        type: 'podcast' as MediaType,
        title: item.collectionName || 'Podcast',
        creator: item.artistName || 'Animateur',
        year,
        posterUrl: highResArt || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&q=80',
        overview: item.collectionCensoredName || `Émission animée par ${item.artistName || 'Créateur'}. Nombre d'épisodes : ${item.trackCount || 'Plusieurs'}`,
        genres: item.genres && Array.isArray(item.genres) ? item.genres.slice(0, 3) : ['Podcast'],
        durationOrCount: item.trackCount ? `${item.trackCount} épisodes` : 'Régulier',
        previewAudioUrl: undefined,
        externalUrl: item.collectionViewUrl || undefined,
        platforms: ['Apple Podcasts', 'Spotify'],
      };
    });
  } catch (err) {
    console.warn('Erreur searchPodcasts:', err);
    return [];
  }
}

/**
 * 3. Recherche Livres via Google Books API (100% gratuit)
 */
export async function searchBooks(query: string): Promise<MediaItem[]> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=15&langRestrict=fr`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.items) return [];

    return data.items.map((item: any) => {
      const info = item.volumeInfo || {};
      let cover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
      if (cover.startsWith('http://')) {
        cover = cover.replace('http://', 'https://');
      }
      const authors = info.authors ? info.authors.join(', ') : 'Auteur inconnu';
      const year = info.publishedDate ? info.publishedDate.substring(0, 4) : undefined;

      return {
        id: `book-gb-${item.id || Math.random()}`,
        type: 'book' as MediaType,
        title: info.title || 'Livre sans titre',
        creator: authors,
        year,
        posterUrl: cover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
        overview: info.description || info.subtitle || 'Aucun résumé disponible pour ce livre.',
        genres: info.categories && Array.isArray(info.categories) ? info.categories.slice(0, 2) : ['Littérature'],
        durationOrCount: info.pageCount ? `${info.pageCount} pages` : undefined,
        externalUrl: info.infoLink || undefined,
      };
    });
  } catch (err) {
    console.warn('Erreur searchBooks:', err);
    return [];
  }
}

/**
 * 4. Recherche Films & Séries via TMDB API
 */
export async function searchMoviesAndSeries(query: string, type: 'movie' | 'tv'): Promise<MediaItem[]> {
  const apiKey = getTmdbApiKey();
  const endpoint = type === 'movie' ? 'search/movie' : 'search/tv';

  try {
    const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=fr-FR&page=1&include_adult=false`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];

    return data.results.slice(0, 15).map((item: any) => {
      const isMovie = type === 'movie';
      const title = isMovie ? item.title : item.name;
      const releaseDate = isMovie ? item.release_date : item.first_air_date;
      const year = releaseDate ? new Date(releaseDate).getFullYear() : undefined;
      const poster = item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80';

      return {
        id: `tmdb-${type}-${item.id}`,
        type,
        title: title || 'Titre inconnu',
        creator: isMovie ? 'Cinéma' : 'Série TV',
        year,
        posterUrl: poster,
        overview: item.overview || 'Synopsis non renseigné en français.',
        genres: isMovie ? ['Cinéma'] : ['Série'],
        rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : undefined,
        durationOrCount: isMovie ? undefined : 'Saisons',
        externalUrl: `https://www.themoviedb.org/${type}/${item.id}`,
        platforms: ['Netflix', 'Prime Video', 'Canal+', 'Disney+'],
      };
    });
  } catch (err) {
    console.warn('Erreur searchMoviesAndSeries:', err);
    return [];
  }
}

/**
 * 5. Moteur de recherche universel multi-médias
 */
export async function universalSearch(query: string, filterType: 'all' | MediaType = 'all'): Promise<MediaItem[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  if (filterType === 'movie') return searchMoviesAndSeries(cleanQ, 'movie');
  if (filterType === 'tv') return searchMoviesAndSeries(cleanQ, 'tv');
  if (filterType === 'music') return searchMusic(cleanQ);
  if (filterType === 'book') return searchBooks(cleanQ);
  if (filterType === 'podcast') return searchPodcasts(cleanQ);

  // Recherche groupée simultanée sur les 5 univers
  const [movies, series, musics, books, podcasts] = await Promise.all([
    searchMoviesAndSeries(cleanQ, 'movie').catch(() => []),
    searchMoviesAndSeries(cleanQ, 'tv').catch(() => []),
    searchMusic(cleanQ).catch(() => []),
    searchBooks(cleanQ).catch(() => []),
    searchPodcasts(cleanQ).catch(() => []),
  ]);

  // Entremêler intelligemment les résultats
  const combined: MediaItem[] = [];
  const maxLen = Math.max(movies.length, series.length, musics.length, books.length, podcasts.length);

  for (let i = 0; i < maxLen; i++) {
    if (movies[i]) combined.push(movies[i]);
    if (series[i]) combined.push(series[i]);
    if (musics[i]) combined.push(musics[i]);
    if (books[i]) combined.push(books[i]);
    if (podcasts[i]) combined.push(podcasts[i]);
  }

  return combined;
}

export const searchAllCulture = universalSearch;

/**
 * Suggestions culturelles d'accueil (Tops & Recommandations du moment)
 */
export const TRENDING_SUGGESTIONS: MediaItem[] = [
  {
    id: 'trending-1',
    type: 'movie',
    title: 'Dune : Deuxième Partie',
    creator: 'Denis Villeneuve',
    year: 2024,
    posterUrl: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
    overview: 'Paul Atréides s\'unit à Chani et aux Fremen tout en préparant sa revanche contre les conspirateurs qui ont détruit sa famille.',
    genres: ['Science-Fiction', 'Aventure'],
    rating: 8.3,
    durationOrCount: '2h 46m',
    platforms: ['Canal+', 'VOD'],
  },
  {
    id: 'trending-2',
    type: 'tv',
    title: 'Severance',
    creator: 'Dan Erickson',
    year: 2022,
    posterUrl: 'https://image.tmdb.org/t/p/w500/abKZr12i05k596hI5LpXWq4n94B.jpg',
    overview: 'Mark dirige une équipe d\'employés de bureau dont les souvenirs ont été chirurgiquement séparés entre vie professionnelle et personnelle.',
    genres: ['Thriller', 'Sci-Fi'],
    rating: 8.7,
    durationOrCount: '2 Saisons',
    platforms: ['Apple TV+'],
  },
  {
    id: 'trending-3',
    type: 'music',
    title: 'Random Access Memories',
    creator: 'Daft Punk',
    year: 2013,
    posterUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&q=80',
    overview: 'Le chef d\'œuvre intemporel aux multiples Grammy Awards comprenant Get Lucky, Instant Crush et Giorgio by Moroder.',
    genres: ['Électro', 'Funk'],
    platforms: ['Spotify', 'Apple Music', 'Deezer'],
    previewAudioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/37/87/42/378742b6-2713-39d7-83eb-5614eb581e22/mzaf_10023648480962388062.plus.aac.p.m4a',
  },
  {
    id: 'trending-4',
    type: 'book',
    title: 'Le Problème à trois corps',
    creator: 'Liu Cixin',
    year: 2008,
    posterUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80',
    overview: 'Premier contact fascinant entre l\'humanité et une civilisation extraterrestre en perdition dans un système à trois étoiles.',
    genres: ['Science-Fiction', 'Hard SF'],
    durationOrCount: '440 pages',
  },
  {
    id: 'trending-5',
    type: 'podcast',
    title: 'Transfert',
    creator: 'Slate / Louie Media',
    year: 2024,
    posterUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&q=80',
    overview: 'Des histoires intimes et bouleversantes racontées à la première personne par ceux qui les ont vécues.',
    genres: ['Témoignage', 'Société'],
    durationOrCount: 'Hebdomadaire',
    platforms: ['Spotify', 'Apple Podcasts'],
  },
  {
    id: 'trending-6',
    type: 'movie',
    title: 'Interstellar',
    creator: 'Christopher Nolan',
    year: 2014,
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    overview: 'Une équipe d\'explorateurs voyage par-delà la galaxie grâce à une faille spatio-temporelle pour trouver une nouvelle planète habitable.',
    genres: ['Sci-Fi', 'Drame'],
    rating: 8.6,
    durationOrCount: '2h 49m',
    platforms: ['Netflix', 'Prime Video'],
  },
];
