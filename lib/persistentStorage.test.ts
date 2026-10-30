import { getCustomAvatarSync, STORAGE_KEYS } from './persistentStorage';

describe('getCustomAvatarSync', () => {

  beforeEach(() => {
    // Re-assign window since we delete it in one test
    if (typeof window === 'undefined') {
      global.window = {} as Window & typeof globalThis;
    }
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          store[key] = value;
        }),
        removeItem: jest.fn((key: string) => {
          delete store[key];
        }),
        clear: jest.fn(() => {
          store = {};
        })
      };
    })();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      configurable: true,
    });
  });

  afterEach(() => {
    // Reset window object
    if (typeof window !== 'undefined') {
      delete (window as any).AndroidNativeStorage;
      window.localStorage.clear();
    }
  });

  it('should return null if window is undefined', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    const result = getCustomAvatarSync();
    expect(result).toBeNull();

    global.window = originalWindow;
  });

  it('should return CUSTOM_AVATAR if it exists and is valid', () => {
    window.localStorage.setItem(STORAGE_KEYS.CUSTOM_AVATAR, '  https://example.com/avatar.png  ');

    const result = getCustomAvatarSync();
    expect(result).toBe('https://example.com/avatar.png');
  });

  it('should return LEGACY_AVATAR if CUSTOM_AVATAR does not exist', () => {
    window.localStorage.setItem(STORAGE_KEYS.LEGACY_AVATAR, 'https://example.com/legacy-avatar.png');

    const result = getCustomAvatarSync();
    expect(result).toBe('https://example.com/legacy-avatar.png');
  });

  it('should return null if avatar is just whitespace', () => {
    window.localStorage.setItem(STORAGE_KEYS.CUSTOM_AVATAR, '   ');

    const result = getCustomAvatarSync();
    expect(result).toBeNull();
  });

  it('should return null if avatar is the default photo', () => {
    window.localStorage.setItem(STORAGE_KEYS.CUSTOM_AVATAR, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb');

    const result = getCustomAvatarSync();
    expect(result).toBeNull();
  });

  it('should return null if neither CUSTOM_AVATAR nor LEGACY_AVATAR exists', () => {
    const result = getCustomAvatarSync();
    expect(result).toBeNull();
  });
});
