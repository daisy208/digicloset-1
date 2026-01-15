import { CacheService } from '../cacheService';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  afterEach(() => {
    cacheService.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      const key = 'test-key';
      const value = { data: 'test-value' };

      cacheService.set(key, value);
      const retrieved = cacheService.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return null for non-existent keys', () => {
      const result = cacheService.get('non-existent-key');

      expect(result).toBeNull();
    });

    it('should handle different data types', () => {
      cacheService.set('string', 'hello');
      cacheService.set('number', 42);
      cacheService.set('boolean', true);
      cacheService.set('object', { foo: 'bar' });
      cacheService.set('array', [1, 2, 3]);

      expect(cacheService.get('string')).toBe('hello');
      expect(cacheService.get('number')).toBe(42);
      expect(cacheService.get('boolean')).toBe(true);
      expect(cacheService.get('object')).toEqual({ foo: 'bar' });
      expect(cacheService.get('array')).toEqual([1, 2, 3]);
    });
  });

  describe('expiration', () => {
    it('should expire cached values after TTL', async () => {
      const key = 'expiring-key';
      const value = 'expiring-value';
      const ttl = 100;

      cacheService.set(key, value, ttl);

      expect(cacheService.get(key)).toBe(value);

      await new Promise(resolve => setTimeout(resolve, ttl + 10));

      expect(cacheService.get(key)).toBeNull();
    });

    it('should not expire if no TTL is set', async () => {
      const key = 'persistent-key';
      const value = 'persistent-value';

      cacheService.set(key, value);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(cacheService.get(key)).toBe(value);
    });
  });

  describe('delete and clear', () => {
    it('should delete specific keys', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');

      cacheService.delete('key1');

      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key2')).toBe('value2');
    });

    it('should clear all cached values', () => {
      cacheService.set('key1', 'value1');
      cacheService.set('key2', 'value2');
      cacheService.set('key3', 'value3');

      cacheService.clear();

      expect(cacheService.get('key1')).toBeNull();
      expect(cacheService.get('key2')).toBeNull();
      expect(cacheService.get('key3')).toBeNull();
    });
  });

  describe('has', () => {
    it('should check if key exists', () => {
      cacheService.set('existing-key', 'value');

      expect(cacheService.has('existing-key')).toBe(true);
      expect(cacheService.has('non-existent-key')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      const key = 'expiring-key';
      const ttl = 50;

      cacheService.set(key, 'value', ttl);

      expect(cacheService.has(key)).toBe(true);

      await new Promise(resolve => setTimeout(resolve, ttl + 10));

      expect(cacheService.has(key)).toBe(false);
    });
  });
});
