const express = require('express');
const router = express.Router();
const NYTimesService = require('../services/nytimesService');
const WSJService = require('../services/wsjService');
const ContentProcessor = require('../services/contentProcessor');
const { isValidUrl, isNYTimes, isWSJ } = require('../utils/urlUtils');

const nytimesService = new NYTimesService();
const wsjService = new WSJService();
const contentProcessor = new ContentProcessor();

/**
 * POST /api/fetch
 * Fetches and extracts article content from paywalled sites
 * 
 * Request body:
 * {
 *   "url": "https://www.nytimes.com/article"
 * }
 * 
 * Response (success):
 * {
 *   "success": true,
 *   "method": "cookie-clearing",
 *   "content": { ... },
 *   "metadata": { ... }
 * }
 * 
 * Response (error):
 * {
 *   "success": false,
 *   "error": { ... }
 * }
 */
router.post('/fetch', async (req, res) => {
  const { url } = req.body;

  // Validate URL
  if (!url) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_URL',
        message: 'URL is required'
      }
    });
  }

  if (!isValidUrl(url)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_URL',
        message: 'Invalid URL format'
      }
    });
  }

  try {
    let html;
    let method = 'unknown';
    let serviceName = 'unknown';

    // Route to appropriate service based on domain
    if (isNYTimes(url)) {
      serviceName = 'NYT';
      method = 'cookie-clearing';
      try {
        html = await nytimesService.fetchArticle(url);
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: error.message || 'Failed to fetch NYT article'
          }
        });
      }
    } else if (isWSJ(url)) {
      serviceName = 'WSJ';
      method = 'archive';
      try {
        html = await wsjService.fetchArticle(url);
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: error.message || 'Failed to fetch WSJ article. WSJ has a hard paywall - only older articles (>6 months) are available via archive.',
            details: {
              site: 'WSJ',
              suggestion: 'Try an article older than 6 months, or check Wayback Machine directly'
            }
          }
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'UNSUPPORTED_SITE',
          message: 'Unsupported site. Currently supports NYT and WSJ only.'
        }
      });
    }

    // Extract content
    let content;
    try {
      content = await contentProcessor.extractContent(html, url);
    } catch (error) {
      // Provide more detailed error information
      const errorMessage = error.message || 'Failed to extract content';
      const isPaywallError = errorMessage.includes('Paywall detected');
      
      return res.status(500).json({
        success: false,
        error: {
          code: isPaywallError ? 'PAYWALL_DETECTED' : 'EXTRACTION_FAILED',
          message: errorMessage,
          details: {
            htmlLength: html ? html.length : 0,
            suggestion: isPaywallError 
              ? 'Cookie clearing may not have worked. Try search referrer method.'
              : 'Content may be too short or Readability failed to parse HTML structure.'
          }
        }
      });
    }

    // Return successful response
    res.json({
      success: true,
      method: method,
      content: content,
      metadata: {
        originalUrl: url,
        source: 'direct',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    // Unexpected errors
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred'
      }
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

