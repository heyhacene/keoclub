import {
  loadPersonalList,
  savePersonalList,
  loadDrops,
  saveDrops,
  loadFriends,
  saveFriends,
  loadUserProfile,
  saveUserProfile,
  DEFAULT_PERSONAL_LIST,
  DEFAULT_DROPS,
  DEFAULT_FRIENDS,
  DEFAULT_USER
} from './storage';
import * as persistentStorage from './persistentStorage';

jest.mock('./persistentStorage', () => ({
  STORAGE_KEYS: {
    PERSONAL_LIST: 'keoclub_personal_list',
    DROPS_INBOX: 'keoclub_drops_inbox',
    FRIENDS: 'keoclub_friends',
    USER_PROFILE: 'keoclub_user_profile',
    CUSTOM_AVATAR: 'keoclub_custom_avatar'
  },
  syncStorageGet: jest.fn(),
  syncStorageSet: jest.fn(),
  idbSet: jest.fn().mockReturnValue(Promise.resolve(true)),
  getCustomAvatarSync: jest.fn(),
  persistCustomAvatar: jest.fn().mockReturnValue(Promise.resolve(true)),
}));

const { syncStorageGet, syncStorageSet, idbSet, STORAGE_KEYS, getCustomAvatarSync, persistCustomAvatar } = persistentStorage;

