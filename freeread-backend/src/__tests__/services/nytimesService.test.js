const NYTimesService = require('../../services/nytimesService');
const CookieService = require('../../services/cookieService');
const SearchEngineService = require('../../services/searchEngineService');

// Mock services
jest.mock('../../services/cookieService');
jest.mock('../../services/searchEngineService');

describe('NYTimesService', () => {
  let nytimesService;
  let mockCookieService;
  let mockSearchEngineService;

  beforeEach(() => {
    mockCookieService = {
      fetchWithClearedCookies: jest.fn(),
      hasPaywall: jest.fn()
    };
    
    mockSearchEngineService = {
      fetchWithSearchReferrer: jest.fn()
    };
    
    CookieService.mockImplementation(() => mockCookieService);
    SearchEngineService.mockImplementation(() => mockSearchEngineService);
    nytimesService = new NYTimesService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchArticle', () => {
    test('calls cookie service to fetch article', async () => {
      const testUrl = 'https://www.nytimes.com/2024/01/15/article.html';
      const mockHtml = '<html><article>Article content</article></html>';
      
      mockCookieService.fetchWithClearedCookies.mockResolvedValue(mockHtml);
      mockCookieService.hasPaywall.mockReturnValue(false);

      await nytimesService.fetchArticle(testUrl);

      expect(mockCookieService.fetchWithClearedCookies).toHaveBeenCalledWith(testUrl, {});
    });

    test('returns HTML when no paywall detected', async () => {
      const testUrl = 'https://www.nytimes.com/2024/01/15/article.html';
      const expectedHtml = '<html><article>Article content</article></html>';
      
      mockCookieService.fetchWithClearedCookies.mockResolvedValue(expectedHtml);
      mockCookieService.hasPaywall.mockReturnValue(false);

      const result = await nytimesService.fetchArticle(testUrl);

      expect(result).toBe(expectedHtml);
    });

    test('throws error when paywall is detected', async () => {
      const testUrl = 'https://www.nytimes.com/2024/01/15/article.html';
      const mockHtml = '<html><div>Subscribe to The Times</div></html>';
      
      // Both methods detect paywall
      mockCookieService.fetchWithClearedCookies.mockResolvedValue(mockHtml);
      mockCookieService.hasPaywall.mockReturnValue(true); // Cookie method detects paywall
      
      mockSearchEngineService.fetchWithSearchReferrer.mockResolvedValue({
        html: mockHtml,
        source: 'search-engine'
      });
      // Search engine also detects paywall

      await expect(nytimesService.fetchArticle(testUrl)).rejects.toThrow('NYT fetch failed');
    });

    test('checks for paywall after fetching', async () => {
      const testUrl = 'https://www.nytimes.com/2024/01/15/article.html';
      const mockHtml = '<html>Content</html>';
      
      mockCookieService.fetchWithClearedCookies.mockResolvedValue(mockHtml);
      mockCookieService.hasPaywall.mockReturnValue(false);

      await nytimesService.fetchArticle(testUrl);

      // Verify both methods were called
      expect(mockCookieService.fetchWithClearedCookies).toHaveBeenCalled();
      expect(mockCookieService.hasPaywall).toHaveBeenCalledWith(mockHtml);
      
      // Verify order: fetchWithClearedCookies called before hasPaywall
      const fetchCallOrder = mockCookieService.fetchWithClearedCookies.mock.invocationCallOrder[0];
      const paywallCallOrder = mockCookieService.hasPaywall.mock.invocationCallOrder[0];
      expect(paywallCallOrder).toBeGreaterThan(fetchCallOrder);
    });

    test('handles network errors from cookie service, tries search engine fallback', async () => {
      const testUrl = 'https://www.nytimes.com/2024/01/15/article.html';
      const error = new Error('Network error');
      
      // Cookie service fails
      mockCookieService.fetchWithClearedCookies.mockRejectedValue(error);
      // Search engine also fails
      mockSearchEngineService.fetchWithSearchReferrer.mockRejectedValue(error);

      await expect(nytimesService.fetchArticle(testUrl)).rejects.toThrow('NYT fetch failed');
    });

    test('handles timeout errors, tries search engine fallback', async () => {
      const testUrl = 'https://www.nytimes.com/2024/01/15/article.html';
      const error = new Error('timeout of 10000ms exceeded');
      
      // Cookie service fails
      mockCookieService.fetchWithClearedCookies.mockRejectedValue(error);
      // Search engine also fails
      mockSearchEngineService.fetchWithSearchReferrer.mockRejectedValue(error);

      await expect(nytimesService.fetchArticle(testUrl)).rejects.toThrow('NYT fetch failed');
    });

    test('tries search engine method when cookie clearing fails', async () => {
      const testUrl = 'https://www.nytimes.com/2024/01/15/article.html';
      const mockHtml = '<html><article>Content</article></html>';
      
      // Cookie service fails or detects paywall
      mockCookieService.fetchWithClearedCookies.mockResolvedValue('<html>Paywall</html>');
      mockCookieService.hasPaywall.mockReturnValueOnce(true); // First call returns true
      
      // Search engine succeeds
      mockSearchEngineService.fetchWithSearchReferrer.mockResolvedValue({
        html: mockHtml,
        source: 'search-engine'
      });
      mockCookieService.hasPaywall.mockReturnValueOnce(false); // Second call (after search) returns false

      const result = await nytimesService.fetchArticle(testUrl);

      expect(mockSearchEngineService.fetchWithSearchReferrer).toHaveBeenCalled();
      expect(result).toBe(mockHtml);
    });

    test('passes options to cookie service', async () => {
      const testUrl = 'https://www.nytimes.com/2024/01/15/article.html';
      const options = { timeout: 15000, userAgent: 'Custom Agent' };
      const mockHtml = '<html>Content</html>';
      
      mockCookieService.fetchWithClearedCookies.mockResolvedValue(mockHtml);
      mockCookieService.hasPaywall.mockReturnValue(false);

      await nytimesService.fetchArticle(testUrl, options);

      expect(mockCookieService.fetchWithClearedCookies).toHaveBeenCalledWith(testUrl, options);
    });
  });

  describe('hasPaywall', () => {
    test('delegates to cookie service hasPaywall method', () => {
      const mockHtml = '<html>Content</html>';
      mockCookieService.hasPaywall.mockReturnValue(true);

      const result = nytimesService.hasPaywall(mockHtml);

      expect(mockCookieService.hasPaywall).toHaveBeenCalledWith(mockHtml);
      expect(result).toBe(true);
    });
  });
});

