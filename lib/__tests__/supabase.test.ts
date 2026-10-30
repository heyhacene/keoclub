import {
  registerWithPseudo,
  loginWithPseudo,
  updateUserInCloud,
  searchFriendsInCloud,
  pushDropToCloud,
  pullDropsFromCloud,
} from '../supabase';

// We need to mock supabase client exported from the same module
// But it's easier to mock the whole `@supabase/supabase-js` module or to use a jest.mock on the client itself.

jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => ({
      from: jest.fn(),
    })),
  };
});

import { supabase } from '../supabase';
import { DropItem } from '@/types/culture';

describe('Supabase utils', () => {
  const mockFrom = supabase.from as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerWithPseudo', () => {
    it('returns error if handle is too short', async () => {
      const res = await registerWithPseudo({
        name: 'John',
        handle: 'a',
        pin: '1234',
      });
      expect(res.error).toBe('Le pseudo doit comporter au moins 2 caractères.');
    });

    it('returns error if pin is too short', async () => {
      const res = await registerWithPseudo({
        name: 'John',
        handle: 'john',
        pin: '123',
      });
      expect(res.error).toBe('Le code PIN doit comporter au moins 4 chiffres.');
    });

    it('returns error if user already exists', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: { id: '1' } });
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const res = await registerWithPseudo({
        name: 'John',
        handle: 'john',
        pin: '1234',
      });

      expect(mockFrom).toHaveBeenCalledWith('keoclub_users');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq).toHaveBeenCalledWith('handle', '@john');
      expect(res.error).toBe('Le pseudo @john est déjà pris. Veuillez en choisir un autre.');
    });

    it('successfully registers a user', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null });
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      mockFrom.mockImplementation((table) => {
        if (table === 'keoclub_users') {
          return {
            select: mockSelect,
            insert: mockInsert,
          };
        }
      });

      const res = await registerWithPseudo({
        name: 'John',
        handle: 'john',
        pin: '1234',
        bio: 'Hello world'
      });

      expect(mockFrom).toHaveBeenCalledWith('keoclub_users');
      expect(mockInsert).toHaveBeenCalled();
      expect(res.user).toBeDefined();
      expect(res.user?.handle).toBe('@john');
      expect(res.user?.name).toBe('John');
      expect(res.user?.bio).toBe('Hello world');
      expect(res.error).toBeUndefined();
    });
  });

  describe('loginWithPseudo', () => {
    it('returns error if user not found', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') });
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const res = await loginWithPseudo({
        handle: 'unknown',
        pin: '1234',
      });

      expect(res.error).toBe('Aucun compte trouvé pour @unknown. Vérifiez l’orthographe ou créez un profil.');
    });

    it('returns error if pin is incorrect', async () => {
      const mockSingle = jest.fn().mockResolvedValue({ data: { pin_code: '5678' }, error: null });
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const res = await loginWithPseudo({
        handle: 'john',
        pin: '1234',
      });

      expect(res.error).toBe('Code PIN incorrect pour ce pseudo.');
    });

    it('successfully logs in', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: {
          id: 'user_1',
          name: 'John',
          handle: '@john',
          pin_code: '1234',
          share_code: 'KEO-1234',
          avatar: 'avatar.png',
          bio: 'My bio'
        },
        error: null
      });
      const mockEq = jest.fn(() => ({ single: mockSingle }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const res = await loginWithPseudo({
        handle: 'john',
        pin: '1234',
      });

      expect(res.error).toBeUndefined();
      expect(res.user?.id).toBe('user_1');
      expect(res.user?.handle).toBe('@john');
    });
  });

  describe('updateUserInCloud', () => {
    it('returns false on error', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: new Error('Update failed') });
      const mockUpdate = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ update: mockUpdate });

      const res = await updateUserInCloud({
        id: '1',
        name: 'John',
        handle: '@john',
        avatar: 'avatar.png',
        bio: 'bio',
        shareCode: 'code'
      });

      expect(res).toBe(false);
    });

    it('returns true on success', async () => {
      const mockEq = jest.fn().mockResolvedValue({ error: null });
      const mockUpdate = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ update: mockUpdate });

      const res = await updateUserInCloud({
        id: '1',
        name: 'John',
        handle: '@john',
        avatar: 'avatar.png',
        bio: 'bio',
        shareCode: 'code'
      });

      expect(res).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        name: 'John',
        handle: '@john'
      }));
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });
  });

  describe('searchFriendsInCloud', () => {
    it('returns empty array for empty query', async () => {
      const res = await searchFriendsInCloud(' ');
      expect(res).toEqual([]);
    });

    it('returns empty array on error', async () => {
      const mockLimit = jest.fn().mockResolvedValue({ data: null, error: new Error('Failed') });
      const mockOr = jest.fn(() => ({ limit: mockLimit }));
      const mockSelect = jest.fn(() => ({ or: mockOr }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const res = await searchFriendsInCloud('john');
      expect(res).toEqual([]);
    });

    it('returns formatted friends on success', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        data: [{
          id: '2',
          name: 'Jane',
          handle: '@jane',
          avatar: 'pic.png',
          bio: 'hello'
        }],
        error: null
      });
      const mockOr = jest.fn(() => ({ limit: mockLimit }));
      const mockSelect = jest.fn(() => ({ or: mockOr }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const res = await searchFriendsInCloud('jane');

      expect(res.length).toBe(1);
      expect(res[0].id).toBe('2');
      expect(res[0].name).toBe('Jane');
      expect(res[0].isOnline).toBe(true);
      expect(res[0].favoriteGenres).toEqual(['Culture']);
    });
  });

  describe('pushDropToCloud', () => {
    const mockDrop: DropItem = {
      id: 'drop_1',
      senderId: '1',
      senderName: 'John',
      senderAvatar: 'avatar.png',
      recipientId: '2',
      recipientName: 'Jane',
      note: 'Look at this',
      status: 'pending',
      media: { id: 'media_1', title: 'Book', type: 'book', imageUrl: 'url', description: 'desc' },
      createdAt: 1000000000,
      itemType: 'book'
    };

    it('returns false on error', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: new Error('Insert failed') });
      mockFrom.mockReturnValue({ insert: mockInsert });

      const res = await pushDropToCloud(mockDrop);
      expect(res).toBe(false);
    });

    it('returns true on success', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ insert: mockInsert });

      const res = await pushDropToCloud(mockDrop);
      expect(res).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith([expect.objectContaining({
        id: 'drop_1',
        sender_id: '1'
      })]);
    });
  });

  describe('pullDropsFromCloud', () => {
    it('returns empty array if recipientId is empty', async () => {
      const res = await pullDropsFromCloud('');
      expect(res).toEqual([]);
    });

    it('returns empty array on error', async () => {
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') });
      const mockEq = jest.fn(() => ({ order: mockOrder }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const res = await pullDropsFromCloud('2');
      expect(res).toEqual([]);
    });

    it('returns formatted drops on success', async () => {
      const mockOrder = jest.fn().mockResolvedValue({
        data: [{
          id: 'drop_1',
          sender_id: '1',
          sender_name: 'John',
          sender_avatar: 'avatar.png',
          recipient_id: '2',
          recipient_name: 'Jane',
          note: 'Look at this',
          status: 'pending',
          media_payload: { id: 'media_1', title: 'Book', type: 'book', imageUrl: 'url', description: 'desc' },
          created_at: '2025-01-01T00:00:00.000Z'
        }],
        error: null
      });
      const mockEq = jest.fn(() => ({ order: mockOrder }));
      const mockSelect = jest.fn(() => ({ eq: mockEq }));
      mockFrom.mockReturnValue({ select: mockSelect });

      const res = await pullDropsFromCloud('2');
      expect(res.length).toBe(1);
      expect(res[0].id).toBe('drop_1');
      expect(res[0].senderName).toBe('John');
      expect(res[0].media).toBeDefined();
    });
  });
});
