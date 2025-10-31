const ArchiveService = require('./archiveService');
const CookieService = require('./cookieService');

/**
 * WSJ Service - Handles Wall Street Journal article fetching
 * Primary method: Wayback Machine (only realistic method for WSJ)
 */
class WSJService {
  constructor() {
    this.archiveService = new ArchiveService();
    this.cookieService = new CookieService();
  }

  /**
   * Fetches article from WSJ
   * WSJ has hard paywall - only Wayback Machine works reliably
   * 
   * @param {string} url - WSJ article URL
   * @param {object} options - Fetch options
   * @returns {Promise<string>} - HTML content
   * @throws {Error} - If fetch fails
   */
  async fetchArticle(url, options = {}) {
    try {
      // Primary method: Wayback Machine (only realistic method for WSJ)
      const archiveResult = await this.archiveService.fetchFromArchive(url, {
        preferOlder: true // WSJ blocks new archiving, older articles more likely
      });

      if (archiveResult && archiveResult.html) {
        // Check for paywall in archived content
        if (!this.cookieService.hasPaywall(archiveResult.html)) {
          return archiveResult.html;
        }
      }

      // Archive not available or still has paywall
      throw new Error('WSJ article not available in archive or paywall detected. WSJ actively blocks new content archiving - only older articles (>6 months) are typically available.');
    } catch (error) {
      throw new Error(`WSJ fetch failed: ${error.message}`);
    }
  }
}

module.exports = WSJService;

