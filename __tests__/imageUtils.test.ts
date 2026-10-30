import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateRandomAvatarUrl, processImageFileToAvatar } from '../lib/imageUtils';

describe('imageUtils', () => {
  describe('generateRandomAvatarUrl', () => {
    it('should generate a valid dicebear URL', () => {
      const url = generateRandomAvatarUrl();
      expect(url).toMatch(/^https:\/\/api\.dicebear\.com\/7\.x\/(adventurer|bottts|micah|fun-emoji)\/svg\?seed=keo_[a-z0-9]+$/);
    });
  });

  describe('processImageFileToAvatar', () => {
    let originalURL: typeof URL;
    let originalImage: typeof Image;
    let originalFileReader: typeof FileReader;

    beforeEach(() => {
      originalURL = global.URL;
      originalImage = global.Image;
      originalFileReader = global.FileReader;
    });

    afterEach(() => {
      global.URL = originalURL;
      global.Image = originalImage;
      global.FileReader = originalFileReader;
      vi.restoreAllMocks();
    });

    it('should reject if file is not an image (mime)', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      await expect(processImageFileToAvatar(file)).rejects.toThrow('Veuillez sélectionner un fichier image valide');
    });

    it('should accept if file has image extension but no mime type', async () => {
        // Just checking it passes the first check and attempts processing.
        // It will fail later since we are mocking/not fully mocking FileReader/Image yet.
        const file = new File(['test'], 'test.jpg', { type: '' });

        // Mock URL.createObjectURL
        global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
        global.URL.revokeObjectURL = vi.fn();

        class MockImage {
          onload: any;
          onerror: any;
          src: string = '';
          naturalWidth = 500;
          naturalHeight = 500;

          constructor() {
            setTimeout(() => {
              if (this.onload) this.onload();
            }, 0);
          }
        }
        global.Image = MockImage as any;

        // Mock Canvas
        const mockContext = {
          drawImage: vi.fn(),
          imageSmoothingEnabled: false,
          imageSmoothingQuality: '',
        };
        const mockCanvas = {
          getContext: vi.fn().mockReturnValue(mockContext),
          toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,testdata'),
          width: 0,
          height: 0,
        };
        const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

        const result = await processImageFileToAvatar(file);
        expect(result).toBe('data:image/jpeg;base64,testdata');
        expect(mockContext.drawImage).toHaveBeenCalled();
        createElementSpy.mockRestore();
    });

    it('should handle FileReader fallback on Image load error', async () => {
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
        global.URL.revokeObjectURL = vi.fn();

        let firstImageInstantiated = false;

        class MockImage {
          onload: any;
          onerror: any;
          src: string = '';
          naturalWidth = 500;
          naturalHeight = 500;

          constructor() {
            if (!firstImageInstantiated) {
               firstImageInstantiated = true;
               setTimeout(() => {
                 if (this.onerror) this.onerror();
               }, 0);
            } else {
               setTimeout(() => {
                 if (this.onload) this.onload();
               }, 0);
            }
          }
        }
        global.Image = MockImage as any;

        class MockFileReader {
          onload: any;
          onerror: any;
          result = 'data:image/jpeg;base64,filereaderdata';
          readAsDataURL = vi.fn(() => {
            setTimeout(() => {
               if (this.onload) this.onload();
            }, 0);
          });
        }
        global.FileReader = MockFileReader as any;

        const mockContext = {
          drawImage: vi.fn(),
          imageSmoothingEnabled: false,
          imageSmoothingQuality: '',
        };
        const mockCanvas = {
          getContext: vi.fn().mockReturnValue(mockContext),
          toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,fallbackdata'),
          width: 0,
          height: 0,
        };
        const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

        const result = await processImageFileToAvatar(file);
        expect(result).toBe('data:image/jpeg;base64,fallbackdata');
        createElementSpy.mockRestore();
    });

    it('should correctly calculate crop dimensions', async () => {
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

        global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
        global.URL.revokeObjectURL = vi.fn();

        class MockImage {
          onload: any;
          src: string = '';
          naturalWidth = 800;
          naturalHeight = 600; // Landscape image

          constructor() {
            setTimeout(() => {
              if (this.onload) this.onload();
            }, 0);
          }
        }
        global.Image = MockImage as any;

        const mockContext = {
          drawImage: vi.fn(),
          imageSmoothingEnabled: false,
          imageSmoothingQuality: '',
        };
        const mockCanvas = {
          getContext: vi.fn().mockReturnValue(mockContext),
          toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,test'),
          width: 0,
          height: 0,
        };
        const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

        await processImageFileToAvatar(file, 256, 0.8);

        // minDim = 600
        // startX = (800 - 600) / 2 = 100
        // startY = (600 - 600) / 2 = 0
        expect(mockContext.drawImage).toHaveBeenCalledWith(
          expect.any(Object), // img
          100, // startX
          0,   // startY
          600, // minDim
          600, // minDim
          0,
          0,
          256, // maxSize
          256  // maxSize
        );
        expect(mockCanvas.width).toBe(256);
        expect(mockCanvas.height).toBe(256);
        expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.8);

        createElementSpy.mockRestore();
    });
  });
});
