const CookieService = require('./cookieService');
const SearchEngineService = require('./searchEngineService');
const HeadlessService = require('./headlessService');

/**
 * NYTimes Service - Handles NYTimes-specific article fetching
 * Uses multiple methods to bypass NYT's paywall
 */
class NYTimesService {
  constructor() {
    this.cookieService = new CookieService();
    this.searchEngineService = new SearchEngineService();
    this.headlessService = new HeadlessService();
  }

  /**
   * Fetches article from NYTimes with paywall bypass
   * Tries multiple methods: cookie clearing -> search engine referrer
   * 
   * @param {string} url - NYT article URL
   * @param {object} options - Fetch options (timeout, userAgent, etc.)
   * @returns {Promise<string>} - HTML content of article
   * @throws {Error} - If all methods fail or paywall detected
   */
  async fetchArticle(url, options = {}) {
    const methods = [
      { name: 'cookie-clearing', fn: () => this.tryCookieClearing(url, options) },
      { name: 'search-engine', fn: () => this.trySearchEngine(url, options) },
      { name: 'headless', fn: () => this.tryHeadless(url, options) }
    ];

    let lastError = null;

    for (const method of methods) {
      try {
        const html = await method.fn();
        const isEmpty = !html || typeof html !== 'string' || html.length === 0;
        const jsBlock = html && html.toLowerCase().includes('please enable js');
        const isPaywalled = html && this.hasPaywall(html);

        // If headless produced HTML, return it and let extraction decide.
        if (method.name === 'headless' && !isEmpty) {
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
    throw new Error(`NYT fetch failed: ${lastError?.message || 'All methods failed'}`);
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
   * @private
   */
  async tryHeadless(url, options) {
    return await this.headlessService.fetchRenderedHtml(url, options);
  }

  /**
   * Checks if HTML contains paywall indicators
   * Delegates to CookieService but allows for NYT-specific checks
   * @param {string} html - HTML content to check
   * @returns {boolean} - True if paywall detected
   */
  hasPaywall(html) {
    return this.cookieService.hasPaywall(html);
  }
}

module.exports = NYTimesService;

