import {
  getDirectKeoClubApkUrl,
  getDirectKeoClubApkFilename,
  fetchLatestKeoClubApk,
  DEFAULT_KEOCLUB_BUILD,
} from './apkUpdate';

describe('apkUpdate module', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn();
  });

  describe('getDirectKeoClubApkUrl', () => {
    it('returns the URL using the default build number when no argument is provided', () => {
      const url = getDirectKeoClubApkUrl();
      expect(url).toBe(
        `https://github.com/heyhacene/keoclub/releases/download/v1.0.0-build.${DEFAULT_KEOCLUB_BUILD}/KeoClub-Build-${DEFAULT_KEOCLUB_BUILD}.apk`
      );
    });

    it('returns the URL using the provided build number', () => {
      const customBuild = '42';
      const url = getDirectKeoClubApkUrl(customBuild);
      expect(url).toBe(
        'https://github.com/heyhacene/keoclub/releases/download/v1.0.0-build.42/KeoClub-Build-42.apk'
      );
    });
  });

  describe('getDirectKeoClubApkFilename', () => {
    it('returns the filename using the default build number when no argument is provided', () => {
      const filename = getDirectKeoClubApkFilename();
      expect(filename).toBe(`KeoClub-Build-${DEFAULT_KEOCLUB_BUILD}.apk`);
    });

    it('returns the filename using the provided build number', () => {
      const customBuild = '99';
      const filename = getDirectKeoClubApkFilename(customBuild);
      expect(filename).toBe('KeoClub-Build-99.apk');
    });
  });

  describe('fetchLatestKeoClubApk', () => {
    const fallbackRelease = {
      version: `v1.0.0-build.${DEFAULT_KEOCLUB_BUILD}`,
      buildNumber: parseInt(DEFAULT_KEOCLUB_BUILD, 10),
      filename: `KeoClub-Build-${DEFAULT_KEOCLUB_BUILD}.apk`,
      downloadUrl: `https://github.com/heyhacene/keoclub/releases/download/v1.0.0-build.${DEFAULT_KEOCLUB_BUILD}/KeoClub-Build-${DEFAULT_KEOCLUB_BUILD}.apk`,
      sizeBytes: 0,
    };

    it('returns the fallback release if fetch throws a network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await fetchLatestKeoClubApk();
      expect(result).toEqual(fallbackRelease);
    });

    it('returns the fallback release if the fetch response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      const result = await fetchLatestKeoClubApk();
      expect(result).toEqual(fallbackRelease);
    });

    it('returns the fallback release if the response data is empty or assets is not an array', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await fetchLatestKeoClubApk();
      expect(result).toEqual(fallbackRelease);
    });

    it('returns the fallback release if no APK asset is found', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          assets: [
            { name: 'source.zip', browser_download_url: 'http://example.com/source.zip', size: 100 },
          ],
        }),
      });

      const result = await fetchLatestKeoClubApk();
      expect(result).toEqual(fallbackRelease);
    });

    it('extracts release info when a KeoClub-Build-* APK asset is found', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.0.0-build.30',
          assets: [
            {
              name: 'KeoClub-Build-30.apk',
              browser_download_url: 'http://example.com/KeoClub-Build-30.apk',
              size: 5000,
            },
          ],
        }),
      });

      const result = await fetchLatestKeoClubApk();
      expect(result).toEqual({
        version: 'v1.0.0-build.30',
        buildNumber: 30,
        filename: 'KeoClub-Build-30.apk',
        downloadUrl: 'http://example.com/KeoClub-Build-30.apk',
        sizeBytes: 5000,
      });
    });

    it('extracts release info from a generic APK if KeoClub-Build-* APK is missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.0.0-build.35',
          assets: [
            {
              name: 'app-release.apk',
              browser_download_url: 'http://example.com/app-release.apk',
              size: 6000,
            },
          ],
        }),
      });

      const result = await fetchLatestKeoClubApk();
      expect(result).toEqual({
        version: 'v1.0.0-build.35',
        buildNumber: 35,
        filename: 'app-release.apk',
        downloadUrl: 'http://example.com/app-release.apk',
        sizeBytes: 6000,
      });
    });

    it('uses fallback build number if build number cannot be extracted from name or tag_name', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          // no tag_name or tag_name without build number
          assets: [
            {
              name: 'app-release.apk',
              browser_download_url: 'http://example.com/app-release.apk',
              size: 7000,
            },
          ],
        }),
      });

      const result = await fetchLatestKeoClubApk();
      const expectedBuildNum = parseInt(DEFAULT_KEOCLUB_BUILD, 10);
      expect(result).toEqual({
        version: `v1.0.0-build.${expectedBuildNum}`,
        buildNumber: expectedBuildNum,
        filename: 'app-release.apk',
        downloadUrl: 'http://example.com/app-release.apk',
        sizeBytes: 7000,
      });
    });

    it('defaults sizeBytes to 0 if size is missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          tag_name: 'v1.0.0-build.30',
          assets: [
            {
              name: 'KeoClub-Build-30.apk',
              browser_download_url: 'http://example.com/KeoClub-Build-30.apk',
            },
          ],
        }),
      });

      const result = await fetchLatestKeoClubApk();
      expect(result.sizeBytes).toBe(0);
    });
  });
});
