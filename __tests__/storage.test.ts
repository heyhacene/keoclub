import { loadUserProfile, DEFAULT_USER } from '@/lib/storage';
import * as persistentStorage from '@/lib/persistentStorage';

jest.mock('@/lib/persistentStorage', () => {
  return {
    ...jest.requireActual('@/lib/persistentStorage'),
    syncStorageGet: jest.fn(),
    getCustomAvatarSync: jest.fn(),
  };
});

describe('storage.ts', () => {
  describe('loadUserProfile', () => {
    it('returns DEFAULT_USER when syncStorageGet throws an error (or returns invalid JSON)', () => {
      // Setup
      (persistentStorage.syncStorageGet as jest.Mock).mockReturnValue('invalid json');
      (persistentStorage.getCustomAvatarSync as jest.Mock).mockReturnValue(null);

      // Execute
      const result = loadUserProfile();

      // Assert
      expect(result).toEqual(DEFAULT_USER);
    });

    it('returns DEFAULT_USER with customAvatar when syncStorageGet throws and custom avatar is set', () => {
      // Setup
      (persistentStorage.syncStorageGet as jest.Mock).mockReturnValue('invalid json');
      (persistentStorage.getCustomAvatarSync as jest.Mock).mockReturnValue('custom-avatar-url');

      // Execute
      const result = loadUserProfile();

      // Assert
      expect(result).toEqual({ ...DEFAULT_USER, avatar: 'custom-avatar-url' });
    });
  });
});
