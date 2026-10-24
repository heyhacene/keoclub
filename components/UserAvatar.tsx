'use client';

import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  className?: string;
  onClick?: () => void;
  title?: string;
}

/**
 * Composant Avatar universel & ultra-résilient pour KeoClub.
 * - Réinitialise immédiatement l'état d'erreur lors d'un changement de src
 * - Supprime le Referer HTTP (referrerPolicy="no-referrer") évitant les blocages CDN
 * - Supporte nativement les Data URLs base64, SVG Dicebear et URLs distantes
 * - En cas d'erreur réseau, affiche un fallback stylé avec l'initiale
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt,
  name = 'Keo',
  className = 'w-10 h-10 rounded-2xl object-cover ring-2 ring-drop-pink',
  onClick,
  title,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const cleanName = (name || 'Keo').trim().replace(/^@/, '');
  const initial = (cleanName[0] || 'K').toUpperCase();

  // Si pas de source fournie ou erreur confirmée de chargement d'image
  if (!src || !src.trim() || hasError) {
    return (
      <div
        onClick={onClick}
        title={title || cleanName}
        className={`${className} flex items-center justify-center font-black text-white bg-gradient-to-tr from-keo-600 via-drop-pink to-amber-500 shadow-sm select-none cursor-pointer shrink-0`}
      >
        <span className="text-[13px] tracking-tight">{initial}</span>
      </div>
    );
  }

  return (
    <img
      key={src}
      src={src}
      alt={alt || cleanName}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      onClick={onClick}
      title={title || cleanName}
      className={`${className} shrink-0`}
    />
  );
};

