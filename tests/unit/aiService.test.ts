import { analyzeUserPhoto, generateRecommendations } from '../aiService';

describe('AI Service', () => {
  describe('analyzeUserPhoto', () => {
    it('should analyze photo and return body metrics', async () => {
      const mockPhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

      const result = await analyzeUserPhoto(mockPhoto);

      expect(result).toBeDefined();
      expect(result.bodyShape).toBeDefined();
      expect(result.measurements).toBeDefined();
      expect(result.skinTone).toBeDefined();
    });

    it('should handle invalid photo format', async () => {
      const invalidPhoto = 'invalid-data';

      await expect(analyzeUserPhoto(invalidPhoto)).rejects.toThrow();
    });

    it('should return confidence scores', async () => {
      const mockPhoto = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';

      const result = await analyzeUserPhoto(mockPhoto);

      expect(result.confidence).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate clothing recommendations based on body metrics', async () => {
      const mockMetrics = {
        bodyShape: 'hourglass',
        measurements: {
          chest: 36,
          waist: 28,
          hips: 38,
        },
        skinTone: 'medium',
      };

      const recommendations = await generateRecommendations(mockMetrics);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should include style suggestions', async () => {
      const mockMetrics = {
        bodyShape: 'rectangle',
        measurements: {
          chest: 34,
          waist: 32,
          hips: 34,
        },
        skinTone: 'fair',
      };

      const recommendations = await generateRecommendations(mockMetrics);

      recommendations.forEach(rec => {
        expect(rec.style).toBeDefined();
        expect(rec.colors).toBeDefined();
        expect(Array.isArray(rec.colors)).toBe(true);
      });
    });
  });
});
