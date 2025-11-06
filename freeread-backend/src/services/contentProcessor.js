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
        const fallback = this.extractWithFallback(document, url);
        
        // Return fallback if it has any text at all
        if (fallback && fallback.text && fallback.text.length > 0) {
          return fallback;
        }

        // Try aggressive extraction - extract content even if paywall is detected
        const aggressiveExtract = this.extractAggressively(document, url);
        if (aggressiveExtract && aggressiveExtract.text && aggressiveExtract.text.length > this.minContentLength) {
          return aggressiveExtract;
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
   * Fallback extraction using common article selectors (works for NYT, WSJ, and other sites)
   * @param {Document} document
   * @param {string} url - Original article URL (for domain detection)
   * @returns {{title:string, text:string, html:string, author:string|null, excerpt:string|null, length:number}|null}
   */
  extractWithFallback(document, url) {
    try {
      // Get domain from URL for fallback title
      let fallbackTitle = 'Untitled';
      try {
        if (url) {
          const urlObj = new URL(url);
          fallbackTitle = urlObj.hostname;
        }
      } catch (e) {
        // URL parsing failed, use default
      }

      const title = (document.querySelector('h1') && document.querySelector('h1').textContent) || 
                    (document.querySelector('title') && document.querySelector('title').textContent) || 
                    fallbackTitle;
      
      // Common article selectors (works for NYT, WSJ, and other news sites)
      const candidates = [
        'article',
        '[data-testid="article-body"]',
        'section[name="articleBody"]',
        '#site-content article',
        'main article',
        '[itemprop="articleBody"]',
        '[data-module="ArticleBody"]',
        // WSJ-specific selectors
        '[data-module="ArticleBodyContainer"]',
        '.wsj-article-body',
        '.article-body',
        '[class*="ArticleBody"]',
        '[class*="article-body"]',
        // Generic selectors
        'div[class*="article"]',
        'div[class*="story"]',
        'div[class*="content"]',
        '.content-body',
        '[role="article"]'
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
   * Aggressive extraction - tries to extract content even when paywall is detected
   * Looks for article content in various places, including hidden elements
   * @param {Document} document
   * @param {string} url - Original article URL
   * @returns {{title:string, text:string, html:string, author:string|null, excerpt:string|null, length:number}|null}
   */
  extractAggressively(document, url) {
    try {
      // Get title
      const title = (document.querySelector('h1') && document.querySelector('h1').textContent) || 
                    (document.querySelector('title') && document.querySelector('title').textContent) || 
                    'Untitled';

      // Try to find article content in various ways
      const contentSelectors = [
        'article',
        '[data-module="ArticleBody"]',
        '[data-module="ArticleBodyContainer"]',
        '.wsj-article-body',
        '.article-body',
        '[class*="article-body"]',
        '[class*="ArticleBody"]',
        'main article',
        'main [role="article"]',
        '#article-body',
        '.article-content',
        '[itemprop="articleBody"]'
      ];

      let allText = '';
      let allHtml = '';

      // Try each selector
      for (const selector of contentSelectors) {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el) {
              // Get all paragraphs from this element
              const paras = el.querySelectorAll('p');
              paras.forEach(p => {
                const text = (p.textContent || '').trim();
                if (text.length > 50 && !text.toLowerCase().includes('subscribe') && !text.toLowerCase().includes('cookie')) {
                  allText += text + '\n\n';
                  allHtml += p.outerHTML;
                }
              });
            }
          });
        } catch (e) {}
      }

      // If we didn't find much, try to get all paragraphs from the page
      if (allText.length < 200) {
        try {
          const allParas = document.querySelectorAll('p');
          allParas.forEach(p => {
            const text = (p.textContent || '').trim();
            // Filter out navigation, footer, and paywall text
            if (text.length > 50 && 
                !text.toLowerCase().includes('subscribe') && 
                !text.toLowerCase().includes('cookie') &&
                !text.toLowerCase().includes('log in') &&
                !text.toLowerCase().includes('sign up') &&
                !p.closest('nav') &&
                !p.closest('footer') &&
                !p.closest('[class*="paywall"]')) {
              allText += text + '\n\n';
              allHtml += p.outerHTML;
            }
          });
        } catch (e) {}
      }

      if (allText.length < this.minContentLength) {
        return null;
      }

      const author = (document.querySelector('[rel="author"], [itemprop="author"], .byline') &&
        (document.querySelector('[rel="author"], [itemprop="author"], .byline').textContent || '').trim()) || null;
      
      const excerpt = (document.querySelector('meta[name="description"], meta[property="og:description"]') &&
        document.querySelector('meta[name="description"], meta[property="og:description"]').getAttribute('content')) || null;

      return {
        title: title.trim(),
        text: allText.trim(),
        html: '<div id="readability-page-1" class="page">' + allHtml + '</div>',
        author: author,
        excerpt: excerpt,
        length: allText.trim().length
      };
    } catch (err) {
      console.error('Aggressive extraction error:', err);
      return null;
    }
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
      // NYT-specific
      'subscribe to the times',
      "you've reached your article limit",
      'log in or create a free account',
      // WSJ-specific
      'subscribe to continue reading',
      'subscribe to wsj',
      'wall street journal subscription',
      'wsj.com subscription',
      'log in to continue reading',
      'sign in to continue',
      'this article is for subscribers only',
      // Generic paywall indicators
      'continue reading',
      'data-testid="paywall"',
      'class="paywall"',
      'id="paywall"',
      'data-module="paywall"',
      'article limit reached',
      'subscribe now',
      'become a subscriber',
      'subscribe to read',
      'subscription required',
      'premium content'
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

