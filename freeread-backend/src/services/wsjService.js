const ArchiveService = require('./archiveService');
const CookieService = require('./cookieService');
const SearchEngineService = require('./searchEngineService');
const HeadlessService = require('./headlessService');

/**
 * WSJ Service - Handles Wall Street Journal article fetching
 * Tries multiple methods: cookie clearing -> search engine -> headless -> archive
 * WSJ has hard paywall, but we try all methods for recent articles
 */
class WSJService {
  constructor() {
    this.archiveService = new ArchiveService();
    this.cookieService = new CookieService();
    this.searchEngineService = new SearchEngineService();
    this.headlessService = new HeadlessService();
  }

  /**
   * Fetches article from WSJ
   * Tries multiple methods to bypass WSJ's hard paywall
   * 
   * @param {string} url - WSJ article URL
   * @param {object} options - Fetch options
   * @returns {Promise<string>} - HTML content
   * @throws {Error} - If all methods fail
   */
  async fetchArticle(url, options = {}) {
    // Try multiple methods in order of likelihood
    const methods = [
      { name: 'cookie-clearing', fn: () => this.tryCookieClearing(url, options) },
      { name: 'search-engine', fn: () => this.trySearchEngine(url, options) },
      { name: 'headless', fn: () => this.tryHeadless(url, options) },
      { name: 'archive', fn: () => this.tryArchive(url, options) }
    ];

    let lastError = null;

    for (const method of methods) {
      try {
        const html = await method.fn();
        const isEmpty = !html || typeof html !== 'string' || html.length === 0;
        const jsBlock = html && html.toLowerCase().includes('please enable js');
        const isPaywalled = html && this.hasPaywall(html);

        // If headless produced HTML, return it and let extraction decide
        if (method.name === 'headless' && !isEmpty) {
          return html;
        }

        // For archive, be more lenient - archived content might have paywall indicators
        // but still contain readable content
        if (method.name === 'archive' && !isEmpty && !jsBlock) {
          return html;
        }

        if (!isEmpty && !jsBlock && !isPaywalled) {
          return html;
        }

        lastError = new Error(
          isEmpty
            ? `Empty HTML received (method: ${method.name})`
            : jsBlock
              ? `JS rendering required (method: ${method.name})`
              : `Paywall detected (method: ${method.name})`
        );
      } catch (error) {
        lastError = error;
        continue; // Try next method
      }
    }

    // All methods failed
    const errorMsg = lastError?.message || 'All methods failed. WSJ has a hard paywall - try an older article (>6 months) for archive access.';
    throw new Error(`WSJ fetch failed: ${errorMsg}`);
  }

  /**
   * Try cookie clearing method
   * @private
   */
  async tryCookieClearing(url, options) {
    return await this.cookieService.fetchWithClearedCookies(url, options);
  }

  /**
   * Try search engine referrer method
   * @private
   */
  async trySearchEngine(url, options) {
    const result = await this.searchEngineService.fetchWithSearchReferrer(url, options);
    return result.html;
  }

  /**
   * Try headless browser method
   * Tries multiple user agents and strategies
   * @private
   */
  async tryHeadless(url, options) {
    // Try with different user agents
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];

    for (const userAgent of userAgents) {
      try {
        const html = await this.headlessService.fetchRenderedHtml(url, {
          ...options,
          userAgent: userAgent,
          timeout: 45000
        });
        
        if (html && html.length > 1000) {
          return html;
        }
      } catch (error) {
        // Try next user agent
        continue;
      }
    }

    // If all user agents failed, try one more time with default
    return await this.headlessService.fetchRenderedHtml(url, {
      ...options,
      timeout: 45000
    });
  }

  /**
   * Try archive method (for older articles)
   * @private
   */
  async tryArchive(url, options) {
    const archiveResult = await this.archiveService.fetchFromArchive(url, {
      preferOlder: true // WSJ blocks new archiving, older articles more likely
    });

    if (archiveResult && archiveResult.html) {
      return archiveResult.html;
    }

    throw new Error('Article not available in archive');
  }

  /**
   * Checks if HTML contains paywall indicators
   * @param {string} html - HTML content to check
   * @returns {boolean} - True if paywall detected
   */
  hasPaywall(html) {
    return this.cookieService.hasPaywall(html);
  }
}

module.exports = WSJService;
