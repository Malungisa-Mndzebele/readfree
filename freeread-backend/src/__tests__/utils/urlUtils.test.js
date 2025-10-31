const {
  isValidUrl,
  getDomain,
  normalizeUrl,
  isNYTimes,
  isWSJ
} = require('../../utils/urlUtils');

describe('urlUtils', () => {
  describe('isValidUrl', () => {
    test('returns true for valid http URL', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    test('returns true for valid https URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    test('returns false for invalid URL', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
    });

    test('returns false for null', () => {
      expect(isValidUrl(null)).toBe(false);
    });

    test('returns false for undefined', () => {
      expect(isValidUrl(undefined)).toBe(false);
    });

    test('returns false for non-string', () => {
      expect(isValidUrl(123)).toBe(false);
    });

    test('returns false for empty string', () => {
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('getDomain', () => {
    test('extracts domain from URL', () => {
      expect(getDomain('https://example.com/path')).toBe('example.com');
    });

    test('extracts domain from NYT URL', () => {
      expect(getDomain('https://www.nytimes.com/article')).toBe('www.nytimes.com');
    });

    test('returns null for invalid URL', () => {
      expect(getDomain('not-a-url')).toBe(null);
    });

    test('handles subdomains correctly', () => {
      expect(getDomain('https://subdomain.example.com')).toBe('subdomain.example.com');
    });
  });

  describe('normalizeUrl', () => {
    test('adds https:// if missing', () => {
      const result = normalizeUrl('example.com');
      expect(result).toBe('https://example.com/');
    });

    test('preserves https:// if present', () => {
      const result = normalizeUrl('https://example.com');
      expect(result).toBe('https://example.com/');
    });

    test('removes fragment', () => {
      const result = normalizeUrl('https://example.com/page#section');
      expect(result).toBe('https://example.com/page');
    });

    test('preserves query parameters', () => {
      const result = normalizeUrl('https://example.com/page?param=value');
      expect(result).toBe('https://example.com/page?param=value');
    });

    test('throws error for invalid input', () => {
      expect(() => normalizeUrl(null)).toThrow();
      expect(() => normalizeUrl('')).toThrow();
    });
  });

  describe('isNYTimes', () => {
    test('returns true for NYT URL', () => {
      expect(isNYTimes('https://www.nytimes.com/2024/01/15/article.html')).toBe(true);
    });

    test('returns true for NYT subdomain', () => {
      expect(isNYTimes('https://cooking.nytimes.com/recipe')).toBe(true);
    });

    test('returns false for non-NYT URL', () => {
      expect(isNYTimes('https://example.com/article')).toBe(false);
    });

    test('returns false for invalid URL', () => {
      expect(isNYTimes('not-a-url')).toBe(false);
    });
  });

  describe('isWSJ', () => {
    test('returns true for WSJ URL', () => {
      expect(isWSJ('https://www.wsj.com/articles/article')).toBe(true);
    });

    test('returns false for non-WSJ URL', () => {
      expect(isWSJ('https://example.com/article')).toBe(false);
    });

    test('returns false for invalid URL', () => {
      expect(isWSJ('not-a-url')).toBe(false);
    });
  });
});

