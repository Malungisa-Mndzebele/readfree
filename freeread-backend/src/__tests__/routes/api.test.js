const request = require('supertest');
const express = require('express');

// Mock services BEFORE requiring routes
jest.mock('../../services/nytimesService');
jest.mock('../../services/contentProcessor');

const NYTimesService = require('../../services/nytimesService');
const ContentProcessor = require('../../services/contentProcessor');

// Create mock instances
const mockNYTService = {
  fetchArticle: jest.fn()
};

const mockContentProcessor = {
  extractContent: jest.fn()
};

NYTimesService.mockImplementation(() => mockNYTService);
ContentProcessor.mockImplementation(() => mockContentProcessor);

// Now require routes (they'll use mocked services)
const apiRoutes = require('../../routes/api');

const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/fetch', () => {
    test('returns article content for valid NYT URL', async () => {
      const mockHtml = '<html><article>Article content</article></html>';
      const mockExtracted = {
        title: 'Test Article',
        text: 'Article content here',
        html: '<article>Article content</article>',
        author: 'John Doe',
        excerpt: 'Article excerpt',
        length: 600
      };

      mockNYTService.fetchArticle.mockResolvedValue(mockHtml);
      mockContentProcessor.extractContent.mockResolvedValue(mockExtracted);

      const response = await request(app)
        .post('/api/fetch')
        .send({ url: 'https://www.nytimes.com/2024/01/15/article.html' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        method: 'cookie-clearing',
        content: mockExtracted
      });
    });

    test('returns 400 for invalid URL', async () => {
      const response = await request(app)
        .post('/api/fetch')
        .send({ url: 'not-a-valid-url' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('returns 400 for missing URL', async () => {
      const response = await request(app)
        .post('/api/fetch')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('returns 500 when NYT service fails', async () => {
      mockNYTService.fetchArticle.mockRejectedValue(new Error('Network error'));

      const response = await request(app)
        .post('/api/fetch')
        .send({ url: 'https://www.nytimes.com/2024/01/15/article.html' })
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBeDefined();
    });

    test('returns 500 when paywall detected', async () => {
      mockNYTService.fetchArticle.mockRejectedValue(new Error('Paywall detected'));

      const response = await request(app)
        .post('/api/fetch')
        .send({ url: 'https://www.nytimes.com/2024/01/15/article.html' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    test('returns 500 when content extraction fails', async () => {
      const mockHtml = '<html><article>Content</article></html>';

      mockNYTService.fetchArticle.mockResolvedValue(mockHtml);
      mockContentProcessor.extractContent.mockRejectedValue(new Error('Extraction failed'));

      const response = await request(app)
        .post('/api/fetch')
        .send({ url: 'https://www.nytimes.com/2024/01/15/article.html' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    test('returns 400 for non-NYT URLs in MVP', async () => {
      const response = await request(app)
        .post('/api/fetch')
        .send({ url: 'https://www.example.com/article' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('includes metadata in successful response', async () => {
      const mockHtml = '<html><article>Content</article></html>';
      const mockExtracted = {
        title: 'Test',
        text: 'Content',
        html: '<article>Content</article>',
        author: null,
        excerpt: null,
        length: 600
      };

      mockNYTService.fetchArticle.mockResolvedValue(mockHtml);
      mockContentProcessor.extractContent.mockResolvedValue(mockExtracted);

      const response = await request(app)
        .post('/api/fetch')
        .send({ url: 'https://www.nytimes.com/2024/01/15/article.html' })
        .expect(200);

      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.originalUrl).toBe('https://www.nytimes.com/2024/01/15/article.html');
      expect(response.body.metadata.source).toBe('direct');
    });
  });
});

