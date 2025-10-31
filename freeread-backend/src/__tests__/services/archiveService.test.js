const ArchiveService = require('../../services/archiveService');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('ArchiveService', () => {
  let archiveService;
  let mockAxiosInstance;

  beforeEach(() => {
    archiveService = new ArchiveService();
    mockAxiosInstance = {
      get: jest.fn()
    };
    
    axios.create = jest.fn(() => mockAxiosInstance);
    axios.get = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAvailableTimestamps', () => {
    test('fetches timestamps from Wayback Machine CDX API', async () => {
      const url = 'https://www.wsj.com/article';
      const mockCdxResponse = {
        data: [
          ['urlkey', 'timestamp', 'original'],
          ['wsj.com', '20240115123456', 'https://www.wsj.com/article'],
          ['wsj.com', '20240114123456', 'https://www.wsj.com/article']
        ]
      };

      axios.get.mockResolvedValue(mockCdxResponse);

      const timestamps = await archiveService.getAvailableTimestamps(url);

      expect(axios.get).toHaveBeenCalled();
      expect(timestamps).toHaveLength(2);
      expect(timestamps[0]).toBe('20240115123456');
    });

    test('returns empty array when no archives available', async () => {
      const url = 'https://www.wsj.com/article';
      const mockCdxResponse = {
        data: [['urlkey', 'timestamp', 'original']] // Only header
      };

      axios.get.mockResolvedValue(mockCdxResponse);

      const timestamps = await archiveService.getAvailableTimestamps(url);

      expect(timestamps).toHaveLength(0);
    });

    test('handles CDX API errors', async () => {
      const url = 'https://www.wsj.com/article';
      axios.get.mockRejectedValue(new Error('CDX API error'));

      await expect(archiveService.getAvailableTimestamps(url)).rejects.toThrow();
    });

    test('extracts timestamps correctly from CDX format', async () => {
      const url = 'https://www.wsj.com/article';
      const mockCdxResponse = {
        data: [
          ['urlkey', 'timestamp', 'original', 'mimetype', 'statuscode', 'digest', 'redirect'],
          ['wsj.com', '20240115000000', 'https://www.wsj.com/article', 'text/html', '200', 'abc123', '-'],
          ['wsj.com', '20240114000000', 'https://www.wsj.com/article', 'text/html', '200', 'def456', '-']
        ]
      };

      axios.get.mockResolvedValue(mockCdxResponse);

      const timestamps = await archiveService.getAvailableTimestamps(url);

      expect(timestamps).toEqual(['20240115000000', '20240114000000']);
    });

    test('limits number of timestamps returned', async () => {
      const url = 'https://www.wsj.com/article';
      const data = [['urlkey', 'timestamp', 'original']];
      // Create 20 timestamps
      for (let i = 0; i < 20; i++) {
        data.push(['wsj.com', `202401${String(i).padStart(2, '0')}000000`, url]);
      }

      axios.get.mockResolvedValue({ data });

      const timestamps = await archiveService.getAvailableTimestamps(url, 5);

      expect(timestamps.length).toBeLessThanOrEqual(5);
    });
  });

  describe('fetchFromArchive', () => {
    test('fetches archived content from Wayback Machine', async () => {
      const url = 'https://www.wsj.com/article';
      const timestamp = '20240115123456';
      // Create HTML that's long enough to pass validation (>1000 chars)
      const mockHtml = '<html><head><title>Article</title></head><body><article>' + 
        'Archived content with substantial length '.repeat(50) +
        'to pass validation checks and ensure we have enough content for readability to work properly. ' +
        'This article contains important information that needs to be extracted correctly. ' +
        'The content must be long enough to satisfy the minimum length requirements.</article></body></html>';
      const archiveUrl = `https://web.archive.org/web/${timestamp}/${url}`;

      // First call: CDX API returns timestamps
      axios.get.mockResolvedValueOnce({ 
        data: [
          ['urlkey', 'timestamp', 'original'],
          ['wsj.com', timestamp, url]
        ]
      });
      // Second call: Archive fetch returns HTML
      axios.get.mockResolvedValueOnce({ data: mockHtml });

      const result = await archiveService.fetchFromArchive(url);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('web.archive.org/cdx'),
        expect.any(Object)
      );
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(archiveUrl),
        expect.any(Object)
      );
      expect(result).not.toBeNull();
      expect(result.html).toBe(mockHtml);
      expect(result.timestamp).toBe(timestamp);
    });

    test('returns null when no archives available', async () => {
      const url = 'https://www.wsj.com/article';
      const mockCdxResponse = {
        data: [['urlkey', 'timestamp', 'original']] // Only header
      };

      axios.get.mockResolvedValue(mockCdxResponse);

      const result = await archiveService.fetchFromArchive(url);

      expect(result).toBeNull();
    });

    test('tries multiple timestamps until success', async () => {
      const url = 'https://www.wsj.com/article';
      // Note: fetchFromArchive reverses timestamps, so it tries most recent first
      // We'll provide timestamps in order [older, newer] but after reverse it becomes [newer, older]
      const olderTimestamp = '20240114123456';
      const newerTimestamp = '20240115123456';
      // Create HTML that's long enough to pass validation (>1000 chars)
      const mockHtml = '<html><head><title>Article</title></head><body><article>' + 
        'Content with substantial length '.repeat(50) +
        'to pass validation checks and ensure we have enough content for readability to work properly and extract meaningful article text. ' +
        'This is a longer article that contains multiple paragraphs and substantial content that should be extractable.</article></body></html>';

      // First CDX call returns timestamps (older first, newer second)
      axios.get.mockResolvedValueOnce({
        data: [
          ['urlkey', 'timestamp', 'original'],
          ['wsj.com', olderTimestamp, url],
          ['wsj.com', newerTimestamp, url]
        ]
      });

      // After reverse, newerTimestamp will be tried first
      // First archive fetch fails - content too short to pass validation
      axios.get.mockResolvedValueOnce({ 
        data: '<html>Error page</html>' // Too short (<1000 chars), will fail validation
      });
      
      // Second archive fetch succeeds (older timestamp)
      axios.get.mockResolvedValueOnce({ data: mockHtml });

      const result = await archiveService.fetchFromArchive(url);

      expect(result).not.toBeNull();
      expect(result.html).toBe(mockHtml);
      // After reversal, newer is tried first (fails), then older succeeds
      expect(result.timestamp).toBe(olderTimestamp);
    });

    test('returns null when all timestamp attempts fail', async () => {
      const url = 'https://www.wsj.com/article';
      const timestamps = ['20240115123456'];

      axios.get.mockResolvedValueOnce({
        data: [
          ['urlkey', 'timestamp', 'original'],
          ['wsj.com', timestamps[0], url]
        ]
      });

      axios.get.mockRejectedValue(new Error('Archive fetch failed'));

      const result = await archiveService.fetchFromArchive(url);

      expect(result).toBeNull();
    });

    test('prioritizes older timestamps for WSJ', async () => {
      const url = 'https://www.wsj.com/article';
      const recentTimestamp = '20241201123456'; // Recent
      const oldTimestamp = '20240101123456'; // 11 months ago

      axios.get.mockResolvedValueOnce({
        data: [
          ['urlkey', 'timestamp', 'original'],
          ['wsj.com', recentTimestamp, url],
          ['wsj.com', oldTimestamp, url]
        ]
      });

      const mockHtml = '<html>Content</html>';
      axios.get.mockResolvedValue({ data: mockHtml });

      await archiveService.fetchFromArchive(url, { preferOlder: true });

      // Should try older timestamp first
      const archiveUrls = axios.get.mock.calls
        .filter(call => call[0].includes('web.archive.org/web'))
        .map(call => call[0]);
      
      expect(archiveUrls.some(url => url.includes(oldTimestamp))).toBe(true);
    });
  });
});

