const CookieService = require('../../services/cookieService');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('CookieService', () => {
  let cookieService;
  let mockAxiosInstance;

  beforeEach(() => {
    cookieService = new CookieService();
    mockAxiosInstance = {
      get: jest.fn()
    };
    
    // Mock axios.create to return our mock instance
    axios.create = jest.fn(() => mockAxiosInstance);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchWithClearedCookies', () => {
    test('creates axios instance with no credentials', async () => {
      const testUrl = 'https://www.nytimes.com/article';
      const mockResponse = { data: '<html>Test content</html>' };
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await cookieService.fetchWithClearedCookies(testUrl);

      expect(axios.create).toHaveBeenCalled();
      const config = axios.create.mock.calls[0][0];
      expect(config.withCredentials).toBe(false);
    });

    test('sets appropriate headers', async () => {
      const testUrl = 'https://www.nytimes.com/article';
      const mockResponse = { data: '<html>Test content</html>' };
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await cookieService.fetchWithClearedCookies(testUrl);

      const config = axios.create.mock.calls[0][0];
      expect(config.headers).toBeDefined();
      expect(config.headers['User-Agent']).toBeDefined();
      expect(config.headers['Accept']).toBeDefined();
      expect(config.headers['DNT']).toBe('1');
    });

    test('makes GET request to provided URL', async () => {
      const testUrl = 'https://www.nytimes.com/article';
      const mockResponse = { data: '<html>Test content</html>' };
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await cookieService.fetchWithClearedCookies(testUrl);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(testUrl);
    });

    test('returns HTML content from response', async () => {
      const testUrl = 'https://www.nytimes.com/article';
      const expectedHtml = '<html><body>Article content</body></html>';
      const mockResponse = { data: expectedHtml };
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await cookieService.fetchWithClearedCookies(testUrl);

      expect(result).toBe(expectedHtml);
    });

    test('respects timeout option', async () => {
      const testUrl = 'https://www.nytimes.com/article';
      const mockResponse = { data: '<html>Test</html>' };
      const customTimeout = 15000;
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await cookieService.fetchWithClearedCookies(testUrl, { timeout: customTimeout });

      const config = axios.create.mock.calls[0][0];
      expect(config.timeout).toBe(customTimeout);
    });

    test('handles HTTP errors', async () => {
      const testUrl = 'https://www.nytimes.com/article';
      const error = new Error('Network error');
      
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(cookieService.fetchWithClearedCookies(testUrl)).rejects.toThrow('Network error');
    });

    test('handles timeout errors', async () => {
      const testUrl = 'https://www.nytimes.com/article';
      const error = new Error('timeout of 10000ms exceeded');
      error.code = 'ECONNABORTED';
      
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(cookieService.fetchWithClearedCookies(testUrl)).rejects.toThrow();
    });

    test('does not set cookie header', async () => {
      const testUrl = 'https://www.nytimes.com/article';
      const mockResponse = { data: '<html>Test</html>' };
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await cookieService.fetchWithClearedCookies(testUrl);

      const config = axios.create.mock.calls[0][0];
      // Should not have Cookie header or should be empty
      expect(config.headers['Cookie']).toBeUndefined();
    });
  });

  describe('hasPaywall', () => {
    test('detects NYT paywall message', () => {
      const html = '<div>Subscribe to The Times to read this article</div>';
      expect(cookieService.hasPaywall(html)).toBe(true);
    });

    test('detects article limit message', () => {
      const html = "<p>You've reached your article limit</p>";
      expect(cookieService.hasPaywall(html)).toBe(true);
    });

    test('detects login prompt', () => {
      const html = '<span>Log in or create a free account</span>';
      expect(cookieService.hasPaywall(html)).toBe(true);
    });

    test('detects paywall class', () => {
      const html = '<div class="paywall">Content</div>';
      expect(cookieService.hasPaywall(html)).toBe(true);
    });

    test('detects paywall id', () => {
      const html = '<div id="paywall">Content</div>';
      expect(cookieService.hasPaywall(html)).toBe(true);
    });

    test('returns false for clean article', () => {
      const html = '<article><h1>Title</h1><p>Content without paywall</p></article>';
      expect(cookieService.hasPaywall(html)).toBe(false);
    });

    test('case insensitive detection', () => {
      const html = '<div>SUBSCRIBE TO THE TIMES</div>';
      expect(cookieService.hasPaywall(html)).toBe(true);
    });

    test('returns false for empty string', () => {
      expect(cookieService.hasPaywall('')).toBe(false);
    });

    test('returns false for null', () => {
      expect(cookieService.hasPaywall(null)).toBe(false);
    });
  });

  describe('getSiteRules', () => {
    test('returns NYT rules for nytimes.com', () => {
      const rules = cookieService.getSiteRules('nytimes.com');
      expect(rules).toBeDefined();
      expect(rules.cookiesToClear).toBeDefined();
      expect(Array.isArray(rules.cookiesToClear)).toBe(true);
    });

    test('returns WSJ rules for wsj.com', () => {
      const rules = cookieService.getSiteRules('wsj.com');
      expect(rules).toBeDefined();
    });

    test('returns default rules for unknown site', () => {
      const rules = cookieService.getSiteRules('unknown-site.com');
      expect(rules).toBeDefined();
    });
  });
});

