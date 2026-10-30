import { processImageFileToAvatar } from '../lib/imageUtils';

describe('processImageFileToAvatar', () => {
  it('should reject when file is not a valid image type', async () => {
    // Create a mock file with invalid type and extension
    const invalidFile = new File(['mock content'], 'test.txt', { type: 'text/plain' });

    // Expect the promise to reject with a specific error message
    await expect(processImageFileToAvatar(invalidFile)).rejects.toThrow(
      'Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).'
    );
  });
});
