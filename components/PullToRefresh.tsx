'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ArrowDown, Check } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const pullDistanceRef = useRef(0);

  const PULL_THRESHOLD = 70;
  const MAX_PULL = 110;

  useEffect(() => {
    if (disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Uniquement si on est tout en haut de la page
      if (window.scrollY <= 0 && !isRefreshing) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diffY = currentY - startYRef.current;

      if (diffY > 0 && window.scrollY <= 0) {
        // Amortissement physique (résistance élastique)
        const damped = Math.min(MAX_PULL, Math.pow(diffY, 0.8) * 1.5);
        pullDistanceRef.current = damped;
        setPullDistance(damped);

        // Feedback haptique léger au franchissement du seuil
        if (damped >= PULL_THRESHOLD && pullDistanceRef.current < PULL_THRESHOLD) {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate(10);
            } catch {}
          }
        }
      } else {
        isPullingRef.current = false;
        pullDistanceRef.current = 0;
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;

      const currentDist = pullDistanceRef.current;

      if (currentDist >= PULL_THRESHOLD && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(55); // Garder l'indicateur visible pendant l'actualisation

        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate(20);
            } catch {}
          }
          await onRefresh();
          setIsSuccess(true);
          setTimeout(() => {
            setIsSuccess(false);
            setIsRefreshing(false);
            setPullDistance(0);
            pullDistanceRef.current = 0;
          }, 600);
        } catch {
          setIsRefreshing(false);
          setPullDistance(0);
          pullDistanceRef.current = 0;
        }
      } else {
        // Retour élastique à 0
        setPullDistance(0);
        pullDistanceRef.current = 0;
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isRefreshing, onRefresh]);

  const rotationDeg = Math.min(360, (pullDistance / PULL_THRESHOLD) * 360);
  const isReady = pullDistance >= PULL_THRESHOLD;

  return (
    <div className="relative w-full">
      {/* Floating Refresh Indicator */}
      <div
        className="fixed top-16 left-0 right-0 z-30 flex justify-center pointer-events-none transition-transform duration-200"
        style={{
          transform: `translateY(${pullDistance > 0 ? Math.min(pullDistance, 70) : -80}px)`,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <div
          className={`px-4 py-2 rounded-full shadow-2xl backdrop-blur-xl border flex items-center space-x-2 transition-all ${
            isSuccess
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
              : isRefreshing
              ? 'bg-club-900/95 border-drop-pink/50 text-white shadow-drop-pink/20'
              : isReady
              ? 'bg-gradient-to-r from-keo-600 to-drop-pink border-white/20 text-white scale-105'
              : 'bg-club-900/90 border-club-700/80 text-slate-300'
          }`}
        >
          {isSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 animate-in zoom-in" />
              <span className="text-xs font-extrabold tracking-tight">KeoClub actualisé !</span>
            </>
          ) : isRefreshing ? (
            <>
              <RefreshCw className="w-4 h-4 text-drop-pink animate-spin" />
              <span className="text-xs font-extrabold tracking-tight">Actualisation en cours...</span>
            </>
          ) : isReady ? (
            <>
              <ArrowDown className="w-4 h-4 text-white animate-bounce" />
              <span className="text-xs font-black tracking-tight">Relâchez pour actualiser !</span>
            </>
          ) : (
            <>
              <RefreshCw
                className="w-4 h-4 text-keo-400 transition-transform"
                style={{ transform: `rotate(${rotationDeg}deg)` }}
              />
              <span className="text-xs font-medium tracking-tight">Tirez pour rafraîchir...</span>
            </>
          )}
        </div>
      </div>

      {/* Main Content with subtle pull translation */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${Math.min(pullDistance * 0.4, 30)}px)` : undefined,
          transition: isPullingRef.current ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
};
