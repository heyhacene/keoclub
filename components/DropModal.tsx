'use client';

import React, { useState } from 'react';
import { X, Send, Sparkles, Check, Flame, MessageSquare } from 'lucide-react';
import { MediaItem, Friend } from '@/types/culture';
import { UserAvatar } from './UserAvatar';

interface DropModalProps {
  media: MediaItem | null;
  friends: Friend[];
  isOpen: boolean;
  onClose: () => void;
  onSendDrop: (media: MediaItem, friendId: string, note: string) => void;
  onOpenSearchMedia?: () => void;
}

export const DropModal: React.FC<DropModalProps> = ({
  media,
  friends,
  isOpen,
  onClose,
  onSendDrop,
  onOpenSearchMedia,
}) => {
  const [selectedFriendId, setSelectedFriendId] = useState<string>(friends[0]?.id || '');
  const [note, setNote] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const quickNotes = [
    'Tu m’en diras des nouvelles ! ✨',
    'À voir / écouter d’urgence ! 🔥',
    'Ça m’a directement fait penser à toi 🤝',
    'Mets un bon casque pour savourer ça 🎧',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!media || !selectedFriendId) return;

    onSendDrop(media, selectedFriendId, note.trim() || 'Une pépite culturelle recommandée pour toi !');
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      setNote('');
      onClose();
    }, 1200);
  };

  const selectedFriend = friends.find((f) => f.id === selectedFriendId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-club-900 border border-club-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-club-800 bg-club-950/60">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-drop-pink/20 text-drop-pink border border-drop-pink/30">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Faire un Drop</h3>
              <p className="text-[11px] text-slate-400">Recommander une pépite à un ami</p>
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

        {/* Success Splash */}
        {isSuccess ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-drop-pink to-amber-400 flex items-center justify-center text-white shadow-xl animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h4 className="text-lg font-black text-white">Drop envoyé avec succès !</h4>
            <p className="text-xs text-slate-400">
              {selectedFriend?.name} recevra votre recommandation dans sa boîte de Drops.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {/* Selected Media Preview */}
            {media ? (
              <div className="flex items-center space-x-3 p-3 bg-club-950 rounded-2xl border border-club-800">
                <img
                  src={media.posterUrl}
                  alt={media.title}
                  className="w-12 h-16 rounded-xl object-cover shadow-md shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-drop-pink uppercase">
                    {media.type} {media.year ? `• ${media.year}` : ''}
                  </span>
                  <h4 className="text-sm font-extrabold text-white truncate">{media.title}</h4>
                  <p className="text-xs text-slate-400 truncate">{media.creator}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-club-950 rounded-2xl border border-club-800 text-center">
                <p className="text-xs text-slate-400 mb-2">Aucune œuvre sélectionnée</p>
                {onOpenSearchMedia && (
                  <button
                    type="button"
                    onClick={onOpenSearchMedia}
                    className="py-2 px-4 rounded-xl bg-keo-600 text-white text-xs font-bold"
                  >
                    Choisir une œuvre
                  </button>
                )}
              </div>
            )}

            {/* Friend Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                À qui voulez-vous l&#39;envoyer ?
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {friends.map((f) => {
                  const isSelected = f.id === selectedFriendId;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFriendId(f.id)}
                      className={`p-2.5 rounded-2xl border text-left flex items-center space-x-2.5 transition ${
                        isSelected
                          ? 'bg-drop-pink/20 border-drop-pink text-white shadow-md'
                          : 'bg-club-950/60 border-club-800 text-slate-300 hover:border-club-700'
                      }`}
                    >
                      <UserAvatar
                        src={f.avatar}
                        name={f.name}
                        className={`w-7 h-7 rounded-full object-cover shrink-0 ${isSelected ? 'ring-2 ring-drop-pink' : ''}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{f.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{f.handle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Note */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Votre petit mot d&#39;accompagnement
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex : « Écoute la piste 3 à fond » ou « Regarde la fin, le twist est fou ! »"
                rows={2}
                className="w-full bg-club-950 border border-club-800 rounded-2xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-drop-pink resize-none"
              />

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickNotes.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setNote(q)}
                    className="text-[10px] py-1 px-2.5 rounded-lg bg-club-800/80 hover:bg-club-700 text-slate-300 hover:text-white transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Submit */}
            <button
              type="submit"
              disabled={!media || !selectedFriendId}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-keo-600 via-drop-pink to-amber-500 hover:opacity-95 text-white rounded-2xl text-xs sm:text-sm font-extrabold transition shadow-xl shadow-drop-pink/20 flex items-center justify-center space-x-2 active:scale-98 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Envoyer le Drop à {selectedFriend?.name || 'mon ami'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
