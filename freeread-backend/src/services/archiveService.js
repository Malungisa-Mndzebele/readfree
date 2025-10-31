const axios = require('axios');
const { getDomain } = require('../utils/urlUtils');

/**
 * Archive Service - Fetches content from Wayback Machine (Archive.org)
 * Primary method for WSJ articles and fallback for NYT old articles
 */
class ArchiveService {
  constructor() {
    this.cdxApiBase = 'https://web.archive.org/cdx/search/cdx';
    this.archiveBase = 'https://web.archive.org/web';
  }

  /**
   * Gets available timestamps for a URL from Wayback Machine
   * @param {string} url - URL to check
   * @param {number} limit - Maximum number of timestamps to return
   * @returns {Promise<Array<string>>} - Array of timestamps (YYYYMMDDHHmmss format)
   */
  async getAvailableTimestamps(url, limit = 10) {
    try {
      const encodedUrl = encodeURIComponent(url);
      const cdxUrl = `${this.cdxApiBase}?url=${encodedUrl}&output=json&limit=${limit}&collapse=timestamp:8`;

      const response = await axios.get(cdxUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'FreeRead/1.0'
        }
      });

      // CDX API returns array of arrays
      // First row is headers: ['urlkey', 'timestamp', 'original', ...]
      // Subsequent rows are data
      const data = response.data;

      if (!Array.isArray(data) || data.length <= 1) {
        return []; // No archives found
      }

      // Extract timestamps (second column, index 1)
      // Skip header row (index 0)
      const timestamps = [];
      for (let i = 1; i < data.length && timestamps.length < limit; i++) {
        if (data[i] && data[i][1]) {
          timestamps.push(data[i][1]);
        }
      }

      return timestamps;
    } catch (error) {
      throw new Error(`Failed to fetch archive timestamps: ${error.message}`);
    }
  }

  /**
   * Fetches archived content from Wayback Machine
   * Tries multiple timestamps until one succeeds
   * 
   * @param {string} url - Original URL
   * @param {object} options - Options
   * @param {boolean} options.preferOlder - Prefer older timestamps (for WSJ)
   * @returns {Promise<object|null>} - {html, timestamp, source} or null if not found
   */
  async fetchFromArchive(url, options = {}) {
    try {
      // Get available timestamps
      const timestamps = await this.getAvailableTimestamps(url, 10);

      if (timestamps.length === 0) {
        return null; // No archives available
      }

      // For WSJ, prioritize older timestamps (6+ months)
      // WSJ actively blocks new content archiving
      let timestampsToTry = timestamps;
      if (options.preferOlder) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const cutoffTimestamp = sixMonthsAgo.toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);

        // Sort: older first
        timestampsToTry = timestamps
          .filter(ts => ts < cutoffTimestamp)
          .sort()
          .reverse(); // Most recent older timestamp first
      } else {
        // For other sites, prefer more recent
        timestampsToTry = timestamps.reverse();
      }

      // Try each timestamp until we get valid content
      for (const timestamp of timestampsToTry) {
        try {
          const archiveUrl = `${this.archiveBase}/${timestamp}/${url}`;
          
          const response = await axios.get(archiveUrl, {
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; archive.org_bot +http://www.archive.org/details/archive.org_bot)',
              'Accept': 'text/html,application/xhtml+xml'
            },
            maxRedirects: 5,
            validateStatus: (status) => status < 500
          });

          // Check if we got valid HTML (not an error page)
          if (response.data && 
              typeof response.data === 'string' && 
              response.data.length > 1000 && // Must have substantial content
              !response.data.includes('Wayback Machine doesn\'t have that page archived')) {
            return {
              html: response.data,
              timestamp: timestamp,
              source: 'archive'
            };
          }
        } catch (error) {
          // This timestamp failed, try next one
          continue;
        }
      }

      // All timestamps failed
      return null;
    } catch (error) {
      throw new Error(`Archive fetch failed: ${error.message}`);
    }
  }
}

module.exports = ArchiveService;

