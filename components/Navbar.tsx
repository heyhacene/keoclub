'use client';

import React from 'react';
import { Sparkles, Search, Bell, Settings, Flame } from 'lucide-react';
import { UserProfile } from '@/types/culture';

interface NavbarProps {
  user: UserProfile;
  pendingDropsCount: number;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onNavigateToDrops: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  pendingDropsCount,
  onOpenSearch,
  onOpenSettings,
  onNavigateToDrops,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-club-950/80 backdrop-blur-xl border-b border-club-800/80 px-4 py-3 sm:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-keo-600 via-drop-pink to-amber-400 p-[1.5px] shadow-lg shadow-keo-600/30 flex items-center justify-center">
            <div className="w-full h-full bg-club-950 rounded-[14px] flex items-center justify-center">
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-tr from-white via-drop-pink to-amber-300 text-base tracking-tighter">
                K
              </span>
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-drop-cyan animate-pulse" />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">
                Keo<span className="text-transparent bg-clip-text bg-gradient-to-r from-drop-pink to-keo-400">Club</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-keo-500/15 text-keo-300 border border-keo-500/25">
                Drops
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Partage culturel & recommandations entre amis
            </p>
          </div>
        </div>

        {/* Quick Search Bar */}
        <div className="flex-1 max-w-xs hidden md:block">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full py-2 px-3.5 bg-club-900 hover:bg-club-850 border border-club-800 rounded-xl text-left text-xs text-slate-400 flex items-center justify-between transition group"
          >
            <span className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-keo-400 transition" />
              <span>Films, séries, sons, livres...</span>
            </span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-club-800 text-slate-400 border border-club-700">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Actions (Search Mobile, Drops Bell, Settings) */}
        <div className="flex items-center space-x-2">
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="md:hidden p-2 text-slate-300 hover:text-white bg-club-900 border border-club-800 rounded-xl transition active:scale-95"
            title="Rechercher"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Drops Notification Bell */}
          <button
            type="button"
            onClick={onNavigateToDrops}
            className="relative p-2 text-slate-300 hover:text-white bg-club-900 border border-club-800 rounded-xl transition active:scale-95"
            title="Mes Drops reçus"
          >
            <Flame className={`w-4 h-4 ${pendingDropsCount > 0 ? 'text-drop-pink animate-bounce' : 'text-slate-400'}`} />
            {pendingDropsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-drop-pink to-amber-500 text-white font-extrabold text-[10px] flex items-center justify-center ring-2 ring-club-950 shadow-md">
                {pendingDropsCount}
              </span>
            )}
          </button>

          {/* Profile / Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 py-1 px-2.5 bg-club-900 hover:bg-club-850 border border-club-800 rounded-xl transition active:scale-95 text-xs"
            title="Mon Profil & Paramètres"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-drop-pink"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=Hacene';
              }}
            />
            <span className="font-bold text-white font-mono hidden sm:inline max-w-[80px] truncate">
              {user.handle}
            </span>
          </button>

          {/* Settings Gear */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white bg-club-900 border border-club-800 rounded-xl transition active:scale-95"
            title="Paramètres de l'application"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
