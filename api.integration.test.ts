import { uploadPhoto, getTryOnHistory, getClothingCatalog } from '../api';

describe('API Integration Tests', () => {
  const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000';

  describe('Photo Upload', () => {
    it('should upload photo successfully', async () => {
      const mockFile = new File(['mock-image-data'], 'test.jpg', { type: 'image/jpeg' });

      const result = await uploadPhoto(mockFile);

      expect(result).toBeDefined();
      expect(result.photoId).toBeDefined();
      expect(result.url).toMatch(/^https?:\/\//);
    }, 10000);

    it('should reject invalid file types', async () => {
      const mockFile = new File(['text-data'], 'test.txt', { type: 'text/plain' });

      await expect(uploadPhoto(mockFile)).rejects.toThrow();
    });

    it('should reject oversized files', async () => {
      const largeData = new Array(11 * 1024 * 1024).fill('a').join('');
      const mockFile = new File([largeData], 'large.jpg', { type: 'image/jpeg' });

      await expect(uploadPhoto(mockFile)).rejects.toThrow();
    });
  });

  describe('Try-On History', () => {
    it('should retrieve user try-on history', async () => {
      const mockUserId = 'test-user-123';

      const history = await getTryOnHistory(mockUserId);

      expect(Array.isArray(history)).toBe(true);
      history.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.photoUrl).toBeDefined();
        expect(item.timestamp).toBeDefined();
      });
    });

    it('should return empty array for new users', async () => {
      const newUserId = 'new-user-' + Date.now();

      const history = await getTryOnHistory(newUserId);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
    });

    it('should paginate results', async () => {
      const mockUserId = 'test-user-123';
      const limit = 5;
      const offset = 0;

      const history = await getTryOnHistory(mockUserId, limit, offset);

      expect(history.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('Clothing Catalog', () => {
    it('should retrieve clothing catalog', async () => {
      const catalog = await getClothingCatalog();

      expect(Array.isArray(catalog)).toBe(true);
      expect(catalog.length).toBeGreaterThan(0);

      catalog.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.imageUrl).toBeDefined();
        expect(item.category).toBeDefined();
      });
    });

    it('should filter by category', async () => {
      const category = 'shirts';

      const catalog = await getClothingCatalog({ category });

      catalog.forEach(item => {
        expect(item.category.toLowerCase()).toBe(category);
      });
    });

    it('should support search functionality', async () => {
      const searchTerm = 'blue';

      const catalog = await getClothingCatalog({ search: searchTerm });

      catalog.forEach(item => {
        const matchesSearch =
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase());
        expect(matchesSearch).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      await expect(getClothingCatalog()).rejects.toThrow();

      global.fetch = originalFetch;
    });

    it('should handle 404 responses', async () => {
      const nonExistentUserId = 'non-existent-user-999';

      const history = await getTryOnHistory(nonExistentUserId);

      expect(Array.isArray(history)).toBe(true);
    });

    it('should handle rate limiting', async () => {
      const mockUserId = 'test-user-123';
      const requests = Array(10).fill(null).map(() => getTryOnHistory(mockUserId));

      const results = await Promise.allSettled(requests);

      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });
  });
});
