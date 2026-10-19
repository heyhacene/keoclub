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
 * Composant Avatar universel & résistant aux pannes pour KeoClub.
 * - Utilise une clé dynamique (key={src}) pour forcer le remontage immédiat à chaque changement
 * - Supprime l'entête Referer (referrerPolicy="no-referrer") évitant tout blocage hotlink/CDN
 * - En cas d'erreur de chargement ou d'absence d'image, affiche un badge stylé avec initiale
 * - Aucun piratage direct du DOM (e.target.src), 100% synchronisé avec l'état React.
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

  if (!src || hasError) {
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
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      onClick={onClick}
      title={title || cleanName}
      className={`${className} shrink-0`}
    />
  );
};
