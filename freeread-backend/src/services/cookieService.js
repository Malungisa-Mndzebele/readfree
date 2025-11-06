const axios = require('axios');

/**
 * Cookie Service - Handles fetching content with cleared/no cookies
 * Primary method for bypassing metered paywalls like NYT
 */
class CookieService {
  constructor() {
    // Site-specific rules for cookie management
    this.siteRules = {
      'nytimes.com': {
        cookiesToClear: ['NYT-S', 'nyt-m', 'nyt-a', 'nyt-geo', 'nyt-purr'],
        keepIfSubscription: ['nyt-auth'],
        clearBefore: true,
        clearAfter: true
      },
      'wsj.com': {
        cookiesToClear: [],
        useArchive: true // WSJ requires different approach
      },
      'default': {
        cookiesToClear: [],
        clearBefore: true,
        clearAfter: false
      }
    };
  }

  /**
   * Get site-specific rules for cookie handling
   * @param {string} domain - Domain name (e.g., 'nytimes.com')
   * @returns {object} - Site rules
   */
  getSiteRules(domain) {
    // Check exact match first
    if (this.siteRules[domain]) {
      return this.siteRules[domain];
    }

    // Check if domain contains any known site
    for (const [siteDomain, rules] of Object.entries(this.siteRules)) {
      if (domain.includes(siteDomain) || siteDomain.includes(domain)) {
        return rules;
      }
    }

    return this.siteRules['default'];
  }

  /**
   * Fetches content from URL without sending any cookies
   * This is the primary method for bypassing cookie-based paywalls
   * 
   * @param {string} url - URL to fetch
   * @param {object} options - Options (timeout, userAgent, etc.)
   * @returns {Promise<string>} - HTML content
   */
  async fetchWithClearedCookies(url, options = {}) {
    // CRITICAL: Create fresh axios instance with NO cookies
    const client = axios.create({
      timeout: options.timeout || 10000,
      withCredentials: false, // Don't send any cookies
      headers: {
        'User-Agent': options.userAgent || 
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
        // Explicitly NO Cookie header
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 500 // Accept 4xx but not 5xx
    });

    try {
      const response = await client.get(url);
      return response.data;
    } catch (error) {
      // Re-throw with more context
      if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.message}`);
      } else if (error.request) {
        throw new Error(`Network error: ${error.message}`);
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }

  /**
   * Detects if HTML content contains paywall indicators
   * @param {string} html - HTML content to check
   * @returns {boolean} - True if paywall detected
   */
  hasPaywall(html) {
    if (!html || typeof html !== 'string') {
      return false;
    }

    const htmlLower = html.toLowerCase();
    
    // Common paywall indicators
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

    // Bot protection / CAPTCHA indicators
    const botProtectionIndicators = [
      'please enable js',
      'captcha-delivery.com',
      'cf-browser-verification',
      'checking your browser',
      'just a moment',
      'ddos protection',
      'cloudflare',
      'geo.captcha-delivery.com',
      'ct.captcha-delivery.com',
      'browser verification',
      'verify you are human'
    ];

    // Check for bot protection first (this blocks access entirely)
    if (botProtectionIndicators.some(indicator => htmlLower.includes(indicator.toLowerCase()))) {
      return true; // Treat as paywall since content is blocked
    }

    return paywallIndicators.some(indicator => htmlLower.includes(indicator.toLowerCase()));
  }
}

module.exports = CookieService;

