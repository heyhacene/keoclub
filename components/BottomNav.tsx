'use client';

import React from 'react';
import { Flame, Bookmark, Users, Sparkles, Plus } from 'lucide-react';

export type MainTab = 'drops' | 'list' | 'circle';

interface BottomNavProps {
  currentTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
  onOpenDropAction: () => void;
  pendingDropsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  onOpenDropAction,
  pendingDropsCount,
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 pointer-events-none pb-safe">
      <div className="max-w-md mx-auto px-4 pb-3 pt-1">
        <div className="pointer-events-auto bg-club-900/90 backdrop-blur-xl border border-club-700/80 rounded-3xl shadow-2xl shadow-black/80 px-4 py-2 flex items-center justify-between">
          {/* Tab 1 : Drops Inbox */}
          <button
            type="button"
            onClick={() => onChangeTab('drops')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition relative ${
              currentTab === 'drops'
                ? 'text-drop-pink font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Flame className={`w-5 h-5 ${currentTab === 'drops' ? 'stroke-[2.5]' : ''}`} />
              {pendingDropsCount > 0 && (
                <span className="absolute -top-1 -right-2.5 w-4 h-4 rounded-full bg-gradient-to-r from-drop-pink to-amber-500 text-white font-black text-[9px] flex items-center justify-center ring-2 ring-club-900">
                  {pendingDropsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Drops</span>
          </button>

          {/* Tab 2 : Ma Liste */}
          <button
            type="button"
            onClick={() => onChangeTab('list')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition ${
              currentTab === 'list'
                ? 'text-keo-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${currentTab === 'list' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-1 tracking-tight">Ma Liste</span>
          </button>

          {/* Central Floating Button : "DROPPER" */}
          <div className="-translate-y-5">
            <button
              type="button"
              onClick={onOpenDropAction}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-keo-600 via-drop-pink to-amber-400 text-white flex items-center justify-center shadow-xl shadow-drop-pink/30 hover:scale-105 active:scale-95 transition ring-4 ring-club-950 group"
              title="Dropper une recommandation à un ami"
            >
              <Sparkles className="w-6 h-6 text-amber-200 group-hover:rotate-12 transition-transform" />
            </button>
            <span className="block text-center text-[9px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-drop-pink to-amber-300 mt-1">
              DROPPER
            </span>
          </div>

          {/* Tab 3 : Mon Cercle (Amis) */}
          <button
            type="button"
            onClick={() => onChangeTab('circle')}
            className={`flex flex-col items-center py-1 px-3 rounded-2xl transition ${
              currentTab === 'circle'
                ? 'text-drop-cyan font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className={`w-5 h-5 ${currentTab === 'circle' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-1 tracking-tight">Mon Cercle</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
