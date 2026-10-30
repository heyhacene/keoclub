import { registerWithPseudo } from '../supabase';

jest.mock('@supabase/supabase-js', () => {
  const mSupabaseClient = {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
  };
  return {
    createClient: jest.fn(() => mSupabaseClient),
  };
});

describe('Supabase Client - registerWithPseudo', () => {
  describe('validation', () => {
    it('should return error if handle is less than 2 characters after trimming and stripping @', async () => {
      const result = await registerWithPseudo({
        name: 'John Doe',
        handle: ' @a ',
        pin: '1234',
      });

      expect(result).toEqual({
        error: 'Le pseudo doit comporter au moins 2 caractères.',
      });
    });

    it('should return error if handle is empty after trimming and stripping @', async () => {
      const result = await registerWithPseudo({
        name: 'John Doe',
        handle: '   ',
        pin: '1234',
      });

      expect(result).toEqual({
        error: 'Le pseudo doit comporter au moins 2 caractères.',
      });
    });

    it('should return error if pin is less than 4 digits after trimming', async () => {
      const result = await registerWithPseudo({
        name: 'John Doe',
        handle: 'johndoe',
        pin: ' 123 ',
      });

      expect(result).toEqual({
        error: 'Le code PIN doit comporter au moins 4 chiffres.',
      });
    });

    it('should return error if pin is empty after trimming', async () => {
      const result = await registerWithPseudo({
        name: 'John Doe',
        handle: 'johndoe',
        pin: '   ',
      });

      expect(result).toEqual({
        error: 'Le code PIN doit comporter au moins 4 chiffres.',
      });
    });
  });
});
