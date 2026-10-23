/**
 * Multi-layer persistent storage engine for KeoClub.
 * Combines:
 * 1. AndroidNativeStorage (@JavascriptInterface backed by synchronous SharedPreferences.Editor.commit())
 *    -> 100% synchronous on Android WebView, survives force-stop, swipe-away, cache clear, and origin changes.
 * 2. Synchronous LocalStorage (for web browsers and instant UI render)
 * 3. SQLite-backed IndexedDB (as additional async backup)
 */

import { UserProfile } from '@/types/culture';
import { Preferences } from '@capacitor/preferences';

const DB_NAME = 'keoclub_vault_v1';
const STORE_NAME = 'keyval';

export const STORAGE_KEYS = {
  PERSONAL_LIST: 'keoclub_personal_list_v1',
  DROPS_INBOX: 'keoclub_drops_inbox_v1',
  FRIENDS: 'keoclub_friends_v1',
  USER_PROFILE: 'keoclub_profile_v1',
  CUSTOM_AVATAR: 'keoclub_custom_avatar_v1',
  LEGACY_AVATAR: 'keoclub_user_avatar_v1',
  TMDB_KEY: 'keoclub_tmdb_api_key',
};

// ============================================================================
// 0. SYNCHRONOUS ANDROID NATIVE BRIDGE + LOCALSTORAGE (Instant & Indestructible)
// ============================================================================

interface AndroidNativeStorageBridge {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => boolean;
  removeItem: (key: string) => boolean;
}

function getAndroidBridge(): AndroidNativeStorageBridge | null {
  if (typeof window === 'undefined') return null;
  const bridge = (window as any).AndroidNativeStorage;
  if (bridge && typeof bridge.getItem === 'function' && typeof bridge.setItem === 'function') {
    return bridge as AndroidNativeStorageBridge;
  }
  return null;
}

/**
 * Lit une clé de manière 100% SYNCHRONE :
 * Priorité 1 : Coffre-fort natif Android (SharedPreferences sur disque OS)
 * Priorité 2 : LocalStorage WebView
 */
export function syncStorageGet(key: string): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Lecture directe depuis les SharedPreferences natives Android (synchrone)
  try {
    const bridge = getAndroidBridge();
    if (bridge) {
      const nativeVal = bridge.getItem(key);
      if (nativeVal !== null && nativeVal !== undefined && nativeVal !== '') {
        // Re-synchroniser silencieusement LocalStorage si besoin
        try {
          localStorage.setItem(key, nativeVal);
        } catch {}
        return nativeVal;
      }
    }
  } catch {}

  // 2. Fallback LocalStorage
  try {
    const localVal = localStorage.getItem(key);
    if (localVal !== null && localVal !== undefined && localVal !== '') {
      // Si présent en LocalStorage mais pas encore dans le pont natif, on le copie
      try {
        const bridge = getAndroidBridge();
        if (bridge) {
          bridge.setItem(key, localVal);
        }
      } catch {}
      return localVal;
    }
  } catch {}

  return null;
}

/**
 * Écrit une clé de manière 100% SYNCHRONE :
 * 1. Écrit et commit() immédiatement sur la mémoire flash Android (SharedPreferences XML)
 * 2. Écrit dans LocalStorage
 * 3. Sauvegarde en tâche de fond dans IndexedDB
 */
export function syncStorageSet(key: string, value: string): void {
  if (typeof window === 'undefined') return;

  // 1. Écriture synchrone avec commit() immédiat sur disque Android
  try {
    const bridge = getAndroidBridge();
    if (bridge) {
      bridge.setItem(key, value);
    }
  } catch (e) {
    console.warn('AndroidNativeStorage setItem error:', e);
  }

  // 2. Écriture synchrone LocalStorage
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage setItem error:', e);
  }

  // 3. Écriture en tâche de fond dans Capacitor Preferences & IndexedDB
  try {
    nativePrefSet(key, value).catch(() => {});
  } catch {}
}

