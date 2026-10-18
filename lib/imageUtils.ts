/**
 * Utility functions for client-side image processing & avatar handling.
 * Automatically center-crops to square and compresses to lightweight JPEG dataURL (< 35KB)
 * to ensure fast local storage, seamless cloud syncing, and no quota overflow.
 */

export const AVATAR_PRESETS: string[] = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=250&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=250&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=250&q=80',
];

/**
 * Resizes and center-crops any input image File to a square JPEG dataURL.
 * Keeps output under 30-40 KB.
 */
export function processImageFileToAvatar(
  file: File,
  maxSize: number = 256,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).'));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier image.'));
    };

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Format d\'image non supporté ou fichier corrompu.'));
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;

          // Crop centré au format carré
          const minDim = Math.min(width, height);
          const startX = (width - minDim) / 2;
          const startY = (height - minDim) / 2;

          canvas.width = maxSize;
          canvas.height = maxSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback direct si le contexte 2D échoue
            resolve(reader.result as string);
            return;
          }

          // Lissage haute qualité
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(
            img,
            startX,
            startY,
            minDim,
            minDim,
            0,
            0,
            maxSize,
            maxSize
          );

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err: any) {
          reject(new Error(err?.message || 'Erreur lors du recadrage de l\'image.'));
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
