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

    test('throws error when paywall detected', async () => {
      const url = 'https://www.nytimes.com/article';
      const html = '<html><div>Subscribe to The Times</div></html>';

      await expect(contentProcessor.extractContent(html, url)).rejects.toThrow('Paywall detected');
    });

    test('throws error when content extraction fails', async () => {
      const url = 'https://www.nytimes.com/article';
      const html = '<html><body>Minimal content</body></html>';

      Readability.mockImplementation(() => ({
        parse: jest.fn(() => null) // Readability returns null when it fails
      }));

      await expect(contentProcessor.extractContent(html, url)).rejects.toThrow('Failed to extract meaningful content');
    });

    test('throws error when content too short', async () => {
      const url = 'https://www.nytimes.com/article';
      const html = '<html><body><article><p>Short</p></article></body></html>';

      const mockArticle = {
        title: 'Title',
        textContent: 'Short content',
        content: '<article><p>Short</p></article>',
        byline: null,
        excerpt: null,
        length: 50 // Too short
      };

      Readability.mockImplementation(() => ({
        parse: jest.fn(() => mockArticle)
      }));

      await expect(contentProcessor.extractContent(html, url)).rejects.toThrow('Failed to extract meaningful content');
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

    test('validates minimum content length', async () => {
      const url = 'https://www.nytimes.com/article';
      const html = '<html><body><p>Short</p></body></html>';

      const mockArticle = {
        title: 'Title',
        textContent: 'Short',
        content: '<p>Short</p>',
        byline: null,
        excerpt: null,
        length: 5 // Below 500 character minimum
      };

      Readability.mockImplementation(() => ({
        parse: jest.fn(() => mockArticle)
      }));

      await expect(contentProcessor.extractContent(html, url)).rejects.toThrow('Failed to extract meaningful content');
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

