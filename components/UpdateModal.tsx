'use client';

import React from 'react';
import { Download, Sparkles, X, ArrowUpCircle } from 'lucide-react';
import { LatestApkRelease, DEFAULT_KEOCLUB_BUILD } from '@/lib/apkUpdate';

interface UpdateModalProps {
  release: LatestApkRelease | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ release, isOpen, onClose }) => {
  if (!isOpen || !release) return null;

  const currentBuild = parseInt(DEFAULT_KEOCLUB_BUILD, 10);
  const targetBuild = release.buildNumber || currentBuild;
  const downloadUrl = release.downloadUrl;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm bg-club-900 border border-keo-500/40 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
        {/* Glow décoratif */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-keo-500 via-drop-pink to-amber-400" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-keo-600/30 to-drop-pink/30 text-keo-300 border border-keo-500/30">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                <span>Mise à jour disponible</span>
              </h3>
              <p className="text-[11px] text-slate-400">Nouvelle version KeoClub prête</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-club-800 transition"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-3 space-y-4">
          <div className="p-4 rounded-2xl bg-club-950 border border-club-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Votre version :</span>
              <span className="text-xs font-mono font-bold text-slate-400 bg-club-800/80 px-2 py-0.5 rounded-lg">
                Build {currentBuild}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-keo-300 font-bold">Nouvelle version :</span>
              <span className="text-xs font-mono font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-lg">
                Build {targetBuild} ✨
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Une nouvelle version plus rapide et plus stable de KeoClub est disponible avec les derniers correctifs et améliorations.
          </p>
        </div>

        {/* Actions */}
        <div className="p-5 pt-2 flex flex-col gap-2">
          <a
            href={downloadUrl}
            download={`KeoClub-Build-${targetBuild}.apk`}
            onClick={() => {
              // Fermer automatiquement après un clic
              setTimeout(onClose, 800);
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-keo-600 to-drop-pink hover:opacity-95 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center space-x-2 transition shadow-lg shadow-keo-600/30 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Installer le Build {targetBuild}</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-slate-400 hover:text-slate-200 text-xs font-semibold transition"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
};