// ============================================================================
// 1. INDEXEDDB ENGINE (Backed by SQLite on Android)
// ============================================================================

let cachedDbPromise: Promise<IDBDatabase> | null = null;

function getIDB(): Promise<IDBDatabase> {
  if (cachedDbPromise) return cachedDbPromise;

  cachedDbPromise = new Promise((resolve, reject) => {
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
    req.onerror = (e) => {
      cachedDbPromise = null;
      reject(req.error || e);
    };
  });

  return cachedDbPromise;
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
// 2. CAPACITOR NATIVE PREFERENCES BRIDGE (Optional Fallback)
// ============================================================================

export async function nativePrefGet(key: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await Preferences.get({ key });
    if (res && res.value !== null && res.value !== undefined && res.value !== '') {
      return res.value;
    }
  } catch {}
  return null;
}

export async function nativePrefSet(key: string, value: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await Preferences.set({ key, value });
  } catch {}
}

// ============================================================================
// 3. UNIFIED AVATAR & PROFILE PERSISTENCE (Multi-Layer)
// ============================================================================

/**
 * Récupère l'avatar personnalisé de manière 100% SYNCHRONE
 * depuis AndroidNativeStorage ou LocalStorage.
 */
export function getCustomAvatarSync(): string | null {
  if (typeof window === 'undefined') return null;
  const val =
    syncStorageGet(STORAGE_KEYS.CUSTOM_AVATAR) ||
    syncStorageGet(STORAGE_KEYS.LEGACY_AVATAR);
  return val && val.trim() ? val.trim() : null;
}

/**
 * Enregistre l'avatar personnalisé dans TOUS les niveaux de stockage :
 * 1. AndroidNativeStorage (SharedPreferences.Editor.commit() synchrone sur disque)
 * 2. LocalStorage (clé principale + clé legacy)
 * 3. Profil utilisateur en stockage natif + LocalStorage
 * 4. IndexedDB + Capacitor Preferences
 */
export async function persistCustomAvatar(avatarUrl: string): Promise<void> {
  if (typeof window === 'undefined' || !avatarUrl || !avatarUrl.trim()) return;
  const cleanUrl = avatarUrl.trim();

  // 1. Écriture synchrone immédiate (Android SharedPreferences + LocalStorage)
  syncStorageSet(STORAGE_KEYS.CUSTOM_AVATAR, cleanUrl);
  syncStorageSet(STORAGE_KEYS.LEGACY_AVATAR, cleanUrl);

  // 2. Mettre à jour immédiatement l'avatar dans le profil sauvegardé
  try {
    const profileRaw = syncStorageGet(STORAGE_KEYS.USER_PROFILE);
    if (profileRaw) {
      const p: UserProfile = JSON.parse(profileRaw);
      p.avatar = cleanUrl;
      const str = JSON.stringify(p);
      syncStorageSet(STORAGE_KEYS.USER_PROFILE, str);
      idbSet(STORAGE_KEYS.USER_PROFILE, p).catch(() => {});
      nativePrefSet(STORAGE_KEYS.USER_PROFILE, str).catch(() => {});
    }
  } catch {}

  // 3. IndexedDB persistant (SQLite)
  idbSet(STORAGE_KEYS.CUSTOM_AVATAR, cleanUrl).catch(() => {});
  idbSet(STORAGE_KEYS.LEGACY_AVATAR, cleanUrl).catch(() => {});

  // 4. Capacitor Native Preferences (SharedPreferences Android)
  nativePrefSet(STORAGE_KEYS.CUSTOM_AVATAR, cleanUrl).catch(() => {});
  nativePrefSet(STORAGE_KEYS.LEGACY_AVATAR, cleanUrl).catch(() => {});
}

/**
 * Restaure l'avatar personnalisé depuis n'importe quelle source disponible (Synchrone puis Asynchrone).
 */
