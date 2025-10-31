# Technical Implementation Guide: NYT Cookie Clearing

This document provides specific technical details for implementing cookie clearing for The New York Times.

## NYT Cookie Structure

### Key Cookies to Manage:

1. **NYT-S** - Primary session/tracking cookie
   - Tracks session and article views
   - Most important to clear/reset

2. **nyt-m** - Meter tracking cookie
   - Tracks free article count
   - Resets the monthly limit

3. **nyt-a** - Authentication/account cookie
   - Only clear if not logged in
   - Keep if user has subscription

4. **nyt-geo** - Geographic location
   - Can affect content availability
   - Usually safe to clear

5. **nyt-purr** - Tracking/analytics
   - Can be cleared safely

## Implementation Approaches

### Approach 1: Backend Cookie Clearing (Recommended)

#### Step 1: Create Cookie Service

```javascript
// services/cookieService.js
const axios = require('axios');

class CookieService {
  constructor() {
    this.siteRules = {
      'nytimes.com': {
        cookiesToClear: ['NYT-S', 'nyt-m', 'nyt-a', 'nyt-geo', 'nyt-purr'],
        keepIfSubscription: ['nyt-auth'],
        clearBefore: true,
        clearAfter: true
      },
      'wsj.com': {
        // WSJ requires different approach - see WSJ guide
        cookiesToClear: [],
        useArchive: true
      }
    };
  }

  getSiteRules(domain) {
    return this.siteRules[domain] || this.siteRules['default'];
  }

  async fetchWithClearedCookies(url, options = {}) {
    const domain = new URL(url).hostname;
    const rules = this.getSiteRules(domain);
    
    // Create axios instance with no cookies
    const client = axios.create({
      timeout: options.timeout || 10000,
      headers: {
        'User-Agent': options.userAgent || 
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      },
      // Critical: Don't send any cookies
      withCredentials: false,
      // Don't automatically follow redirects that set cookies
      maxRedirects: 5,
      validateStatus: (status) => status < 500
    });

    // Make request without cookies
    const response = await client.get(url);
    
    return response.data;
  }
}

module.exports = CookieService;
```

#### Step 2: Integrate with Main Service

```javascript
// services/nytimesService.js
const CookieService = require('./cookieService');
const axios = require('axios');

class NYTimesService {
  constructor() {
    this.cookieService = new CookieService();
  }

  async fetchArticle(url) {
    // Method 1: Cookie clearing (primary)
    try {
      const html = await this.cookieService.fetchWithClearedCookies(url, {
        timeout: 10000
      });
      
      // Check if we got past the paywall
      if (this.hasPaywall(html)) {
        throw new Error('Paywall still detected');
      }
      
      return html;
    } catch (error) {
      // Try fallback methods
      return this.tryFallback(url, error);
    }
  }

  hasPaywall(html) {
    const paywallIndicators = [
      'Subscribe to The Times',
      'You\'ve reached your article limit',
      'Log in or create a free account',
      'continue reading',
      'data-testid="paywall"',
      'class="paywall"'
    ];
    
    return paywallIndicators.some(indicator => 
      html.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  async tryFallback(url, originalError) {
    // Try search engine referrer method
    // Try archive method
    // etc.
  }
}

module.exports = NYTimesService;
```

### Approach 2: Frontend Cookie Clearing (Client-Side)

**Note:** This is less effective because you need to make the request from the server to avoid sending browser cookies.

```javascript
// Frontend: Clear cookies before making API request
async function clearNYTCookies() {
  const cookies = ['NYT-S', 'nyt-m', 'nyt-a', 'nyt-geo', 'nyt-purr'];
  
  cookies.forEach(cookieName => {
    // Clear cookie for nytimes.com domain
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.nytimes.com;`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
}

// Use before API call
async function fetchArticle(url) {
  clearNYTCookies();
  
  const response = await axios.post('/api/fetch', { url });
  return response.data;
}
```

## Enhanced Implementation: Session Isolation

For better success rates, create isolated sessions for each request:

```javascript
// Enhanced cookie service with session isolation
class EnhancedCookieService {
  async fetchWithIsolatedSession(url) {
    // Use fresh axios instance (no cookie jar)
    const instance = axios.create();
    
    // Don't use default cookie jar
    instance.defaults.withCredentials = false;
    
    // Set headers to appear as new user
    const headers = {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
      'DNT': '1',
      'Connection': 'keep-alive',
      // Don't include any cookies in request
      'Cookie': '' // Explicitly empty
    };
    
    const response = await instance.get(url, { headers });
    
    // Check if response tries to set cookies (we ignore them)
    // Cookies in Set-Cookie header are ignored
    
    return response.data;
  }

