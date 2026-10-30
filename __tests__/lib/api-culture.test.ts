import { searchMusic, searchPodcasts, searchBooks, searchMoviesAndSeries, universalSearch, getTmdbApiKey, saveTmdbApiKey } from '@/lib/api-culture';
import { STORAGE_KEYS, syncStorageGet, syncStorageSet } from '@/lib/persistentStorage';

jest.mock('@/lib/persistentStorage', () => ({
  STORAGE_KEYS: { TMDB_KEY: 'TMDB_KEY' },
  syncStorageGet: jest.fn(() => 'mock-tmdb-key'),
  syncStorageSet: jest.fn(),
}));

describe('api-culture', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getTmdbApiKey & saveTmdbApiKey', () => {
    it('returns saved key if available', () => {
      (syncStorageGet as jest.Mock).mockReturnValueOnce('my-key');
      expect(getTmdbApiKey()).toBe('my-key');
    });

    it('returns default key if saved key is empty', () => {
      (syncStorageGet as jest.Mock).mockReturnValueOnce('');
      expect(getTmdbApiKey()).toBe('8265bd1679663a7ea12ac168da84d2e8');
    });

    it('saves key using syncStorageSet', () => {
      saveTmdbApiKey('new-key');
      expect(syncStorageSet).toHaveBeenCalledWith('TMDB_KEY', 'new-key');
    });
  });

  describe('searchMusic', () => {
    it('returns an empty array when response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      const results = await searchMusic('test');
      expect(results).toEqual([]);
    });

    it('returns an empty array when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const results = await searchMusic('test');
      expect(results).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith('Erreur searchMusic:', expect.any(Error));
    });

    it('returns empty array when data.results is missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      const results = await searchMusic('test');
      expect(results).toEqual([]);
    });

    it('parses music results correctly', async () => {
      const mockData = {
        results: [
          {
            trackId: 1,
            trackName: 'Test Track',
            artistName: 'Test Artist',
            releaseDate: '2023-01-01T00:00:00Z',
            primaryGenreName: 'Pop',
            trackTimeMillis: 180000,
            previewUrl: 'http://example.com/preview.mp3',
            trackViewUrl: 'http://example.com/track',
            artworkUrl100: 'http://example.com/art100x100bb.jpg',
          },
        ],
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const results = await searchMusic('test');
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(expect.objectContaining({
        type: 'music',
        title: 'Test Track',
        creator: 'Test Artist',
        year: 2023,
        genres: ['Pop'],
        durationOrCount: '3 min',
        previewAudioUrl: 'http://example.com/preview.mp3',
        externalUrl: 'http://example.com/track',
        posterUrl: 'http://example.com/art600x600bb.jpg',
      }));
    });
  });

  describe('searchPodcasts', () => {
    it('returns an empty array on response failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      const results = await searchPodcasts('test');
      expect(results).toEqual([]);
    });

    it('returns an empty array on fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const results = await searchPodcasts('test');
      expect(results).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith('Erreur searchPodcasts:', expect.any(Error));
    });

    it('returns empty array when data.results is missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      const results = await searchPodcasts('test');
      expect(results).toEqual([]);
    });

    it('parses podcast results correctly', async () => {
      const mockData = {
        results: [
          {
            collectionId: 2,
            collectionName: 'Test Podcast',
            artistName: 'Test Creator',
            releaseDate: '2022-01-01T00:00:00Z',
            artworkUrl100: 'http://example.com/pod100x100bb.jpg',
            genres: ['Comedy', 'News'],
            trackCount: 50,
            collectionViewUrl: 'http://example.com/podcast',
          },
        ],
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const results = await searchPodcasts('test');
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(expect.objectContaining({
        type: 'podcast',
        title: 'Test Podcast',
        creator: 'Test Creator',
        year: 2022,
        posterUrl: 'http://example.com/pod600x600bb.jpg',
        genres: ['Comedy', 'News'],
        durationOrCount: '50 épisodes',
        externalUrl: 'http://example.com/podcast',
      }));
    });
  });

  describe('searchBooks', () => {
    it('returns an empty array on response failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      const results = await searchBooks('test');
      expect(results).toEqual([]);
    });

    it('returns an empty array on fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const results = await searchBooks('test');
      expect(results).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith('Erreur searchBooks:', expect.any(Error));
    });

    it('returns empty array when data.items is missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      const results = await searchBooks('test');
      expect(results).toEqual([]);
    });

    it('parses book results correctly with http cover image replacement', async () => {
      const mockData = {
        items: [
          {
            id: 'book1',
            volumeInfo: {
              title: 'Test Book',
              authors: ['Author A', 'Author B'],
              publishedDate: '2021-05-01',
              description: 'A test book.',
              categories: ['Fiction'],
              pageCount: 300,
              imageLinks: { thumbnail: 'http://example.com/thumb.jpg' },
              infoLink: 'http://example.com/book',
            },
          },
        ],
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const results = await searchBooks('test');
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(expect.objectContaining({
        type: 'book',
        title: 'Test Book',
        creator: 'Author A, Author B',
        year: '2021',
        overview: 'A test book.',
        genres: ['Fiction'],
        durationOrCount: '300 pages',
        posterUrl: 'https://example.com/thumb.jpg',
        externalUrl: 'http://example.com/book',
      }));
    });
  });

  describe('searchMoviesAndSeries', () => {
    it('returns an empty array on response failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      const results = await searchMoviesAndSeries('test', 'movie');
      expect(results).toEqual([]);
    });

    it('returns an empty array on fetch failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      const results = await searchMoviesAndSeries('test', 'movie');
      expect(results).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith('Erreur searchMoviesAndSeries:', expect.any(Error));
    });

    it('returns empty array when data.results is missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      const results = await searchMoviesAndSeries('test', 'movie');
      expect(results).toEqual([]);
    });

    it('parses movie results correctly', async () => {
      const mockData = {
        results: [
          {
            id: 101,
            title: 'Test Movie',
            release_date: '2020-01-01',
            overview: 'A movie test.',
            vote_average: 8.56,
            poster_path: '/poster.jpg',
          },
        ],
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const results = await searchMoviesAndSeries('test', 'movie');
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(expect.objectContaining({
        type: 'movie',
        title: 'Test Movie',
        creator: 'Cinéma',
        year: 2020,
        overview: 'A movie test.',
        rating: 8.6,
        posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
        externalUrl: 'https://www.themoviedb.org/movie/101',
      }));
    });

    it('parses tv results correctly', async () => {
      const mockData = {
        results: [
          {
            id: 102,
            name: 'Test Series',
            first_air_date: '2019-01-01',
            overview: 'A series test.',
            vote_average: 7.2,
            poster_path: '/poster2.jpg',
          },
        ],
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const results = await searchMoviesAndSeries('test', 'tv');
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(expect.objectContaining({
        type: 'tv',
        title: 'Test Series',
        creator: 'Série TV',
        year: 2019,
        overview: 'A series test.',
        rating: 7.2,
        posterUrl: 'https://image.tmdb.org/t/p/w500/poster2.jpg',
        externalUrl: 'https://www.themoviedb.org/tv/102',
      }));
    });
  });

  describe('universalSearch', () => {
    it('returns empty array when query is empty', async () => {
      const results = await universalSearch('   ');
      expect(results).toEqual([]);
    });

    it('filters by movie type correctly', async () => {
      const mockMovieData = { results: [{ id: 1, title: 'Movie 1' }] };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMovieData,
      });
      const results = await universalSearch('test', 'movie');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('movie');
    });

    it('filters by tv type correctly', async () => {
      const mockTvData = { results: [{ id: 2, name: 'TV 1' }] };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTvData,
      });
      const results = await universalSearch('test', 'tv');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('tv');
    });

    it('filters by book type correctly', async () => {
      const mockBookData = { items: [{ id: 'b1', volumeInfo: { title: 'Book 1' } }] };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBookData,
      });
      const results = await universalSearch('test', 'book');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('book');
    });

    it('filters by podcast type correctly', async () => {
      const mockPodcastData = { results: [{ collectionId: 4, collectionName: 'Podcast 1' }] };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPodcastData,
      });
      const results = await universalSearch('test', 'podcast');
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('podcast');
    });


    it('combines results when filterType is all and handles concurrent search errors for all services', async () => {
      // Mock global fetch to reject every time, triggering all catch blocks in Promise.all
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const results = await universalSearch('test', 'all');

      // Since all promises should resolve to [] via .catch(() => []),
      // combined array should be empty.
      expect(results).toEqual([]);

      // Ensure console.warn was called by the individual functions
      expect(console.warn).toHaveBeenCalledWith('Erreur searchMoviesAndSeries:', expect.any(Error));
      expect(console.warn).toHaveBeenCalledWith('Erreur searchMusic:', expect.any(Error));
      expect(console.warn).toHaveBeenCalledWith('Erreur searchBooks:', expect.any(Error));
      expect(console.warn).toHaveBeenCalledWith('Erreur searchPodcasts:', expect.any(Error));
    });

    it('combines results when filterType is all and handles concurrent search errors', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('search/movie')) return Promise.resolve({ ok: true, json: async () => ({ results: [{ id: 1, title: 'Movie 1' }, { id: 11, title: 'Movie 2' }] }) });
        if (url.includes('search/tv')) return Promise.resolve({ ok: true, json: async () => ({ results: [{ id: 2, name: 'TV 1' }] }) });
        if (url.includes('music')) return Promise.reject(new Error('Music error')); // simulate failure
        if (url.includes('books')) return Promise.resolve({ ok: true, json: async () => ({ items: [{ id: 'b1', volumeInfo: { title: 'Book 1' } }] }) });
        if (url.includes('podcast')) return Promise.resolve({ ok: true, json: async () => ({ results: [{ collectionId: 4, collectionName: 'Podcast 1' }] }) });
        return Promise.resolve({ ok: false });
      });

      const results = await universalSearch('test', 'all');
      // Max items requested is max(2, 1, 0, 1, 1) = 2.
      // Interleaving loops up to 2:
      // i = 0: Movie 1, TV 1, Book 1, Podcast 1
      // i = 1: Movie 2
      // So expected order: movie, tv, book, podcast, movie
      // And length: 5
      expect(results).toHaveLength(5);
      const types = results.map(r => r.type);
      expect(types).toEqual(['movie', 'tv', 'book', 'podcast', 'movie']);
    });
  });
});
