import { searchFriendsInCloud } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {},
    from: jest.fn()
  }))
}));

describe('searchFriendsInCloud', () => {
  let mockLimit: jest.Mock;
  let mockOr: jest.Mock;
  let mockSelect: jest.Mock;
  let mockFrom: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });
    mockOr = jest.fn().mockReturnValue({ limit: mockLimit });
    mockSelect = jest.fn().mockReturnValue({ or: mockOr });
    mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

    (supabase.from as jest.Mock).mockImplementation(mockFrom);
  });

  describe('Edge cases (early return)', () => {
    it('should return empty array for empty query', async () => {
      const result = await searchFriendsInCloud('');
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should return empty array for query with only spaces', async () => {
      const result = await searchFriendsInCloud('   ');
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should return empty array for query with only "@"', async () => {
      const result = await searchFriendsInCloud('@');
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should return empty array for query with "@" and spaces', async () => {
      const result = await searchFriendsInCloud('  @  ');
      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('Supabase API calls', () => {
    it('should handle query correctly and strip "@"', async () => {
      await searchFriendsInCloud('@alice');

      expect(supabase.from).toHaveBeenCalledWith('keoclub_users');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockOr).toHaveBeenCalledWith('handle.ilike.%alice%,name.ilike.%alice%,share_code.ilike.%alice%');
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should handle query with spaces around it correctly', async () => {
      await searchFriendsInCloud('  bob  ');

      expect(supabase.from).toHaveBeenCalledWith('keoclub_users');
      expect(mockOr).toHaveBeenCalledWith('handle.ilike.%bob%,name.ilike.%bob%,share_code.ilike.%bob%');
    });

    it('should return empty array when supabase returns error', async () => {
      mockLimit.mockResolvedValueOnce({ data: null, error: new Error('DB Error') });

      const result = await searchFriendsInCloud('charlie');
      expect(result).toEqual([]);
    });

    it('should return empty array when supabase returns no data', async () => {
      mockLimit.mockResolvedValueOnce({ data: null, error: null });

      const result = await searchFriendsInCloud('david');
      expect(result).toEqual([]);
    });

    it('should map returned data to Friend objects correctly', async () => {
      const mockData = [
        {
          id: '1',
          name: 'Eve Smith',
          handle: '@eve',
          avatar: 'eve.jpg',
          bio: 'Eve bio',
        }
      ];
      mockLimit.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await searchFriendsInCloud('eve');
      expect(result).toEqual([
        {
          id: '1',
          name: 'Eve Smith',
          handle: '@eve',
          avatar: 'eve.jpg',
          bio: 'Eve bio',
          favoriteGenres: ['Culture'],
          dropsCount: 0,
          isOnline: true,
        }
      ]);
    });
  });
});
