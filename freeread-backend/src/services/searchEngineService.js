const axios = require('axios');
const { getDomain } = require('../utils/urlUtils');

/**
 * Search Engine Service - Fetches content by pretending to be a search engine crawler
 * Many sites (including NYT) allow search engines to access full content
 * This mimics Googlebot to bypass metered paywalls
 */
class SearchEngineService {
  /**
   * Fetches content with search engine referrer
   * Simulates arriving from Google search results
   * 
   * @param {string} url - URL to fetch
   * @param {object} options - Options (timeout, etc.)
   * @returns {Promise<object>} - HTML content with metadata
   */
  async fetchWithSearchReferrer(url, options = {}) {
    const domain = getDomain(url);
    
    if (!domain) {
      throw new Error('Invalid URL: cannot extract domain');
    }

    // Create axios instance with search engine headers
    const client = axios.create({
      timeout: options.timeout || 10000,
      withCredentials: false, // Don't send cookies
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Referer': `https://www.google.com/search?q=site:${domain}`,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Cache-Control': 'max-age=0'
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 500
    });

    try {
      const response = await client.get(url);
      
      return {
        html: response.data,
        source: 'search-engine',
        statusCode: response.status
      };
    } catch (error) {
      if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.message}`);
      } else if (error.request) {
        throw new Error(`Network error: ${error.message}`);
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }
}

module.exports = SearchEngineService;