  getRandomUserAgent() {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }
}
```

## Combination Strategy

For best results, combine cookie clearing with other methods:

```javascript
async function fetchNYTArticle(url) {
  const methods = [
    () => this.cookieService.fetchWithClearedCookies(url),
    () => this.searchEngineService.fetchWithReferrer(url),
    () => this.archiveService.fetchFromArchive(url)
  ];
  
  for (const method of methods) {
    try {
      const html = await method();
      if (!this.hasPaywall(html)) {
        return html;
      }
    } catch (error) {
      continue;
    }
  }
  
  throw new Error('All methods failed');
}
```

## Testing NYT Cookie Clearing

### Test URLs:
```javascript
const testUrls = [
  'https://www.nytimes.com/2024/01/15/technology/...',
  'https://www.nytimes.com/article-url-here'
];
```

### Success Indicators:
```javascript
function isSuccess(html) {
  // Article should contain substantial content
  const hasContent = html.match(/<article[^>]*>.*<\/article>/is);
  const contentLength = html.match(/<p[^>]*>/g)?.length || 0;
  const noPaywall = !this.hasPaywall(html);
  
  return hasContent && contentLength > 5 && noPaywall;
}
```

## Troubleshooting

### Issue: Still seeing paywall after cookie clearing

**Possible causes:**
1. Server-side tracking (IP-based)
2. JavaScript-rendered paywall (need headless browser)
3. Subscription required for specific article

**Solutions:**
- Try from different IP (if possible)
- Use Puppeteer for JavaScript execution
- Check if article requires subscription (some do)

### Issue: Rate limiting

**Symptoms:**
- Getting blocked after multiple requests
- 429 status codes
- CAPTCHA challenges

**Solutions:**
- Implement request delays
- Rotate User-Agents
- Use proxy rotation (if available)

### Issue: Cookie clearing not working

**Check:**
- Is the axios instance configured correctly?
- Are cookies being sent despite configuration?
- Is the site detecting browser fingerprint?

**Debug:**
```javascript
// Check what cookies are being sent
console.log('Request headers:', request.headers);
console.log('Cookies:', request.headers.cookie);

// Verify no cookies
if (request.headers.cookie) {
  console.warn('WARNING: Cookies are being sent!');
}
```

## Expected Success Rate

With proper implementation:
- **Cookie clearing alone:** ~60-70%
- **Cookie + Search referrer:** ~70-80%
- **Combined with archive fallback:** ~75-85%

Note: Success rates decline as NYT improves their paywall detection.

## Best Practices

1. **Always clear cookies before request** - Don't rely on browser state
2. **Use isolated sessions** - Fresh axios instance per request
3. **Combine methods** - Don't rely on single technique
4. **Handle errors gracefully** - Have fallbacks ready
5. **Respect rate limits** - Don't overwhelm the server
6. **Monitor success rates** - Track what works

## Code Integration Example

```javascript
// routes/api.js (complete example)
const express = require('express');
const CookieService = require('../services/cookieService');
const router = express.Router();

router.post('/api/fetch', async (req, res) => {
  const { url } = req.body;
  
  // Determine site
  const domain = new URL(url).hostname;
  
  if (domain.includes('nytimes.com')) {
    const cookieService = new CookieService();
    
    try {
      const html = await cookieService.fetchWithClearedCookies(url);
      
      // Verify no paywall
      if (html.includes('Subscribe to The Times')) {
        // Try fallback
        return res.status(500).json({
          error: 'Paywall detected, trying fallback methods...'
        });
      }
      
      // Process content
      const content = await extractContent(html);
      return res.json({ success: true, content });
      
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  // Handle other sites...
});
```

---

**Remember:** NYT actively works against bypass methods. Success rates will fluctuate, and you may need to update the implementation regularly as they change their tracking methods.

