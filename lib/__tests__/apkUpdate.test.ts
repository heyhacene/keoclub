import { fetchLatestKeoClubApk, getDirectKeoClubApkFilename, getDirectKeoClubApkUrl, DEFAULT_KEOCLUB_BUILD } from '../apkUpdate';

// Mock fetch globally
global.fetch = jest.fn();

describe('apkUpdate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchLatestKeoClubApk', () => {
    it('should return fallback release when fetch fails', async () => {
      // Mock fetch to simulate a network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchLatestKeoClubApk();

      expect(result).toEqual({
        version: `v1.0.0-build.${DEFAULT_KEOCLUB_BUILD}`,
        buildNumber: parseInt(DEFAULT_KEOCLUB_BUILD, 10),
        filename: getDirectKeoClubApkFilename(),
        downloadUrl: getDirectKeoClubApkUrl(),
        sizeBytes: 0,
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.github.com/repos/heyhacene/keoclub/releases/latest',
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/vnd.github.v3+json',
          }),
        })
      );
    });

    it('should return fallback release when fetch returns non-ok status', async () => {
      // Mock fetch to simulate a 404 response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await fetchLatestKeoClubApk();

      expect(result).toEqual({
        version: `v1.0.0-build.${DEFAULT_KEOCLUB_BUILD}`,
        buildNumber: parseInt(DEFAULT_KEOCLUB_BUILD, 10),
        filename: getDirectKeoClubApkFilename(),
        downloadUrl: getDirectKeoClubApkUrl(),
        sizeBytes: 0,
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return fallback release when response JSON does not contain assets array', async () => {
      // Mock fetch to simulate a successful response but unexpected JSON format
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ someOtherData: true }),
      });

      const result = await fetchLatestKeoClubApk();

      expect(result).toEqual({
        version: `v1.0.0-build.${DEFAULT_KEOCLUB_BUILD}`,
        buildNumber: parseInt(DEFAULT_KEOCLUB_BUILD, 10),
        filename: getDirectKeoClubApkFilename(),
        downloadUrl: getDirectKeoClubApkUrl(),
        sizeBytes: 0,
      });
    });

    it('should return fallback release when no APK asset is found', async () => {
      // Mock fetch to simulate a response with assets but no matching APK
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          assets: [
            { name: 'some-other-file.zip' },
            { name: 'KeoClub-Build-21.txt' },
          ],
        }),
      });

      const result = await fetchLatestKeoClubApk();

      expect(result).toEqual({
        version: `v1.0.0-build.${DEFAULT_KEOCLUB_BUILD}`,
        buildNumber: parseInt(DEFAULT_KEOCLUB_BUILD, 10),
        filename: getDirectKeoClubApkFilename(),
        downloadUrl: getDirectKeoClubApkUrl(),
        sizeBytes: 0,
      });
    });

    it('should successfully parse and return APK release information', async () => {
      // Mock fetch to simulate a successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tag_name: 'v1.0.0-build.42',
          assets: [
            {
              name: 'KeoClub-Build-42.apk',
              browser_download_url: 'https://github.com/heyhacene/keoclub/releases/download/v1.0.0-build.42/KeoClub-Build-42.apk',
              size: 10485760, // 10 MB
            },
          ],
        }),
      });

      const result = await fetchLatestKeoClubApk();

      expect(result).toEqual({
        version: 'v1.0.0-build.42',
        buildNumber: 42,
        filename: 'KeoClub-Build-42.apk',
        downloadUrl: 'https://github.com/heyhacene/keoclub/releases/download/v1.0.0-build.42/KeoClub-Build-42.apk',
        sizeBytes: 10485760,
      });
    });
  });
});
