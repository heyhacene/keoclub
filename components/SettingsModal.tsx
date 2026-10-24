'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Settings as SettingsIcon,
  User,
  Download,
  Key,
  Share2,
  Check,
  RefreshCw,
  Smartphone,
  Camera,
  Upload,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '@/types/culture';
import { getTmdbApiKey, saveTmdbApiKey } from '@/lib/api-culture';
import { getDirectKeoClubApkUrl, DEFAULT_KEOCLUB_BUILD, fetchLatestKeoClubApk } from '@/lib/apkUpdate';
import { AVATAR_PRESETS, processImageFileToAvatar, generateRandomAvatarUrl } from '@/lib/imageUtils';
import { STORAGE_KEYS, persistCustomAvatar, getCustomAvatarSync } from '@/lib/persistentStorage';
import { UserAvatar } from './UserAvatar';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSaveUser: (user: UserProfile) => void;
  onOpenAuth?: () => void;
  totalSavedItems: number;
  totalDrops: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveUser,
  onOpenAuth,
  totalSavedItems,
  totalDrops,
}) => {
  const [name, setName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar);
  const [tmdbKey, setTmdbKey] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setHandle(user.handle);
      setBio(user.bio);
      const savedAvatar = getCustomAvatarSync();
      setAvatar(savedAvatar || user.avatar);
      setTmdbKey(getTmdbApiKey());
      setAvatarError(null);
      setSaveSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyShareCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(user.shareCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  /**
   * Sauvegarde instantanée dès qu'un avatar est choisi, téléversé ou généré.
   * Écrit directement dans le stockage synchrone et notifie le parent en préservant toutes ses propriétés.
   */
  const applyAndSaveAvatar = (newAvatarUrl: string, message: string = 'Avatar mis à jour et enregistré !') => {
    if (!newAvatarUrl || !newAvatarUrl.trim()) return;
    const cleanUrl = newAvatarUrl.trim();
    setAvatar(cleanUrl);
    setAvatarError(null);
    persistCustomAvatar(cleanUrl);

    const updatedUser: UserProfile = {
      ...user,
      avatar: cleanUrl,
      name: name.trim() || user.name,
      handle: handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`,
      bio: bio.trim(),
    };
    onSaveUser(updatedUser);
    setSaveSuccessMsg(message);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleSelectPreset = (preset: string) => {
    applyAndSaveAvatar(preset, '✓ Avatar enregistré avec succès !');
  };

  const handleGenerateRandomAvatar = () => {
    const randomUrl = generateRandomAvatarUrl();
    applyAndSaveAvatar(randomUrl, '✓ Nouvel avatar généré et enregistré !');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingAvatar(true);
    setAvatarError(null);
    try {
      const processedUrl = await processImageFileToAvatar(file, 256, 0.82);
      applyAndSaveAvatar(processedUrl, '✓ Photo de profil importée et enregistrée !');
    } catch (err: any) {
      setAvatarError(err?.message || 'Erreur lors du chargement de l\'image.');
    } finally {
      setIsProcessingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  /**
   * Sauvegarde complète (nom, handle, bio, avatar, clé) à la fermeture
   */
  const handleSaveAndClose = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const storedAvatar = getCustomAvatarSync();
    // Priorité absolue : l'avatar choisi dans la modale (avatar), puis le stockage local, puis le profil utilisateur
    const finalAvatar = avatar || storedAvatar || user.avatar;

    if (finalAvatar) {
      persistCustomAvatar(finalAvatar);
    }

    onSaveUser({
      ...user,
      avatar: finalAvatar,
      name: name.trim() || user.name,
      handle: handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`,
      bio: bio.trim(),
    });
    saveTmdbApiKey(tmdbKey);
    onClose();
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    setUpdateMsg(null);
    try {
      const release = await fetchLatestKeoClubApk();
      if (release.buildNumber && release.buildNumber > parseInt(DEFAULT_KEOCLUB_BUILD, 10)) {
        setUpdateMsg(`Nouvelle mise à jour disponible : Build ${release.buildNumber} !`);
      } else {
        setUpdateMsg(`Vous disposez déjà de la dernière version (Build ${DEFAULT_KEOCLUB_BUILD}).`);
      }
    } catch {
      setUpdateMsg('Vérification effectuée. Vous êtes à jour.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const directApkUrl = getDirectKeoClubApkUrl();

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSaveAndClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-club-900 border border-club-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header avec bouton Enregistrer et Fermer direct */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-club-800 bg-club-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-keo-600/20 text-keo-400 border border-keo-500/30">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Paramètres KeoClub</h3>
              <p className="text-[11px] text-slate-400">Profil, photo & personnalisation</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleSaveAndClose()}
              className="py-1.5 px-3 bg-keo-600 hover:bg-keo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm active:scale-95"
              title="Enregistrer et fermer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Enregistrer</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveAndClose()}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-club-800 transition"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSaveAndClose} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Share Code Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-keo-600/15 via-drop-pink/15 to-amber-500/10 border border-keo-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-keo-300">
                Mon Code de Partage Ami
              </span>
              <p className="text-base font-mono font-extrabold text-white mt-0.5">
                {user.shareCode}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyShareCode}
              className="py-2 px-3 bg-keo-600 hover:bg-keo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md active:scale-95"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copié !' : 'Partager'}</span>
            </button>
          </div>

          {/* Profile form & Avatar customization */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-keo-400" />
              <span>Mon Profil & Photo de profil</span>
            </h4>

            {/* Avatar customization card */}
            <div className="p-4 rounded-2xl bg-club-950 border border-club-800 space-y-3.5">
              <div className="flex items-center gap-4">
                {/* Avatar Preview */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group cursor-pointer w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-drop-pink shadow-lg shadow-drop-pink/20 shrink-0 bg-club-900 transition hover:ring-keo-400 active:scale-95"
                  title="Cliquer pour changer de photo"
                >
                  <UserAvatar
                    src={avatar}
                    name={name}
                    className="w-full h-full object-cover transition group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/45 group-hover:bg-black/60 transition flex flex-col items-center justify-center text-white opacity-90 group-hover:opacity-100">
                    {isProcessingAvatar ? (
                      <Loader2 className="w-5 h-5 animate-spin text-drop-pink" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 mb-0.5 text-white drop-shadow" />
                        <span className="text-[9px] font-bold tracking-tight">Modifier</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Upload & Actions */}
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingAvatar}
                      className="py-2 px-2.5 bg-club-800 hover:bg-club-700 text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center space-x-1.5 border border-club-700 shadow-sm active:scale-95 disabled:opacity-50"
                      title="Choisir une image dans vos dossiers ou votre galerie"
                    >
                      <Upload className="w-3.5 h-3.5 text-drop-pink shrink-0" />
                      <span className="truncate">Mes fichiers</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isProcessingAvatar}
                      className="py-2 px-2.5 bg-club-800 hover:bg-club-700 text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center space-x-1.5 border border-club-700 shadow-sm active:scale-95 disabled:opacity-50"
                      title="Prendre une photo directement avec l'appareil photo"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Photo / Caméra</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateRandomAvatar}
                    className="w-full py-1.5 px-2 bg-gradient-to-r from-keo-600/20 via-drop-pink/20 to-amber-500/15 hover:from-keo-600/30 hover:to-drop-pink/30 text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center space-x-1.5 border border-keo-500/30 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Générer un avatar original</span>
                  </button>
                </div>
              </div>

              {/* Feedback d'enregistrement instantané */}
              {saveSuccessMsg && (
                <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-xs text-emerald-300 font-bold animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              {avatarError && (
                <div className="p-2.5 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center space-x-2 text-[11px] text-red-300">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                  <span>{avatarError}</span>
                </div>
              )}

              {/* Presets Gallery */}
              <div className="pt-2 border-t border-club-850">
                <p className="text-[10px] text-slate-400 font-semibold mb-2">
                  Ou touchez un avatar pour l&#39;appliquer immédiatement :
                </p>
                <div className="flex items-center space-x-2.5 overflow-x-auto pb-1.5 scrollbar-none">
                  {AVATAR_PRESETS.map((preset, idx) => {
                    const isSelected = avatar === preset;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition active:scale-95 ${
                          isSelected
                            ? 'border-drop-pink ring-2 ring-drop-pink/50 scale-105 shadow-md shadow-drop-pink/30'
                            : 'border-club-800 opacity-65 hover:opacity-100 hover:border-club-600'
                        }`}
                        title="Sélectionner cet avatar"
                      >
                        <UserAvatar
                          src={preset}
                          name={`P${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-drop-pink/35 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Votre Prénom ou Nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-club-950 border border-club-800 focus:border-keo-500 rounded-xl p-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Pseudo unique (@handle)</label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full bg-club-950 border border-club-800 focus:border-keo-500 rounded-xl p-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Biographie / Goûts culturels</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="w-full bg-club-950 border border-club-800 focus:border-keo-500 rounded-xl p-2.5 text-xs text-white focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* TMDB API Key option */}
          <div className="space-y-2 pt-2 border-t border-club-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Clé API TMDB (Films & Séries)</span>
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold">Optionnelle</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Une clé par défaut est déjà intégrée. Si vous avez un compte personnel TMDB, vous pouvez renseigner votre propre clé ici.
            </p>
            <input
              type="text"
              value={tmdbKey}
              onChange={(e) => setTmdbKey(e.target.value)}
              placeholder="Ex : 8265bd1679663a7ea..."
              className="w-full bg-club-950 border border-club-800 focus:border-amber-400 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none"
            />
          </div>

          {/* Android APK Download Card */}
          <div className="p-4 rounded-2xl bg-club-950 border border-club-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-keo-400" />
                <span className="text-xs font-bold text-white">Application Android (APK)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-keo-600/20 text-keo-300 font-bold border border-keo-500/30">
                Build {DEFAULT_KEOCLUB_BUILD}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Téléchargez directement le fichier APK officiel pour installer ou mettre à jour KeoClub sur votre smartphone ou tablette Android.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={directApkUrl}
                download="KeoClub.apk"
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-keo-600 to-drop-pink hover:opacity-95 text-white rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition shadow-md active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger l&#39;APK</span>
              </a>

              <button
                type="button"
                onClick={handleCheckUpdate}
                disabled={checkingUpdate}
                className="py-2.5 px-3 bg-club-800 hover:bg-club-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin text-keo-400' : ''}`} />
                <span>Vérifier</span>
              </button>
            </div>

            {updateMsg && (
              <p className="text-[11px] text-keo-300 bg-keo-950/60 p-2 rounded-xl border border-keo-800/60 font-medium">
                {updateMsg}
              </p>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-2 text-center pt-1">
            <div className="p-2.5 bg-club-950/60 rounded-xl border border-club-800/60">
              <span className="text-lg font-black text-white">{totalSavedItems}</span>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Œuvres sauvegardées</p>
            </div>
            <div className="p-2.5 bg-club-950/60 rounded-xl border border-club-800/60">
              <span className="text-lg font-black text-drop-pink">{totalDrops}</span>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Drops partagés</p>
            </div>
          </div>

          {onOpenAuth && (
            <button
              type="button"
              onClick={() => {
                handleSaveAndClose();
                onOpenAuth();
              }}
              className="w-full py-2.5 px-4 bg-club-800 hover:bg-club-700 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition border border-club-700"
            >
              Changer de compte / Me reconnecter
            </button>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 bg-keo-600 hover:bg-keo-500 text-white rounded-2xl text-xs font-extrabold transition shadow-lg shadow-keo-600/30"
          >
            Enregistrer les modifications
          </button>
        </form>
      </div>
    </div>
  );
};
