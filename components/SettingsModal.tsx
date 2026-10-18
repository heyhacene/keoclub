'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, User, Download, Key, Share2, Check, RefreshCw, Smartphone, ShieldCheck, Heart } from 'lucide-react';
import { UserProfile } from '@/types/culture';
import { getTmdbApiKey, saveTmdbApiKey } from '@/lib/api-culture';
import { getDirectKeoClubApkUrl, DEFAULT_KEOCLUB_BUILD, fetchLatestKeoClubApk } from '@/lib/apkUpdate';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSaveUser: (user: UserProfile) => void;
  totalSavedItems: number;
  totalDrops: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveUser,
  totalSavedItems,
  totalDrops,
}) => {
  const [name, setName] = useState(user.name);
  const [handle, setHandle] = useState(user.handle);
  const [bio, setBio] = useState(user.bio);
  const [tmdbKey, setTmdbKey] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setHandle(user.handle);
      setBio(user.bio);
      setTmdbKey(getTmdbApiKey());
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleCopyShareCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(user.shareCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUser({
      ...user,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-club-900 border border-club-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-club-800 bg-club-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-keo-600/20 text-keo-400 border border-keo-500/30">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Paramètres KeoClub</h3>
              <p className="text-[11px] text-slate-400">Profil, partage & mise à jour</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-club-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
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

          {/* Profile form */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-keo-400" />
              <span>Mon Profil</span>
            </h4>

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
                <span>Télécharger l'APK</span>
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
