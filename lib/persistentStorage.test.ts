import 'fake-indexeddb/auto';
import {
  syncStorageGet,
  syncStorageSet,
  idbGet,
  idbSet,
  nativePrefGet,
  nativePrefSet,
  getCustomAvatarSync,
  persistCustomAvatar,
  restoreCustomAvatar,
  restorePersistentState,
  STORAGE_KEYS
} from './persistentStorage';
import { Preferences } from '@capacitor/preferences';

// --- Mocks ---

// Mock Capacitor Preferences
jest.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

const mockAndroidBridge = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

import structuredClone from "@ungap/structured-clone";
if (typeof global.structuredClone === "undefined") {
  global.structuredClone = structuredClone;
}
// Replace window properties safely for JSDOM
beforeAll(() => {
  Object.defineProperty(window, 'AndroidNativeStorage', {
    value: mockAndroidBridge,
    writable: true,
  });

  // Simple localStorage mock
  const localStorageMock = (function () {
    let store: Record<string, string> = {};
    return {
      getItem(key: string) {
        return store[key] || null;
      },
      setItem(key: string, value: string) {
        store[key] = value.toString();
      },
      clear() {
        store = {};
      },
      removeItem(key: string) {
        delete store[key];
      },
    };
  })();
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();

  // Clear fake-indexeddb
});

