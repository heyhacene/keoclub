'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  UserPlus,
  LogIn,
  Lock,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  KeyRound,
  Upload,
  Camera,
} from 'lucide-react';
import { UserProfile } from '@/types/culture';
import { registerWithPseudo, loginWithPseudo } from '@/lib/supabase';
import { AVATAR_PRESETS, processImageFileToAvatar } from '@/lib/imageUtils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [pin, setPin] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingAvatar(true);
    setErrorMsg(null);
    try {
      const processedUrl = await processImageFileToAvatar(file, 256, 0.85);
      setSelectedAvatar(processedUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur lors du traitement de votre photo.');
    } finally {
      setIsProcessingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (tab === 'register') {
        if (!name.trim()) {
          throw new Error('Veuillez entrer votre prénom ou nom.');
        }
        if (!handle.trim()) {
          throw new Error('Veuillez choisir un pseudo (ex: @hacene).');
        }
        if (!pin.trim() || pin.trim().length < 4) {
          throw new Error('Le code PIN secret doit contenir au moins 4 chiffres.');
        }

        const res = await registerWithPseudo({
          name: name.trim(),
          handle: handle.trim(),
          pin: pin.trim(),
          avatar: selectedAvatar,
          bio: bio.trim(),
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          onLoginSuccess(res.user);
          onClose();
        }
      } else {
        // Connexion
        if (!handle.trim()) {
          throw new Error('Veuillez entrer votre pseudo.');
        }
        if (!pin.trim()) {
          throw new Error('Veuillez entrer votre code PIN secret.');
        }

        const res = await loginWithPseudo({
          handle: handle.trim(),
          pin: pin.trim(),
        });

        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          onLoginSuccess(res.user);
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-club-900 border border-club-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-club-800 bg-club-950/70">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-keo-600 to-drop-pink flex items-center justify-center text-white shadow-md">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Espace Membre KeoClub</h3>
              <p className="text-[11px] text-slate-400">Rejoignez votre cercle de partage culturel</p>
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

        {/* Tab switch */}
        <div className="flex border-b border-club-800 bg-club-950/40">
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center space-x-1.5 border-b-2 ${
              tab === 'register'
                ? 'border-drop-pink text-drop-pink bg-drop-pink/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Créer mon profil</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition flex items-center justify-center space-x-1.5 border-b-2 ${
              tab === 'login'
                ? 'border-keo-500 text-keo-400 bg-keo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Me connecter</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-center space-x-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tab === 'register' ? (
            <>
              {/* Avatar Selector with File Upload */}
              <div className="p-3.5 bg-club-950 rounded-2xl border border-club-800 space-y-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Votre Photo / Avatar
                </label>

                <div className="flex items-center gap-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group cursor-pointer w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-drop-pink shadow-md shrink-0 bg-club-900"
                    title="Cliquer pour importer une photo"
                  >
                    <img
                      src={selectedAvatar}
                      alt="Avatar"
                      className="w-full h-full object-cover transition group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition flex items-center justify-center text-white">
                      {isProcessingAvatar ? (
                        <Loader2 className="w-4 h-4 animate-spin text-drop-pink" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingAvatar}
                      className="w-full py-2 px-2.5 bg-club-850 hover:bg-club-800 text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center space-x-1.5 border border-club-700 active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5 text-drop-pink" />
                      <span>Charger ma propre photo</span>
                    </button>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Depuis votre galerie ou vos dossiers.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-club-850">
                  <p className="text-[10px] text-slate-400 font-semibold mb-2">
                    Ou choisissez un avatar prédéfini :
                  </p>
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                    {AVATAR_PRESETS.map((av, idx) => {
                      const isSelected = selectedAvatar === av;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedAvatar(av)}
                          className={`relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border-2 transition active:scale-95 ${
                            isSelected
                              ? 'border-drop-pink ring-2 ring-drop-pink/30 scale-105'
                              : 'border-club-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={av} alt="Avatar" className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-drop-pink/30 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Votre Prénom ou Nom
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Hacène"
                  className="w-full bg-club-950 border border-club-800 focus:border-drop-pink rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Handle */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Votre Pseudo unique (pour recevoir des Drops)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 font-bold text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={handle.replace(/^@/, '')}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="hacene"
                    className="w-full bg-club-950 border border-club-800 focus:border-drop-pink rounded-xl p-3 pl-8 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* PIN Code */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Code PIN secret (4 à 6 chiffres)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••"
                    className="w-full bg-club-950 border border-club-800 focus:border-drop-pink rounded-xl p-3 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none tracking-widest font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Retenez bien ce code : il vous servira à vous reconnecter sur n'importe quel appareil.
                </p>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Vos goûts culturels en quelques mots
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ex : Fan de Nolan, d'électro et de thrillers"
                  className="w-full bg-club-950 border border-club-800 focus:border-drop-pink rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Submit Register */}
              <button
                type="submit"
                disabled={isLoading || isProcessingAvatar}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-keo-600 via-drop-pink to-amber-500 hover:opacity-95 text-white rounded-2xl text-xs sm:text-sm font-extrabold transition shadow-lg shadow-drop-pink/20 flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Rejoindre KeoClub</span>
              </button>
            </>
          ) : (
            <>
              {/* Login mode */}
              <div className="p-3 bg-club-950 rounded-2xl border border-club-800 text-xs text-slate-400 leading-relaxed">
                Entrez le pseudo et le code PIN que vous avez choisis lors de votre inscription pour retrouver toutes vos listes et vos amis.
              </div>

              {/* Handle */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Votre Pseudo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 font-bold text-xs">@</span>
                  <input
                    type="text"
                    required
                    value={handle.replace(/^@/, '')}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="hacene"
                    className="w-full bg-club-950 border border-club-800 focus:border-keo-500 rounded-xl p-3 pl-8 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* PIN Code */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Votre Code PIN secret
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••"
                    className="w-full bg-club-950 border border-club-800 focus:border-keo-500 rounded-xl p-3 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none tracking-widest font-mono"
                  />
                </div>
              </div>

              {/* Submit Login */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-keo-600 hover:bg-keo-500 text-white rounded-2xl text-xs sm:text-sm font-extrabold transition shadow-lg shadow-keo-600/30 flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                <span>Se connecter</span>
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
