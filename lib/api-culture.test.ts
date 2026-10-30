import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchMusic } from './api-culture';

describe('searchMusic', () => {
  let consoleSpy: any;

  beforeEach(() => {
    vi.resetAllMocks();
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should return empty array if fetch fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const result = await searchMusic('test');
    expect(result).toEqual([]);
    expect(global.fetch).toHaveBeenCalledWith('https://itunes.apple.com/search?term=test&media=music&entity=song&limit=15&country=FR');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should return empty array if fetch response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    });
    const result = await searchMusic('test');
    expect(result).toEqual([]);
  });

  it('should return empty array if results is undefined', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    const result = await searchMusic('test');
    expect(result).toEqual([]);
  });

  it('should return empty array if JSON parsing fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON')),
    });
    const result = await searchMusic('test');
    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should format and return results properly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: [
          {
            trackId: 123,
            trackName: 'Track Name',
            artistName: 'Artist Name',
            releaseDate: '2023-01-01T00:00:00Z',
            artworkUrl100: 'http://example.com/100x100bb.jpg',
            collectionName: 'Album Name',
            primaryGenreName: 'Pop',
            trackTimeMillis: 180000,
            previewUrl: 'http://example.com/preview.mp3',
            trackViewUrl: 'http://example.com/track',
          }
        ]
      }),
    });
    const result = await searchMusic('test');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: expect.stringContaining('music-itunes-123'),
      type: 'music',
      title: 'Track Name',
      creator: 'Artist Name',
      year: 2023,
      posterUrl: 'http://example.com/600x600bb.jpg',
      overview: 'Titre extrait de l\'album "Album Name" • Genre : Pop',
      genres: ['Pop'],
      durationOrCount: '3 min',
      previewAudioUrl: 'http://example.com/preview.mp3',
      externalUrl: 'http://example.com/track',
      platforms: ['Apple Music', 'Spotify', 'Deezer'],
    });
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