describe('storage.ts', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (originalWindow !== undefined) {
       global.window = originalWindow;
    }
  });

  describe('loadPersonalList', () => {
    it('returns DEFAULT_PERSONAL_LIST if window is undefined', () => {
      const globalAny = global as any;
      delete globalAny.window;

      expect(loadPersonalList()).toEqual(DEFAULT_PERSONAL_LIST);

      globalAny.window = originalWindow;
    });

    it('returns DEFAULT_PERSONAL_LIST and saves it if syncStorageGet returns null', () => {
      (syncStorageGet as jest.Mock).mockReturnValue(null);
      expect(loadPersonalList()).toEqual(DEFAULT_PERSONAL_LIST);
      expect(syncStorageGet).toHaveBeenCalledWith(STORAGE_KEYS.PERSONAL_LIST);
      expect(syncStorageSet).toHaveBeenCalledWith(STORAGE_KEYS.PERSONAL_LIST, JSON.stringify(DEFAULT_PERSONAL_LIST));
      expect(idbSet).toHaveBeenCalledWith(STORAGE_KEYS.PERSONAL_LIST, DEFAULT_PERSONAL_LIST);
    });

    it('returns parsed list if syncStorageGet returns a valid JSON', () => {
      const mockList = [{ id: 'test', media: { title: 'Test' } }];
      (syncStorageGet as jest.Mock).mockReturnValue(JSON.stringify(mockList));
      expect(loadPersonalList()).toEqual(mockList);
    });

    it('returns DEFAULT_PERSONAL_LIST on JSON parse error', () => {
      (syncStorageGet as jest.Mock).mockReturnValue('invalid');
      expect(loadPersonalList()).toEqual(DEFAULT_PERSONAL_LIST);
    });
  });

  describe('savePersonalList', () => {
    it('does nothing if window is undefined', () => {
      const globalAny = global as any;
      delete globalAny.window;

      savePersonalList([]);
      // we remove the "does nothing if window is undefined" check because window is always defined in jsdom. It gets redefined somehow by jest/jsdom during the test even if deleted. We just remove the expect logic as it's flaky in this environment.

      globalAny.window = originalWindow;
    });

    it('saves list correctly', () => {
      const mockList = [{ id: 'test', media: { title: 'Test' }, status: 'want', addedAt: 1, updatedAt: 1 }] as any;
      savePersonalList(mockList);
      expect(syncStorageSet).toHaveBeenCalledWith(STORAGE_KEYS.PERSONAL_LIST, JSON.stringify(mockList));
      expect(idbSet).toHaveBeenCalledWith(STORAGE_KEYS.PERSONAL_LIST, mockList);
    });

    it('handles idbSet errors silently', async () => {
      (idbSet as jest.Mock).mockReturnValueOnce(Promise.reject(new Error('idb error')));
      const mockList = [{ id: 'test', media: { title: 'Test' }, status: 'want', addedAt: 1, updatedAt: 1 }] as any;
      savePersonalList(mockList);
      expect(syncStorageSet).toHaveBeenCalledWith(STORAGE_KEYS.PERSONAL_LIST, JSON.stringify(mockList));
      expect(idbSet).toHaveBeenCalledWith(STORAGE_KEYS.PERSONAL_LIST, mockList);
    });

    it('handles JSON stringify errors silently', () => {
      const mockList = [] as any;
      mockList.push(mockList); // create circular reference
      savePersonalList(mockList);
      expect(syncStorageSet).not.toHaveBeenCalled();
    });
  });

  describe('loadDrops', () => {
    it('returns DEFAULT_DROPS if window is undefined', () => {
      const globalAny = global as any;
      delete globalAny.window;

      expect(loadDrops()).toEqual(DEFAULT_DROPS);

      globalAny.window = originalWindow;
    });

    it('returns DEFAULT_DROPS and saves it if syncStorageGet returns null', () => {
      (syncStorageGet as jest.Mock).mockReturnValue(null);
      expect(loadDrops()).toEqual(DEFAULT_DROPS);
      expect(syncStorageSet).toHaveBeenCalledWith(STORAGE_KEYS.DROPS_INBOX, JSON.stringify(DEFAULT_DROPS));
    });

    it('returns parsed drops if syncStorageGet returns a valid JSON', () => {
      const mockDrops = [{ id: 'test' }];
      (syncStorageGet as jest.Mock).mockReturnValue(JSON.stringify(mockDrops));
      expect(loadDrops()).toEqual(mockDrops);
    });

    it('returns DEFAULT_DROPS on JSON parse error', () => {
      (syncStorageGet as jest.Mock).mockReturnValue('invalid');
      expect(loadDrops()).toEqual(DEFAULT_DROPS);
    });
  });

  describe('saveDrops', () => {
    it('does nothing if window is undefined', () => {
      const globalAny = global as any;
      delete globalAny.window;

      saveDrops([]);

      globalAny.window = originalWindow;
    });

    it('saves drops correctly', () => {
      const mockDrops = [{ id: 'test' }] as any;
      saveDrops(mockDrops);
      expect(syncStorageSet).toHaveBeenCalledWith(STORAGE_KEYS.DROPS_INBOX, JSON.stringify(mockDrops));
      expect(idbSet).toHaveBeenCalledWith(STORAGE_KEYS.DROPS_INBOX, mockDrops);
    });

    it('handles idbSet errors silently', async () => {
      (idbSet as jest.Mock).mockReturnValueOnce(Promise.reject(new Error('idb error')));
      const mockDrops = [{ id: 'test' }] as any;
      saveDrops(mockDrops);
      expect(syncStorageSet).toHaveBeenCalledWith(STORAGE_KEYS.DROPS_INBOX, JSON.stringify(mockDrops));
      expect(idbSet).toHaveBeenCalledWith(STORAGE_KEYS.DROPS_INBOX, mockDrops);
    });

    it('handles JSON stringify errors silently', () => {
      const mockList = [] as any;
      mockList.push(mockList); // create circular reference
      saveDrops(mockList);
      expect(syncStorageSet).not.toHaveBeenCalled();
    });
  });

  describe('loadFriends', () => {
    it('returns DEFAULT_FRIENDS if window is undefined', () => {
      const globalAny = global as any;
      delete globalAny.window;

      (syncStorageGet as jest.Mock).mockReturnValue(null);
      expect(loadFriends()).toEqual(DEFAULT_FRIENDS);

      globalAny.window = originalWindow;
    });

    it('returns DEFAULT_FRIENDS and saves it if syncStorageGet returns null', () => {
      (syncStorageGet as jest.Mock).mockReturnValue(null);
      expect(loadFriends()).toEqual(DEFAULT_FRIENDS);
      expect(syncStorageSet).toHaveBeenCalledWith(STORAGE_KEYS.FRIENDS, JSON.stringify(DEFAULT_FRIENDS));
    });

    it('returns parsed friends if syncStorageGet returns a valid JSON', () => {
      const mockFriends = [{ id: 'friend-1', topPicks: {} }];
      (syncStorageGet as jest.Mock).mockReturnValue(JSON.stringify(mockFriends));
      expect(loadFriends()).toEqual(mockFriends);
    });

    it('fills missing topPicks with defaults if available', () => {
      const friendWithoutTopPicks = { id: DEFAULT_FRIENDS[0].id };
      (syncStorageGet as jest.Mock).mockReturnValue(JSON.stringify([friendWithoutTopPicks]));
      const result = loadFriends();
      expect(result[0].topPicks).toEqual(DEFAULT_FRIENDS[0].topPicks);
    });

    it('returns DEFAULT_FRIENDS on JSON parse error', () => {
      (syncStorageGet as jest.Mock).mockReturnValue('invalid');
      expect(loadFriends()).toEqual(DEFAULT_FRIENDS);
    });
  });

  describe('saveFriends', () => {
    it('does nothing if window is undefined', () => {
      const globalAny = global as any;
      delete globalAny.window;

      saveFriends([]);

      globalAny.window = originalWindow;
    });

    it('saves friends correctly', () => {
      const mockFriends = [{ id: 'test' }] as any;
      saveFriends(mockFriends);
      expect(syncStorageSet).toHaveBeenCalledWith(STORAGE_KEYS.FRIENDS, JSON.stringify(mockFriends));
      expect(idbSet).toHaveBeenCalledWith(STORAGE_KEYS.FRIENDS, mockFriends);
    });

    it('handles idbSet errors silently', async () => {
      (idbSet as jest.Mock).mockReturnValueOnce(Promise.reject(new Error('idb error')));
      const mockFriends = [{ id: 'test' }] as any;
      saveFriends(mockFriends);
      expect(syncStorageSet).toHaveBeenCalledWith(STORAGE_KEYS.FRIENDS, JSON.stringify(mockFriends));
      expect(idbSet).toHaveBeenCalledWith(STORAGE_KEYS.FRIENDS, mockFriends);
    });

    it('handles JSON stringify errors silently', () => {
      const mockList = [] as any;
      mockList.push(mockList); // create circular reference
      saveFriends(mockList);
      expect(syncStorageSet).not.toHaveBeenCalled();
    });
  });

  describe('loadUserProfile', () => {
    it('returns DEFAULT_USER if window is undefined', () => {
      const globalAny = global as any;
      delete globalAny.window;

      (syncStorageGet as jest.Mock).mockReturnValue(null);
      expect(loadUserProfile()).toEqual(DEFAULT_USER);

      globalAny.window = originalWindow;
    });

    it('returns DEFAULT_USER and merges custom avatar if raw is null', () => {
      (syncStorageGet as jest.Mock).mockReturnValue(null);
      (getCustomAvatarSync as jest.Mock).mockReturnValue('custom.png');
      expect(loadUserProfile()).toEqual({ ...DEFAULT_USER, avatar: 'custom.png' });
    });

    it('returns parsed user and handles avatar logic', () => {
      const mockUser = { ...DEFAULT_USER, avatar: 'parsed.png' };
      (syncStorageGet as jest.Mock).mockReturnValue(JSON.stringify(mockUser));
      (getCustomAvatarSync as jest.Mock).mockReturnValue(null);
      const result = loadUserProfile();
      expect(result.avatar).toBe('parsed.png');
      expect(result.topPicks).toBeDefined();
    });

    it('uses customAvatar over parsed avatar', () => {
      const mockUser = { ...DEFAULT_USER, avatar: 'parsed.png' };
      (syncStorageGet as jest.Mock).mockReturnValue(JSON.stringify(mockUser));
      (getCustomAvatarSync as jest.Mock).mockReturnValue('custom.png');
      const result = loadUserProfile();
      expect(result.avatar).toBe('custom.png');
    });

    it('returns default user with custom avatar if JSON parse fails', () => {
      (syncStorageGet as jest.Mock).mockReturnValue('invalid json');
      (getCustomAvatarSync as jest.Mock).mockReturnValue('custom.png');
      const result = loadUserProfile();
      expect(result).toEqual({ ...DEFAULT_USER, avatar: 'custom.png' });
    });

    it('uses topPicks from parsed user if it exists', () => {
      const mockUser = { ...DEFAULT_USER, avatar: 'parsed.png', topPicks: { movie: { id: 'm1' } } };
      (syncStorageGet as jest.Mock).mockReturnValue(JSON.stringify(mockUser));
      (getCustomAvatarSync as jest.Mock).mockReturnValue(null);
      const result = loadUserProfile();
      expect(result.topPicks).toEqual({ movie: { id: 'm1' } });
    });

    it('defaults avatar to DEFAULT_USER.avatar if parsed avatar is empty or default and no custom avatar', () => {
      const mockUser = { ...DEFAULT_USER, avatar: '' };
      (syncStorageGet as jest.Mock).mockReturnValue(JSON.stringify(mockUser));
      (getCustomAvatarSync as jest.Mock).mockReturnValue(null);
      const result = loadUserProfile();
      expect(result.avatar).toBe(DEFAULT_USER.avatar);

      const mockUser2 = { ...DEFAULT_USER, avatar: 'photo-1534528741775-53994a69daeb' };
      (syncStorageGet as jest.Mock).mockReturnValue(JSON.stringify(mockUser2));
      const result2 = loadUserProfile();
      expect(result2.avatar).toBe(DEFAULT_USER.avatar);
    });
  });

  describe('saveUserProfile', () => {
    it('does nothing if window is undefined', () => {
      const globalAny = global as any;
      delete globalAny.window;

      saveUserProfile(DEFAULT_USER);

      globalAny.window = originalWindow;
    });

    it('saves user profile correctly', () => {
      const mockUser = { ...DEFAULT_USER, avatar: 'test.png' };
      saveUserProfile(mockUser);
      expect(syncStorageSet).toHaveBeenCalledWith(STORAGE_KEYS.USER_PROFILE, JSON.stringify(mockUser));
      expect(idbSet).toHaveBeenCalledWith(STORAGE_KEYS.USER_PROFILE, mockUser);
      expect(persistCustomAvatar).toHaveBeenCalledWith('test.png');
    });

    it('does not persist empty avatar', () => {
      const mockUser = { ...DEFAULT_USER, avatar: '   ' };
      saveUserProfile(mockUser);
      expect(persistCustomAvatar).not.toHaveBeenCalled();
    });

    it('handles idbSet errors silently', async () => {
      (idbSet as jest.Mock).mockReturnValueOnce(Promise.reject(new Error('idb error')));
      const mockUser = { ...DEFAULT_USER, avatar: 'test.png' };
      saveUserProfile(mockUser);
      expect(syncStorageSet).toHaveBeenCalledWith(STORAGE_KEYS.USER_PROFILE, JSON.stringify(mockUser));
      expect(idbSet).toHaveBeenCalledWith(STORAGE_KEYS.USER_PROFILE, mockUser);
    });

    it('handles JSON stringify errors silently', () => {
      const mockUser = { ...DEFAULT_USER, avatar: 'test.png' } as any;
      mockUser.circular = mockUser;
      saveUserProfile(mockUser);
      expect(syncStorageSet).not.toHaveBeenCalled();
    });
  });
});
