/**
 * Multi-layer persistent storage engine for KeoClub.
 * Combines:
 * 1. Synchronous LocalStorage (for instant UI render without flash)
 * 2. SQLite-backed IndexedDB (indestructible across Android WebView process kills)
 * 3. Capacitor Native Preferences (Android SharedPreferences)
 */

import { UserProfile, PersonalItem, DropItem, Friend } from '@/types/culture';

const DB_NAME = 'keoclub_vault_v1';
const STORE_NAME = 'keyval';

export const STORAGE_KEYS = {
  PERSONAL_LIST: 'keoclub_personal_list_v1',
  DROPS_INBOX: 'keoclub_drops_inbox_v1',
  FRIENDS: 'keoclub_friends_v1',
  USER_PROFILE: 'keoclub_profile_v1',
  CUSTOM_AVATAR: 'keoclub_custom_avatar_v1',
  TMDB_KEY: 'keoclub_tmdb_api_key',
};

// ============================================================================
// 1. INDEXEDDB ENGINE (Backed by SQLite on Android)
// ============================================================================

function getIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB indisponible'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function idbSet(key: string, value: any): Promise<boolean> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

// ============================================================================
// 2. CAPACITOR NATIVE PREFERENCES BRIDGE (SharedPreferences XML on Android)
// ============================================================================

async function nativePrefGet(key: string): Promise<string | null> {
  try {
    const cap = (window as any)?.Capacitor;
    if (cap && cap.Plugins && cap.Plugins.Preferences) {
      const res = await cap.Plugins.Preferences.get({ key });
      return res?.value || null;
    }
  } catch {}
  return null;
}

async function nativePrefSet(key: string, value: string): Promise<void> {
  try {
    const cap = (window as any)?.Capacitor;
    if (cap && cap.Plugins && cap.Plugins.Preferences) {
      await cap.Plugins.Preferences.set({ key, value });
    }
  } catch {}
}

// ============================================================================
// 3. UNIFIED AVATAR & PROFILE PERSISTENCE (Multi-Layer)
// ============================================================================

/**
 * Enregistre l'avatar personnalisé dans tous les niveaux de stockage :
 * LocalStorage + IndexedDB + Capacitor Preferences.
 */
export async function persistCustomAvatar(avatarUrl: string): Promise<void> {
  if (typeof window === 'undefined' || !avatarUrl || !avatarUrl.trim()) return;
  const cleanUrl = avatarUrl.trim();

  // 1. LocalStorage immédiat
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_AVATAR, cleanUrl);
  } catch (e) {
    console.warn('LocalStorage error on custom avatar:', e);
  }

  // 2. IndexedDB persistant (SQLite)
  idbSet(STORAGE_KEYS.CUSTOM_AVATAR, cleanUrl).catch(() => {});

  // 3. Capacitor Native Preferences
  nativePrefSet(STORAGE_KEYS.CUSTOM_AVATAR, cleanUrl).catch(() => {});
}

/**
 * Restaure l'avatar personnalisé depuis n'importe quelle source disponible.
 * Ne renvoie JAMAIS l'avatar par défaut sauf si aucun avatar personnalisé n'a été défini.
 */
export async function restoreCustomAvatar(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // 1. Vérifier LocalStorage
  try {
    const local = localStorage.getItem(STORAGE_KEYS.CUSTOM_AVATAR);
    if (local && local.trim()) return local.trim();
  } catch {}

  // 2. Vérifier IndexedDB (indestructible)
  try {
    const idb = await idbGet<string>(STORAGE_KEYS.CUSTOM_AVATAR);
    if (idb && idb.trim()) {
      // Re-synchroniser le LocalStorage
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_AVATAR, idb.trim());
      } catch {}
      return idb.trim();
    }
  } catch {}

  // 3. Vérifier Capacitor Preferences
  try {
    const native = await nativePrefGet(STORAGE_KEYS.CUSTOM_AVATAR);
    if (native && native.trim()) {
      try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_AVATAR, native.trim());
      } catch {}
      idbSet(STORAGE_KEYS.CUSTOM_AVATAR, native.trim()).catch(() => {});
      return native.trim();
    }
  } catch {}

  return null;
}

/**
 * Restauration asynchrone complète au démarrage de l'app.
 * Récupère le profil et l'avatar personnalisé depuis SQLite / SharedPreferences.
 */
export async function restorePersistentState(): Promise<{
  customAvatar: string | null;
  userProfile: UserProfile | null;
}> {
  const customAvatar = await restoreCustomAvatar();

  let userProfile: UserProfile | null = null;
  try {
    const idbProfile = await idbGet<UserProfile>(STORAGE_KEYS.USER_PROFILE);
    if (idbProfile) {
      userProfile = idbProfile;
    }
  } catch {}

  if (!userProfile) {
    try {
      const nativeRaw = await nativePrefGet(STORAGE_KEYS.USER_PROFILE);
      if (nativeRaw) {
        userProfile = JSON.parse(nativeRaw);
      }
    } catch {}
  }

  return { customAvatar, userProfile };
}
