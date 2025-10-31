/**
 * URL validation and normalization utilities
 */

/**
 * Validates if a string is a valid URL
 * @param {string} url - URL string to validate
 * @returns {boolean} - True if valid URL
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * Extracts domain from URL
 * @param {string} url - URL string
 * @returns {string|null} - Domain name or null if invalid
 */
function getDomain(url) {
  if (!isValidUrl(url)) {
    return null;
  }

  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

/**
 * Normalizes URL (adds https if missing, removes fragments)
 * @param {string} url - URL to normalize
 * @returns {string} - Normalized URL
 */
function normalizeUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL input');
  }

  try {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const urlObj = new URL(url);
    
    // Remove fragment
    urlObj.hash = '';
    
    return urlObj.toString();
  } catch (e) {
    throw new Error(`Failed to normalize URL: ${e.message}`);
  }
}

/**
 * Detects if URL is from NYTimes
 * @param {string} url - URL to check
 * @returns {boolean} - True if NYTimes URL
 */
function isNYTimes(url) {
  const domain = getDomain(url);
  return domain !== null && domain.includes('nytimes.com');
}

/**
 * Detects if URL is from Wall Street Journal
 * @param {string} url - URL to check
 * @returns {boolean} - True if WSJ URL
 */
function isWSJ(url) {
  const domain = getDomain(url);
  return domain !== null && domain.includes('wsj.com');
}

module.exports = {
  isValidUrl,
  getDomain,
  normalizeUrl,
  isNYTimes,
  isWSJ
};

