const ContentProcessor = require('../../services/contentProcessor');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');

// Mock Readability
jest.mock('@mozilla/readability');

describe('ContentProcessor', () => {
  let contentProcessor;

  beforeEach(() => {
    contentProcessor = new ContentProcessor();
  });

  describe('extractContent', () => {
    test('extracts article content successfully', async () => {
      const url = 'https://www.nytimes.com/article';
      const html = `
        <html>
          <body>
            <article>
              <h1>Article Title</h1>
              <p>Article content here</p>
            </article>
          </body>
        </html>
      `;

      const mockArticle = {
        title: 'Article Title',
        textContent: 'Article content here. '.repeat(30), // Make it longer than 500 chars
        content: '<article><h1>Article Title</h1><p>Article content here</p></article>',
        byline: 'John Doe',
        excerpt: 'Article excerpt',
        length: 600
      };

      Readability.mockImplementation(() => ({
        parse: jest.fn(() => mockArticle)
      }));

      const result = await contentProcessor.extractContent(html, url);

      expect(result).toEqual({
        title: 'Article Title',
        text: mockArticle.textContent,
        html: '<article><h1>Article Title</h1><p>Article content here</p></article>',
        author: 'John Doe',
        excerpt: 'Article excerpt',
        length: 600
      });
    });

    test('attempts extraction even when paywall detected (does not block)', async () => {
      const url = 'https://www.nytimes.com/article';
      // HTML with paywall indicator but also some content
      const html = '<html><body><div>Subscribe to The Times</div><article><h1>Title</h1><p>Some content here that is long enough to be extracted</p></article></body></html>';

      const mockArticle = {
        title: 'Title',
        textContent: 'Some content here that is long enough to be extracted. '.repeat(10),
        content: '<article><h1>Title</h1><p>Some content here that is long enough to be extracted</p></article>',
        byline: null,
        excerpt: null,
        length: 500
      };

      Readability.mockImplementation(() => ({
        parse: jest.fn(() => mockArticle)
      }));

      // Should still extract content even with paywall indicator
      const result = await contentProcessor.extractContent(html, url);
      expect(result).toBeDefined();
      expect(result.title).toBe('Title');
    });

    test('throws error when content extraction fails completely', async () => {
      const url = 'https://www.nytimes.com/article';
      // HTML with no article content, no paragraphs, nothing extractable
      const html = '<html><body><div>No content here</div></body></html>';

      Readability.mockImplementation(() => ({
        parse: jest.fn(() => null) // Readability returns null when it fails
      }));

      // Should throw error when no content can be extracted at all
      await expect(contentProcessor.extractContent(html, url)).rejects.toThrow('Failed to extract meaningful content');
    });

    test('returns content even when short (lenient minimum)', async () => {
      const url = 'https://www.nytimes.com/article';
      const html = '<html><body><article><h1>Title</h1><p>Short content</p></article></body></html>';

      const mockArticle = {
        title: 'Title',
        textContent: 'Short content',
        content: '<article><h1>Title</h1><p>Short content</p></article>',
        byline: null,
        excerpt: null,
        length: 50 // Short but above minimum (20 chars)
      };

      Readability.mockImplementation(() => ({
        parse: jest.fn(() => mockArticle)
      }));

      // Should return content even if short (lenient for WSJ/archived articles)
      const result = await contentProcessor.extractContent(html, url);
      expect(result).toBeDefined();
      expect(result.title).toBe('Title');
      expect(result.text).toBe('Short content');
    });

    test('handles missing author gracefully', async () => {
      const url = 'https://www.nytimes.com/article';
      const html = '<html><body><article><h1>Title</h1><p>Content that is long enough to pass validation</p></article></body></html>';

      const longContent = 'Content that is long enough to pass validation. '.repeat(20);
      const mockArticle = {
        title: 'Title',
        textContent: longContent,
        content: '<article><h1>Title</h1><p>' + longContent + '</p></article>',
        byline: null,
        excerpt: null,
        length: 600
      };

      Readability.mockImplementation(() => ({
        parse: jest.fn(() => mockArticle)
      }));

      const result = await contentProcessor.extractContent(html, url);

      expect(result.author).toBeNull();
      expect(result.title).toBe('Title');
    });

    test('returns content above minimum length (20 chars)', async () => {
      const url = 'https://www.nytimes.com/article';
      const html = '<html><body><article><h1>Title</h1><p>This is content that is longer than the minimum of 20 characters</p></article></body></html>';

      const mockArticle = {
        title: 'Title',
        textContent: 'This is content that is longer than the minimum of 20 characters',
        content: '<article><h1>Title</h1><p>This is content that is longer than the minimum of 20 characters</p></article>',
        byline: null,
        excerpt: null,
        length: 70 // Above minimum (20 chars)
      };

      Readability.mockImplementation(() => ({
        parse: jest.fn(() => mockArticle)
      }));

      // Should return content above minimum length
      const result = await contentProcessor.extractContent(html, url);
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(20);
    });

    test('handles JSDOM creation errors', async () => {
      const url = 'https://www.nytimes.com/article';
      const html = null; // Invalid HTML

      // Mock JSDOM to throw error
      jest.spyOn(require('jsdom'), 'JSDOM').mockImplementation(() => {
        throw new Error('JSDOM error');
      });

      await expect(contentProcessor.extractContent(html, url)).rejects.toThrow();
    });
  });

  describe('hasPaywall', () => {
    test('detects paywall in HTML', () => {
      const html = '<div>Subscribe to The Times</div>';
      expect(contentProcessor.hasPaywall(html)).toBe(true);
    });

    test('returns false for clean content', () => {
      const html = '<article><h1>Title</h1><p>Content</p></article>';
      expect(contentProcessor.hasPaywall(html)).toBe(false);
    });

    test('is case insensitive', () => {
      const html = '<div>SUBSCRIBE TO THE TIMES</div>';
      expect(contentProcessor.hasPaywall(html)).toBe(true);
    });
  });
});

