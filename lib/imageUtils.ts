/**
 * Utility functions for client-side image processing & avatar handling.
 * Automatically center-crops to square and compresses to lightweight JPEG dataURL (< 30KB)
 * to ensure fast local storage, seamless cloud syncing, and zero quota overflow.
 */

export const AVATAR_PRESETS: string[] = [
  // Photographies soignées (hommes, femmes, styles variés)
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=250&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=250&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=250&q=80',
  // Avatars illustrés & pop culture (indestructibles et légers)
  'https://api.dicebear.com/7.x/bottts/svg?seed=KeoClub1',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=CultureHacene',
  'https://api.dicebear.com/7.x/micah/svg?seed=VinylLover',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=CinemaBuff',
];

/**
 * Génère un URL d'avatar unique et stylé basé sur une graine aléatoire
 */
export function generateRandomAvatarUrl(): string {
  const styles = ['adventurer', 'bottts', 'micah', 'fun-emoji'];
  const style = styles[Math.floor(Math.random() * styles.length)];
  const seed = `keo_${Math.random().toString(36).substring(2, 9)}`;
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

/**
 * Resizes and center-crops any input image File to a square JPEG dataURL.
 * Supports Android Gallery, Camera, File Manager, HEIC/JPEG/PNG.
 * Keeps output compact (< 30 KB).
 */
export function processImageFileToAvatar(
  file: File,
  maxSize: number = 256,
  quality: number = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Vérification souple du type MIME ou de l'extension de fichier (crucial sur Android)
    const isMimeImage = file.type && file.type.toLowerCase().startsWith('image/');
    const isExtensionImage = /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif|svg)$/i.test(file.name || '');

    if (!isMimeImage && !isExtensionImage && file.type !== '' && file.type !== 'application/octet-stream') {
      reject(new Error('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).'));
      return;
    }

    let blobUrl: string | null = null;
    try {
      if (typeof URL !== 'undefined' && URL.createObjectURL) {
        blobUrl = URL.createObjectURL(file);
      }
    } catch {}

    const img = new Image();

    const cleanup = () => {
      if (blobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch {}
      }
    };

    img.onerror = () => {
      cleanup();
      // En cas d'erreur de chargement direct (ex: blob bloqué), tenter FileReader
      const reader = new FileReader();
      reader.onload = () => {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          try {
            const dataUrl = drawToSquareCanvas(fallbackImg, maxSize, quality);
            resolve(dataUrl);
          } catch {
            resolve(reader.result as string);
          }
        };
        fallbackImg.onerror = () => {
          reject(new Error('Format d\'image non supporté ou fichier illisible.'));
        };
        fallbackImg.src = reader.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Impossible de lire le fichier image sélectionné.'));
      };
      reader.readAsDataURL(file);
    };

    img.onload = () => {
      cleanup();
      try {
        const dataUrl = drawToSquareCanvas(img, maxSize, quality);
        resolve(dataUrl);
      } catch (err: any) {
        reject(new Error(err?.message || 'Erreur lors du recadrage de l\'image.'));
      }
    };

    if (blobUrl) {
      img.src = blobUrl;
    } else {
      // Fallback direct sur FileReader
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Erreur lors de la lecture du fichier image.'));
      };
      reader.readAsDataURL(file);
    }
  });
}

function drawToSquareCanvas(img: HTMLImageElement, maxSize: number, quality: number): string {
  const canvas = document.createElement('canvas');
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  if (!width || !height) {
    throw new Error('Image vide ou dimensions invalides.');
  }

  // Crop centré au format carré
  const minDim = Math.min(width, height);
  const startX = (width - minDim) / 2;
  const startY = (height - minDim) / 2;

  canvas.width = maxSize;
  canvas.height = maxSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Contexte Canvas 2D indisponible.');
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

  return canvas.toDataURL('image/jpeg', quality);
}
