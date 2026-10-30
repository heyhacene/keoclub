import { generateRandomAvatarUrl } from './imageUtils';

describe('generateRandomAvatarUrl', () => {
  it('should generate a valid avatar URL', () => {
    const url = generateRandomAvatarUrl();
    const urlPattern = /^https:\/\/api\.dicebear\.com\/7\.x\/(adventurer|bottts|micah|fun-emoji)\/svg\?seed=keo_[a-z0-9]{1,7}$/;
    expect(url).toMatch(urlPattern);
  });

  it('should generate unique URLs on multiple calls', () => {
    const url1 = generateRandomAvatarUrl();
    const url2 = generateRandomAvatarUrl();
    // In rare cases they might collide, but the probability is extremely low.
    // For a simple test, checking for inequality is sufficient.
    expect(url1).not.toBe(url2);
  });
});
