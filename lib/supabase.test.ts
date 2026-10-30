import { loginWithPseudo, supabase } from './supabase';

jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => ({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  };
});

describe('loginWithPseudo', () => {
  it('should return error when no account is found', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
    });

    const result = await loginWithPseudo({ handle: 'testuser', pin: '1234' });
    expect(result).toEqual({ error: 'Aucun compte trouvé pour @testuser. Vérifiez l’orthographe ou créez un profil.' });
  });

  it('should return error when pin code is incorrect', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: '1', handle: '@testuser', pin_code: '4321', name: 'Test', avatar: '', bio: '' },
        error: null
      }),
    });

    const result = await loginWithPseudo({ handle: 'testuser', pin: '1234' });
    expect(result).toEqual({ error: 'Code PIN incorrect pour ce pseudo.' });
  });

  it('should return user profile on successful login', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: '1', handle: '@testuser', pin_code: '1234', name: 'Test', avatar: 'test.jpg', bio: 'Hello', share_code: 'KEO-1234' },
        error: null
      }),
    });

    const result = await loginWithPseudo({ handle: 'testuser', pin: '1234' });
    expect(result.user).toBeDefined();
    expect(result.user?.id).toBe('1');
    expect(result.user?.handle).toBe('@testuser');
    expect(result.error).toBeUndefined();
  });

  it('should return default network error message on exception', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockRejectedValue(new Error('Network error')),
    });

    const result = await loginWithPseudo({ handle: 'testuser', pin: '1234' });
    expect(result).toEqual({ error: 'Erreur réseau lors de la connexion. Vérifiez votre accès internet.' });
  });
});