describe('persistentStorage', () => {
  describe('Sync Storage (Android Bridge + LocalStorage)', () => {
    it('syncStorageGet should read from AndroidBridge first', () => {
      mockAndroidBridge.getItem.mockReturnValue('bridgeValue');
      window.localStorage.setItem('testKey', 'localValue');

      const result = syncStorageGet('testKey');

      expect(mockAndroidBridge.getItem).toHaveBeenCalledWith('testKey');
      expect(result).toBe('bridgeValue');
    });

    it('syncStorageGet should copy from AndroidBridge to LocalStorage if found', () => {
      mockAndroidBridge.getItem.mockReturnValue('bridgeValue');

      syncStorageGet('testKey');

      expect(window.localStorage.getItem('testKey')).toBe('bridgeValue');
    });

    it('syncStorageGet should fallback to LocalStorage if AndroidBridge is empty', () => {
      mockAndroidBridge.getItem.mockReturnValue(null);
      window.localStorage.setItem('testKey', 'localValue');

      const result = syncStorageGet('testKey');

      expect(result).toBe('localValue');
    });

    it('syncStorageGet should copy from LocalStorage to AndroidBridge if bridge was empty', () => {
      mockAndroidBridge.getItem.mockReturnValue(null);
      window.localStorage.setItem('testKey', 'localValue');

      syncStorageGet('testKey');

      expect(mockAndroidBridge.setItem).toHaveBeenCalledWith('testKey', 'localValue');
    });

    it('syncStorageSet should write to AndroidBridge and LocalStorage', () => {
      syncStorageSet('testKey', 'newValue');

      expect(mockAndroidBridge.setItem).toHaveBeenCalledWith('testKey', 'newValue');
      expect(window.localStorage.getItem('testKey')).toBe('newValue');
      expect(Preferences.set).toHaveBeenCalledWith({ key: 'testKey', value: 'newValue' });
    });
  });

  describe('IndexedDB Engine', () => {
    it('idbSet and idbGet should store and retrieve data', async () => {
      const testData = { name: 'keo', active: true };

      const setSuccess = await idbSet('testObject', testData);
      expect(setSuccess).toBe(true);

      const retrievedData = await idbGet('testObject');
      expect(retrievedData).toEqual(testData);
    });

    it('idbGet should return null for non-existent key', async () => {
      const retrievedData = await idbGet('nonExistentKey');
      expect(retrievedData).toBeNull();
    });
  });

  describe('Capacitor Native Preferences Bridge', () => {
    it('nativePrefSet should call Preferences.set', async () => {
      await nativePrefSet('testPrefKey', 'prefValue');

      expect(Preferences.set).toHaveBeenCalledWith({ key: 'testPrefKey', value: 'prefValue' });
    });

    it('nativePrefGet should call Preferences.get and return value', async () => {
      (Preferences.get as jest.Mock).mockResolvedValueOnce({ value: 'prefValue' });

      const result = await nativePrefGet('testPrefKey');

      expect(Preferences.get).toHaveBeenCalledWith({ key: 'testPrefKey' });
      expect(result).toBe('prefValue');
    });

    it('nativePrefGet should return null if value is empty or not found', async () => {
      (Preferences.get as jest.Mock).mockResolvedValueOnce({ value: null });

      const result = await nativePrefGet('testPrefKey2');

      expect(result).toBeNull();
    });
  });

  describe('Avatar Logic', () => {
    const DEFAULT_AVATAR = 'https://example.com/photo-1534528741775-53994a69daeb.jpg';
    const CUSTOM_AVATAR = 'https://example.com/my-custom-avatar.jpg';

    it('getCustomAvatarSync should return null if no avatar is set', () => {
      expect(getCustomAvatarSync()).toBeNull();
    });

    it('getCustomAvatarSync should ignore default avatar', () => {
      window.localStorage.setItem(STORAGE_KEYS.CUSTOM_AVATAR, DEFAULT_AVATAR);
      expect(getCustomAvatarSync()).toBeNull();
    });

    it('getCustomAvatarSync should return valid custom avatar', () => {
      window.localStorage.setItem(STORAGE_KEYS.CUSTOM_AVATAR, CUSTOM_AVATAR);
      expect(getCustomAvatarSync()).toBe(CUSTOM_AVATAR);
    });

    it('persistCustomAvatar should save custom avatar across all layers', async () => {
      await persistCustomAvatar(CUSTOM_AVATAR);

      expect(mockAndroidBridge.setItem).toHaveBeenCalledWith(STORAGE_KEYS.CUSTOM_AVATAR, CUSTOM_AVATAR);
      expect(window.localStorage.getItem(STORAGE_KEYS.CUSTOM_AVATAR)).toBe(CUSTOM_AVATAR);

      const idbVal = await idbGet(STORAGE_KEYS.CUSTOM_AVATAR);
      expect(idbVal).toBe(CUSTOM_AVATAR);

      expect(Preferences.set).toHaveBeenCalledWith({ key: STORAGE_KEYS.CUSTOM_AVATAR, value: CUSTOM_AVATAR });
    });

    it('restoreCustomAvatar should restore from Native Preferences if Sync storage is empty', async () => {
      (Preferences.get as jest.Mock).mockImplementation(({ key }) => {
        if (key === STORAGE_KEYS.CUSTOM_AVATAR) return Promise.resolve({ value: CUSTOM_AVATAR });
        return Promise.resolve({ value: null });
      });

      const result = await restoreCustomAvatar();

      expect(result).toBe(CUSTOM_AVATAR);
      // It should also back-sync to local storage
      expect(window.localStorage.getItem(STORAGE_KEYS.CUSTOM_AVATAR)).toBe(CUSTOM_AVATAR);
    });
  });

  describe('Global State Restoration', () => {
    const mockProfile = { id: '123', name: 'Test User', avatar: 'old-avatar' };
    const mockProfileStr = JSON.stringify(mockProfile);
    const CUSTOM_AVATAR = 'https://example.com/restored-avatar.jpg';

    it('restorePersistentState should load profile from local storage and update avatar if custom avatar exists', async () => {
      window.localStorage.setItem(STORAGE_KEYS.USER_PROFILE, mockProfileStr);
      window.localStorage.setItem(STORAGE_KEYS.CUSTOM_AVATAR, CUSTOM_AVATAR);

      const state = await restorePersistentState();

      expect(state.customAvatar).toBe(CUSTOM_AVATAR);
      expect(state.userProfile).toBeDefined();
      expect(state.userProfile?.name).toBe('Test User');
      expect(state.userProfile?.avatar).toBe(CUSTOM_AVATAR); // Should be overridden
    });

    it('restorePersistentState should fetch profile from IndexedDB if not in sync storage or Preferences', async () => {
      await idbSet(STORAGE_KEYS.USER_PROFILE, mockProfile);
      (Preferences.get as jest.Mock).mockResolvedValue({ value: null });

      const state = await restorePersistentState();

      expect(state.userProfile).toBeDefined();
      expect(state.userProfile?.name).toBe('Test User');
    });
  });
});
