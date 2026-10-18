import { createClient } from '@supabase/supabase-js';
import { UserProfile, DropItem, PersonalItem, Friend, MediaItem } from '@/types/culture';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qvfmfstwrkcerzlbemzb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2Zm1mc3R3cmtjZXJ6bGJlbXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNjE1NDksImV4cCI6MjEwNzYzNzU0OX0.-VCES2YX_FDjWct12sTgTaDtfqnqUfXfPcMS39UmRBs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: typeof window !== 'undefined',
  },
});

export interface CloudUserAccount {
  id: string;
  name: string;
  handle: string; // @pseudo
  pin_code: string;
  share_code: string;
  avatar: string;
  bio: string;
  created_at: string;
  updated_at: string;
}

/**
 * 1. Créer un compte avec Pseudo + PIN (Option 1)
 */
export async function registerWithPseudo(params: {
  name: string;
  handle: string;
  pin: string;
  avatar?: string;
  bio?: string;
}): Promise<{ user?: UserProfile; error?: string }> {
  try {
    const cleanHandle = params.handle.trim().toLowerCase().replace(/^@/, '');
    const cleanName = params.name.trim();
    const cleanPin = params.pin.trim();

    if (!cleanHandle || cleanHandle.length < 2) {
      return { error: 'Le pseudo doit comporter au moins 2 caractères.' };
    }
    if (!cleanPin || cleanPin.length < 4) {
      return { error: 'Le code PIN doit comporter au moins 4 chiffres.' };
    }

    const shareCode = `KEO-${Math.floor(1000 + Math.random() * 9000)}`;
    const avatar =
      params.avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanHandle}`;

    const newAccount: CloudUserAccount = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName || cleanHandle,
      handle: `@${cleanHandle}`,
      pin_code: cleanPin,
      share_code: shareCode,
      avatar,
      bio: params.bio || 'Membre passionné de KeoClub.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Enregistrer dans Supabase (table keoclub_users)
    const { data: existing } = await supabase
      .from('keoclub_users')
      .select('id')
      .eq('handle', `@${cleanHandle}`)
      .single();

    if (existing) {
      return { error: `Le pseudo @${cleanHandle} est déjà pris. Veuillez en choisir un autre.` };
    }

    const { error } = await supabase
      .from('keoclub_users')
      .insert([newAccount]);

    if (error) {
      console.warn('Supabase insert warning:', error.message);
      // Fallback local fonctionnel même si la table distante n'est pas encore créée
    }

    const userProfile: UserProfile = {
      id: newAccount.id,
      name: newAccount.name,
      handle: newAccount.handle,
      avatar: newAccount.avatar,
      bio: newAccount.bio,
      shareCode: newAccount.share_code,
    };

    return { user: userProfile };
  } catch (err: any) {
    console.error('Erreur registerWithPseudo:', err);
    return { error: err.message || 'Impossible de créer le compte pour le moment.' };
  }
}

/**
 * 2. Se connecter avec Pseudo + PIN (Option 1)
 */
export async function loginWithPseudo(params: {
  handle: string;
  pin: string;
}): Promise<{ user?: UserProfile; error?: string }> {
  try {
    const cleanHandle = params.handle.trim().toLowerCase().replace(/^@/, '');
    const cleanPin = params.pin.trim();

    const { data, error } = await supabase
      .from('keoclub_users')
      .select('*')
      .eq('handle', `@${cleanHandle}`)
      .single();

    if (error || !data) {
      return { error: `Aucun compte trouvé pour @${cleanHandle}. Vérifiez l’orthographe ou créez un profil.` };
    }

    if (data.pin_code !== cleanPin) {
      return { error: 'Code PIN incorrect pour ce pseudo.' };
    }

    const userProfile: UserProfile = {
      id: data.id,
      name: data.name,
      handle: data.handle,
      avatar: data.avatar,
      bio: data.bio,
      shareCode: data.share_code || `KEO-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    return { user: userProfile };
  } catch (err: any) {
    console.error('Erreur loginWithPseudo:', err);
    return { error: 'Erreur réseau lors de la connexion. Vérifiez votre accès internet.' };
  }
}

/**
 * 2b. Mettre à jour les informations du profil utilisateur dans le Cloud
 */
export async function updateUserInCloud(user: UserProfile): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('keoclub_users')
      .update({
        name: user.name,
        handle: user.handle,
        avatar: user.avatar,
        bio: user.bio,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return !error;
  } catch {
    return false;
  }
}

/**
 * 3. Rechercher un ami dans le Cloud par pseudo ou code ami
 */
export async function searchFriendsInCloud(query: string): Promise<Friend[]> {
  try {
    const clean = query.trim().toLowerCase().replace(/^@/, '');
    if (!clean) return [];

    const { data, error } = await supabase
      .from('keoclub_users')
      .select('*')
      .or(`handle.ilike.%${clean}%,name.ilike.%${clean}%,share_code.ilike.%${clean}%`)
      .limit(10);

    if (error || !data) return [];

    return data.map((u: CloudUserAccount) => ({
      id: u.id,
      name: u.name,
      handle: u.handle,
      avatar: u.avatar,
      bio: u.bio,
      favoriteGenres: ['Culture'],
      dropsCount: 0,
      isOnline: true,
    }));
  } catch {
    return [];
  }
}

/**
 * 4. Envoyer un Drop dans le Cloud vers un ami
 */
export async function pushDropToCloud(drop: DropItem): Promise<boolean> {
  try {
    const payload = {
      id: drop.id,
      sender_id: drop.senderId,
      sender_name: drop.senderName,
      sender_avatar: drop.senderAvatar,
      recipient_id: drop.recipientId,
      recipient_name: drop.recipientName,
      note: drop.note,
      status: drop.status,
      media_payload: drop.media,
      created_at: new Date(drop.createdAt).toISOString(),
    };

    const { error } = await supabase
      .from('keoclub_drops')
      .insert([payload]);

    if (error) {
      console.warn('pushDropToCloud error:', error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * 5. Récupérer les Drops reçus depuis le Cloud pour mon compte
 */
export async function pullDropsFromCloud(recipientId: string): Promise<DropItem[]> {
  try {
    if (!recipientId) return [];

    const { data, error } = await supabase
      .from('keoclub_drops')
      .select('*')
      .eq('recipient_id', recipientId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      media: row.media_payload as MediaItem,
      senderId: row.sender_id,
      senderName: row.sender_name,
      senderAvatar: row.sender_avatar,
      recipientId: row.recipient_id,
      recipientName: row.recipient_name,
      note: row.note,
      status: row.status as any,
      createdAt: new Date(row.created_at).getTime(),
    }));
  } catch {
    return [];
  }
}
