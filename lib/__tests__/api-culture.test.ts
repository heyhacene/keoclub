// Test for universalSearch with global fetch mocking

import { universalSearch } from '../api-culture';

describe('api-culture: universalSearch', () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    global.fetch = jest.fn();
    // suppress console.warn for intentional network errors
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.warn as jest.Mock).mockRestore();
  });

  it('should return empty array for empty query', async () => {
    const results = await universalSearch('   ');
    expect(results).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should return results when filterType is movie', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 1,
            title: 'Dune Movie',
            release_date: '2021-10-22',
            overview: 'Movie overview',
            poster_path: '/path.jpg',
            vote_average: 8.0,
          }
        ]
      })
    });

    const results = await universalSearch('dune', 'movie');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('search/movie'));
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Dune Movie');
    expect(results[0].type).toBe('movie');
  });

  it('should return results when filterType is tv', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 2,
            name: 'Dune TV',
            first_air_date: '2021-10-22',
            overview: 'TV overview',
            poster_path: '/path.jpg',
            vote_average: 8.0,
          }
        ]
      })
    });

    const results = await universalSearch('dune', 'tv');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('search/tv'));
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Dune TV');
    expect(results[0].type).toBe('tv');
  });

  it('should return results when filterType is music', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            trackId: 1,
            trackName: 'Dune Song',
            artistName: 'Hans Zimmer',
          }
        ]
      })
    });

    const results = await universalSearch('dune', 'music');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('media=music'));
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Dune Song');
    expect(results[0].type).toBe('music');
  });

  it('should return results when filterType is book', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: '1',
            volumeInfo: {
              title: 'Dune Book',
              authors: ['Frank Herbert'],
            }
          }
        ]
      })
    });

    const results = await universalSearch('dune', 'book');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('googleapis.com/books'));
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Dune Book');
    expect(results[0].type).toBe('book');
  });

  it('should return results when filterType is podcast', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            collectionId: 1,
            collectionName: 'Dune Podcast',
            artistName: 'Podcaster',
          }
        ]
      })
    });

    const results = await universalSearch('dune', 'podcast');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('media=podcast'));
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Dune Podcast');
    expect(results[0].type).toBe('podcast');
  });

  it('should aggregate all sources intelligently when filterType is all', async () => {
    // We need to mock exactly 5 fetch calls for universalSearch('dune', 'all')
    // searchMoviesAndSeries (movie), searchMoviesAndSeries (tv), searchMusic, searchBooks, searchPodcasts

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('search/movie')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: [{ id: 1, title: 'Movie 1', release_date: '2021-01-01', overview: 'm1' }]
          })
        });
      }
      if (url.includes('search/tv')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: [{ id: 2, name: 'TV 1', first_air_date: '2021-01-01', overview: 't1' }]
          })
        });
      }
      if (url.includes('itunes.apple.com') && url.includes('media=music')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: [{ trackId: 3, trackName: 'Music 1', artistName: 'Artist 1' }]
          })
        });
      }
      if (url.includes('googleapis.com/books')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            items: [{ id: '4', volumeInfo: { title: 'Book 1', authors: ['Author 1'] } }]
          })
        });
      }
      if (url.includes('itunes.apple.com') && url.includes('media=podcast')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: [{ collectionId: 5, collectionName: 'Podcast 1', artistName: 'Podcaster 1' }]
          })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const results = await universalSearch('dune', 'all');

    expect(global.fetch).toHaveBeenCalledTimes(5);

    // We expect exactly 5 items because each source returned 1 item
    expect(results.length).toBe(5);

    // Check order (interleaved): movie, tv, music, book, podcast
    expect(results[0].type).toBe('movie');
    expect(results[1].type).toBe('tv');
    expect(results[2].type).toBe('music');
    expect(results[3].type).toBe('book');
    expect(results[4].type).toBe('podcast');
  });

  it('should handle failures in individual search functions gracefully', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('search/movie')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: [{ id: 1, title: 'Movie 1', release_date: '2021-01-01', overview: 'm1' }]
          })
        });
      }
      // Simulate failure for everything else
      return Promise.reject(new Error('Network error'));
    });

    const results = await universalSearch('dune', 'all');

    // Should still return the successful result
    expect(results.length).toBe(1);
    expect(results[0].type).toBe('movie');
    expect(results[0].title).toBe('Movie 1');
    expect(console.warn).toHaveBeenCalledTimes(4); // TV, music, book, podcast failed
  });

  it('should handle empty results from individual search functions', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('search/movie')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: [{ id: 1, title: 'Movie 1', release_date: '2021-01-01', overview: 'm1' }]
          })
        });
      }
      // Return empty results for others
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });

    const results = await universalSearch('dune', 'all');

    expect(results.length).toBe(1);
    expect(results[0].type).toBe('movie');
    expect(results[0].title).toBe('Movie 1');
  });
});
