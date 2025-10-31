const SearchEngineService = require('../../services/searchEngineService');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('SearchEngineService', () => {
  let searchEngineService;
  let mockAxiosInstance;

  beforeEach(() => {
    searchEngineService = new SearchEngineService();
    mockAxiosInstance = {
      get: jest.fn()
    };
    
    axios.create = jest.fn(() => mockAxiosInstance);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchWithSearchReferrer', () => {
    test('creates axios instance with Googlebot user-agent', async () => {
      const testUrl = 'https://www.nytimes.com/article';
      const mockResponse = { data: '<html>Content</html>' };
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await searchEngineService.fetchWithSearchReferrer(testUrl);

      expect(axios.create).toHaveBeenCalled();
      const config = axios.create.mock.calls[0][0];
      expect(config.headers['User-Agent']).toContain('Googlebot');
    });

    test('sets Google search referrer header', async () => {
      const testUrl = 'https://www.nytimes.com/article';
      const mockResponse = { data: '<html>Content</html>' };
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await searchEngineService.fetchWithSearchReferrer(testUrl);

      const config = axios.create.mock.calls[0][0];
      expect(config.headers['Referer']).toContain('google.com/search');
    });

    test('extracts domain from URL for referrer', async () => {
      const testUrl = 'https://www.nytimes.com/2024/01/15/article.html';
      const mockResponse = { data: '<html>Content</html>' };
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await searchEngineService.fetchWithSearchReferrer(testUrl);

      const config = axios.create.mock.calls[0][0];
      expect(config.headers['Referer']).toContain('site:');
      expect(config.headers['Referer']).toContain('google.com/search');
    });

    test('makes GET request to provided URL', async () => {
      const testUrl = 'https://www.nytimes.com/article';
      const mockResponse = { data: '<html>Content</html>' };
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await searchEngineService.fetchWithSearchReferrer(testUrl);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(testUrl);
    });

    test('returns HTML content from response', async () => {
      const testUrl = 'https://www.nytimes.com/article';
      const expectedHtml = '<html><article>Content</article></html>';
      const mockResponse = { data: expectedHtml };
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await searchEngineService.fetchWithSearchReferrer(testUrl);

      expect(result.html).toBe(expectedHtml);
      expect(result.source).toBe('search-engine');
    });

    test('does not send cookies', async () => {
      const testUrl = 'https://www.nytimes.com/article';
      const mockResponse = { data: '<html>Content</html>' };
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await searchEngineService.fetchWithSearchReferrer(testUrl);

      const config = axios.create.mock.calls[0][0];
      expect(config.withCredentials).toBe(false);
      expect(config.headers['Cookie']).toBeUndefined();
    });

    test('handles HTTP errors', async () => {
      const testUrl = 'https://www.nytimes.com/article';
      const error = new Error('Network error');
      
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(searchEngineService.fetchWithSearchReferrer(testUrl)).rejects.toThrow();
    });

    test('respects timeout option', async () => {
      const testUrl = 'https://www.nytimes.com/article';
      const mockResponse = { data: '<html>Content</html>' };
      const customTimeout = 15000;
      
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await searchEngineService.fetchWithSearchReferrer(testUrl, { timeout: customTimeout });

      const config = axios.create.mock.calls[0][0];
      expect(config.timeout).toBe(customTimeout);
    });
  });
});

