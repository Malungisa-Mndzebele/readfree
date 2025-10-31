const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const DebugService = require('./debugService');

/**
 * Content Processor - Extracts clean article content from HTML
 * Uses Mozilla Readability for content extraction
 */
class ContentProcessor {
  constructor() {
    this.minContentLength = 20; // Minimum characters for valid article (MVP lenient)
    this.debugService = new DebugService();
  }

  /**
   * Extracts article content from HTML using Readability
   * @param {string} html - Raw HTML content
   * @param {string} url - Original article URL
   * @returns {Promise<object>} - Extracted article content
   * @throws {Error} - If extraction fails or paywall detected
   */
  async extractContent(html, url) {
    if (!html || typeof html !== 'string') {
      throw new Error('Invalid HTML input');
    }

    // Debug: Save and analyze HTML
    if (this.debugService.debugMode) {
      this.debugService.saveHtml(html, url, 'before-extraction');
      const analysis = this.debugService.analyzeHtml(html);
      this.debugService.printAnalysis(analysis);
    }

    // Don't block on paywall detection - try extraction first, paywall check is informational
    const hasPaywall = this.hasPaywall(html);

    try {
      // Create DOM from HTML
      const dom = new JSDOM(html, { url });
      const document = dom.window.document;

      // Extract article using Readability first
      const reader = new Readability(document);
      let article = reader.parse();

      // If Readability failed or is too short, try fallback selectors
      if (!article || !article.textContent || article.textContent.length < this.minContentLength) {
        const fallback = this.extractWithFallback(document);
        
        // Return fallback if it has any text at all
        if (fallback && fallback.text && fallback.text.length > 0) {
          return fallback;
        }

        // Final attempt: if Readability produced anything, return it even if short
        if (article && article.textContent && article.textContent.length > 0) {
          return {
            title: article.title || 'Untitled',
            text: article.textContent || '',
            html: article.content || '',
            author: article.byline || null,
            excerpt: article.excerpt || null,
            length: article.length || (article.textContent ? article.textContent.length : 0)
          };
        }

        // Last resort: try to extract ANY paragraphs from the page
        const anyParas = Array.from(document.querySelectorAll('p'))
          .map(p => (p.textContent || '').trim())
          .filter(p => p.length > 50); // Only substantial paragraphs
        
        if (anyParas.length > 0) {
          const title = (document.querySelector('h1') && document.querySelector('h1').textContent) || 
                       (document.querySelector('title') && document.querySelector('title').textContent) || 
                       'Untitled';
          const text = anyParas.join('\n\n');
          return {
            title: title.trim(),
            text: text,
            html: '<div id="readability-page-1" class="page">' + anyParas.map(p => `<p>${this.escapeHtml(p)}</p>`).join('') + '</div>',
            author: null,
            excerpt: null,
            length: text.length
          };
        }

        throw new Error('Failed to extract meaningful content');
      }

      // Return formatted content (Readability success)
      return {
        title: article.title || 'Untitled',
        text: article.textContent || '',
        html: article.content || '',
        author: article.byline || null,
        excerpt: article.excerpt || null,
        length: article.length || 0
      };
    } catch (error) {
      // Re-throw with context if not already our error
      if (error.message.includes('Paywall') || error.message.includes('Failed to extract')) {
        throw error;
      }
      
      throw new Error(`Content extraction failed: ${error.message}`);
    }
  }

  /**
   * Fallback extraction using common NYT/article selectors
   * @param {Document} document
   * @returns {{title:string, text:string, html:string, author:string|null, excerpt:string|null, length:number}|null}
   */
  extractWithFallback(document) {
    try {
      const title = (document.querySelector('h1') && document.querySelector('h1').textContent) || 
                    (document.querySelector('title') && document.querySelector('title').textContent) || 
                    'nytimes.com';
      const candidates = [
        'article',
        '[data-testid="article-body"]',
        'section[name="articleBody"]',
        '#site-content article',
        'main article',
        '[itemprop="articleBody"]',
        '[data-module="ArticleBody"]',
        'div[class*="article"]',
        'div[class*="story"]'
      ];

      let container = null;
      for (const sel of candidates) {
        const el = document.querySelector(sel);
        if (el) {
          const paras = el.querySelectorAll('p');
          if (paras.length > 2 || el.textContent.trim().length > 200) {
            container = el;
            break;
          }
        }
      }

      // If no container, try collecting paragraphs from the page
      let html = '';
      let text = '';
      if (!container) {
        // Try to find substantial paragraphs anywhere on the page
        const allParas = Array.from(document.querySelectorAll('p'))
          .map(p => ({
            text: (p.textContent || '').trim(),
            html: p.outerHTML
          }))
          .filter(p => p.text.length > 50 && !p.text.toLowerCase().includes('subscribe') && !p.text.toLowerCase().includes('cookie'));
        
        if (allParas.length > 0) {
          html = '<div id="readability-page-1" class="page">' + allParas.map(p => p.html).join('') + '</div>';
          text = allParas.map(p => p.text).join('\n\n');
        }
      } else {
        // Build HTML using only text paragraphs within container
        const paras = Array.from(container.querySelectorAll('p'))
          .map(p => ({
            text: (p.textContent || '').trim(),
            html: p.outerHTML
          }))
          .filter(p => p.text.length > 30 && !p.text.toLowerCase().includes('subscribe'));
        
        if (paras.length > 0) {
          html = '<div id="readability-page-1" class="page">' + paras.map(p => p.html).join('') + '</div>';
          text = paras.map(p => p.text).join('\n\n');
        } else {
          // Fallback: use container's text content directly
          const containerText = container.textContent.trim();
          if (containerText.length > 100) {
            text = containerText;
            html = `<div id="readability-page-1" class="page">${this.escapeHtml(containerText).replace(/\n/g, '<br>')}</div>`;
          }
        }
      }

      const author = (document.querySelector('[rel="author"], [itemprop="author"], .byline') &&
        (document.querySelector('[rel="author"], [itemprop="author"], .byline').textContent || '').trim()) || null;
      const excerpt = (document.querySelector('meta[name="description"], meta[property="og:description"]') &&
        document.querySelector('meta[name="description"], meta[property="og:description"]').getAttribute('content')) || null;

      if (!text || text.length < 50) return null;
      return { title, text, html, author, excerpt, length: text.length };
    } catch (err) {
      console.error('Fallback extraction error:', err);
      return null;
    }
  }

  escapeHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Detects if HTML contains paywall indicators
   * @param {string} html - HTML content to check
   * @returns {boolean} - True if paywall detected
   */
  hasPaywall(html) {
    if (!html || typeof html !== 'string') {
      return false;
    }

    const htmlLower = html.toLowerCase();
    
    const paywallIndicators = [
      'subscribe to the times',
      "you've reached your article limit",
      'log in or create a free account',
      'continue reading',
      'data-testid="paywall"',
      'class="paywall"',
      'id="paywall"',
      'data-module="paywall"',
      'article limit reached',
      'subscribe now',
      'become a subscriber'
    ];

    return paywallIndicators.some(indicator => htmlLower.includes(indicator.toLowerCase()));
  }

  /**
   * Sets minimum content length for validation
   * @param {number} length - Minimum character length
   */
  setMinContentLength(length) {
    if (typeof length !== 'number' || length < 0) {
      throw new Error('Invalid content length');
    }
    this.minContentLength = length;
  }
}

module.exports = ContentProcessor;