export async function restoreCustomAvatar(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  // 1. Vérifier le pont natif Android & LocalStorage (synchrone)
  const syncVal = getCustomAvatarSync();
  if (syncVal) {
    // S'assurer que les deux clés sont bien synchronisées partout
    syncStorageSet(STORAGE_KEYS.CUSTOM_AVATAR, syncVal);
    syncStorageSet(STORAGE_KEYS.LEGACY_AVATAR, syncVal);
    nativePrefSet(STORAGE_KEYS.CUSTOM_AVATAR, syncVal).catch(() => {});
    return syncVal;
  }

  // 2. Vérifier Capacitor Preferences (SharedPreferences natif Android)
  try {
    const native =
      (await nativePrefGet(STORAGE_KEYS.CUSTOM_AVATAR)) ||
      (await nativePrefGet(STORAGE_KEYS.LEGACY_AVATAR));
    if (native && native.trim()) {
      const clean = native.trim();
      syncStorageSet(STORAGE_KEYS.CUSTOM_AVATAR, clean);
      syncStorageSet(STORAGE_KEYS.LEGACY_AVATAR, clean);
      idbSet(STORAGE_KEYS.CUSTOM_AVATAR, clean).catch(() => {});
      return clean;
    }
  } catch {}

  // 3. Vérifier IndexedDB (SQLite)
  try {
    const idbVal =
      (await idbGet<string>(STORAGE_KEYS.CUSTOM_AVATAR)) ||
      (await idbGet<string>(STORAGE_KEYS.LEGACY_AVATAR));
    if (idbVal && idbVal.trim()) {
      const clean = idbVal.trim();
      syncStorageSet(STORAGE_KEYS.CUSTOM_AVATAR, clean);
      syncStorageSet(STORAGE_KEYS.LEGACY_AVATAR, clean);
      nativePrefSet(STORAGE_KEYS.CUSTOM_AVATAR, clean).catch(() => {});
      return clean;
    }
  } catch {}

  return null;
}

/**
 * Restauration asynchrone complète au démarrage de l'app.
 * Récupère le profil et l'avatar personnalisé depuis SharedPreferences / SQLite / LocalStorage.
 */
export async function restorePersistentState(): Promise<{
  customAvatar: string | null;
  userProfile: UserProfile | null;
}> {
  let customAvatar = await restoreCustomAvatar();

  let userProfile: UserProfile | null = null;

  // 1. Essayer depuis le pont natif Android / LocalStorage
  try {
    const rawSync = syncStorageGet(STORAGE_KEYS.USER_PROFILE);
    if (rawSync) {
      userProfile = JSON.parse(rawSync);
    }
  } catch {}

  // 2. Essayer depuis Capacitor Preferences (natif Android)
  if (!userProfile) {
    try {
      const nativeRaw = await nativePrefGet(STORAGE_KEYS.USER_PROFILE);
      if (nativeRaw) {
        userProfile = JSON.parse(nativeRaw);
        syncStorageSet(STORAGE_KEYS.USER_PROFILE, nativeRaw);
      }
    } catch {}
  }

  // 3. Essayer depuis IndexedDB
  if (!userProfile) {
    try {
      const idbProfile = await idbGet<UserProfile>(STORAGE_KEYS.USER_PROFILE);
      if (idbProfile) {
        userProfile = idbProfile;
        syncStorageSet(STORAGE_KEYS.USER_PROFILE, JSON.stringify(idbProfile));
      }
    } catch {}
  }

  // Si userProfile contient un avatar et qu'on n'a pas encore customAvatar
  if (!customAvatar && userProfile?.avatar && userProfile.avatar.trim()) {
    customAvatar = userProfile.avatar.trim();
    persistCustomAvatar(customAvatar).catch(() => {});
  }

  // Si on a un avatar personnalisé restauré, il est prioritaire à 100%
  if (customAvatar && userProfile) {
    userProfile.avatar = customAvatar;
  }

  return { customAvatar, userProfile };
}
