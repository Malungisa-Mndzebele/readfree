/**
 * Debug Service - Helper for debugging content extraction issues
 * Can be used to inspect HTML before extraction
 */

const fs = require('fs');
const path = require('path');

class DebugService {
  constructor() {
    this.debugMode = process.env.DEBUG === 'true';
    this.debugDir = path.join(__dirname, '../../debug');
    
    if (this.debugMode && !fs.existsSync(this.debugDir)) {
      fs.mkdirSync(this.debugDir, { recursive: true });
    }
  }

  /**
   * Save HTML to file for inspection
   * @param {string} html - HTML content
   * @param {string} url - Original URL
   * @param {string} stage - Stage name (fetch, before-extraction, etc.)
   */
  saveHtml(html, url, stage = 'debug') {
    if (!this.debugMode) return;

    try {
      const domain = new URL(url).hostname.replace(/\./g, '_');
      const filename = `${domain}_${stage}_${Date.now()}.html`;
      const filepath = path.join(this.debugDir, filename);
      
      fs.writeFileSync(filepath, html, 'utf8');
      console.log(`[DEBUG] Saved HTML to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('[DEBUG] Failed to save HTML:', error.message);
    }
  }

  /**
   * Check for common issues in HTML
   * @param {string} html - HTML content
   * @returns {object} - Issues found
   */
  analyzeHtml(html) {
    const issues = {
      hasPaywall: false,
      hasContent: false,
      contentLength: 0,
      hasArticleTag: false,
      paywallIndicators: [],
      suggestions: []
    };

    if (!html || typeof html !== 'string') {
      issues.suggestions.push('HTML is empty or invalid');
      return issues;
    }

    const htmlLower = html.toLowerCase();
    issues.contentLength = html.length;

    // Check for article tag
    issues.hasArticleTag = htmlLower.includes('<article');

    // Check for content
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    issues.hasContent = textContent.length > 500;

    // Check for paywall indicators
    const paywallPatterns = [
      'subscribe to the times',
      "you've reached your article limit",
      'log in or create a free account',
      'continue reading',
      'data-testid="paywall"',
      'class="paywall"',
      'id="paywall"'
    ];

    paywallPatterns.forEach(pattern => {
      if (htmlLower.includes(pattern)) {
        issues.hasPaywall = true;
        issues.paywallIndicators.push(pattern);
      }
    });

    // Generate suggestions
    if (issues.hasPaywall) {
      issues.suggestions.push('Paywall detected - cookie clearing may not have worked');
      issues.suggestions.push('Try search referrer method instead');
    }

    if (!issues.hasArticleTag) {
      issues.suggestions.push('No <article> tag found - may need different extraction strategy');
    }

    if (!issues.hasContent) {
      issues.suggestions.push('Content too short - may be blocked or JavaScript-rendered');
    }

    return issues;
  }

  /**
   * Print analysis to console
   * @param {object} analysis - Analysis result from analyzeHtml
   */
  printAnalysis(analysis) {
    console.log('\n[DEBUG] HTML Analysis:');
    console.log('  Content Length:', analysis.contentLength, 'chars');
    console.log('  Has Article Tag:', analysis.hasArticleTag);
    console.log('  Has Content:', analysis.hasContent);
    console.log('  Paywall Detected:', analysis.hasPaywall);
    
    if (analysis.paywallIndicators.length > 0) {
      console.log('  Paywall Indicators:', analysis.paywallIndicators.join(', '));
    }

    if (analysis.suggestions.length > 0) {
      console.log('  Suggestions:');
      analysis.suggestions.forEach(s => console.log('    -', s));
    }
    console.log('');
  }
}

module.exports = DebugService;

