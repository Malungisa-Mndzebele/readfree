# Quick Start Guide

This guide will help you get started with implementing the FreeRead MVP.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Basic knowledge of JavaScript/Node.js
- Git (optional)

## Priority: NYT First Approach

**Follow this order:**
1. Set up project (5 minutes)
2. Implement NYT cookie clearing (Week 1 focus)
3. Add search referrer for NYT (Week 2)
4. Add WSJ archive support (Week 3, with realistic expectations)

## Project Setup

### 1. Initialize Project Structure

```bash
# Create project directories
mkdir freeread-frontend freeread-backend
cd freeread-backend
npm init -y
cd ../freeread-frontend
npm init -y
```

### 2. Install Backend Dependencies (Priority)

```bash
cd freeread-backend
npm install express axios cheerio @mozilla/readability jsdom cors express-validator
npm install -D nodemon dotenv
```

### 3. Install Frontend Dependencies

```bash
cd freeread-frontend
npm install axios
npm install -D vite
```

Or for React version:
```bash
npm install axios
npm install -D vite @vitejs/plugin-react react react-dom
```

### 4. Create Basic File Structure

```
FreeRead/
├── freeread-frontend/
│   ├── index.html
│   ├── src/
│   │   ├── main.js
│   │   └── services/
│   │       └── api.js
│   ├── package.json
│   └── vite.config.js
├── freeread-backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── routes/
│   │   │   └── api.js
│   │   ├── services/
│   │   │   ├── cookieService.js      # WEEK 1 PRIORITY
│   │   │   ├── nytimesService.js    # WEEK 1 PRIORITY
│   │   │   ├── searchEngineService.js
│   │   │   └── archiveService.js
│   │   └── utils/
│   ├── package.json
│   └── .env
└── docs/
```

## Week 1: Critical Path (NYT Cookie Clearing)

### Step 1: Basic Express Server

Create `freeread-backend/src/app.js`:

```javascript
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 2: NYT Cookie Service (CRITICAL - Start Here)

Create `freeread-backend/src/services/cookieService.js`:

```javascript
const axios = require('axios');

class CookieService {
  async fetchWithClearedCookies(url, options = {}) {
    // CRITICAL: Create fresh instance with NO cookies
    const client = axios.create({
      timeout: options.timeout || 10000,
      withCredentials: false, // Don't send cookies
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      maxRedirects: 5
    });

    // Make request - no cookies will be sent
    const response = await client.get(url);
    return response.data;
  }

  hasPaywall(html) {
    const paywallIndicators = [
      'Subscribe to The Times',
      "You've reached your article limit",
      'Log in or create a free account'
    ];
    
    return paywallIndicators.some(indicator => 
      html.toLowerCase().includes(indicator.toLowerCase())
    );
  }
}

module.exports = CookieService;
```

### Step 3: NYT Service Integration

Create `freeread-backend/src/services/nytimesService.js`:

```javascript
const CookieService = require('./cookieService');

class NYTimesService {
  constructor() {
    this.cookieService = new CookieService();
  }

  async fetchArticle(url) {
    try {
      // Primary method: Cookie clearing
      const html = await this.cookieService.fetchWithClearedCookies(url);
      
      if (this.cookieService.hasPaywall(html)) {
        throw new Error('Paywall detected');
      }
      
      return html;
    } catch (error) {
      throw new Error(`NYT fetch failed: ${error.message}`);
    }
  }
}

module.exports = NYTimesService;
```

### Step 4: API Route

Create `freeread-backend/src/routes/api.js`:

```javascript
const express = require('express');
const router = express.Router();
const NYTimesService = require('../services/nytimesService');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');

router.post('/fetch', async (req, res) => {
  const { url } = req.body;
  
  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const domain = new URL(url).hostname;
  
  try {
    let html;
    
    // NYT-specific handling
    if (domain.includes('nytimes.com')) {
      const nytService = new NYTimesService();
      html = await nytService.fetchArticle(url);
    } else {
      // Generic handling (will expand later)
      return res.status(400).json({ error: 'Unsupported site. NYT support only in MVP.' });
    }
    
    // Extract content with Readability
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    if (!article) {
      return res.status(500).json({ error: 'Failed to extract content' });
    }
    
    res.json({
      success: true,
      method: 'cookie-clearing',
      content: {
        title: article.title,
        text: article.textContent,
        html: article.content,
        author: article.byline
      },
      metadata: {
        originalUrl: url,
        source: 'direct'
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error.message
      }
    });
  }
});

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = router;
```

### Step 5: Test Immediately!

Create `freeread-backend/test-nyt.js`:

```javascript
const NYTimesService = require('./src/services/nytimesService');

async function test() {
  const service = new NYTimesService();
  
  // Test with a real NYT article URL
  const testUrl = 'https://www.nytimes.com/2024/01/15/technology/...'; // Replace with real URL
  
  try {
    const html = await service.fetchArticle(testUrl);
    console.log('✅ Success! Paywall bypassed.');
    console.log('HTML length:', html.length);
    
    // Check for paywall
    const hasPaywall = html.includes('Subscribe to The Times');
    console.log('Paywall detected:', hasPaywall);
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

test();
```

Run: `node test-nyt.js`

## Week 2: Add Search Referrer Method

After cookie clearing works, add search referrer:

```javascript
// In searchEngineService.js
async function fetchWithSearchReferrer(url) {
  const client = axios.create({
    timeout: 10000,
    withCredentials: false,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Referer': 'https://www.google.com/search?q=site:nytimes.com',
      'Accept': 'text/html,application/xhtml+xml',
      // ... other headers
    }
  });
  
  return await client.get(url);
}
```

## Implementation Order

Follow `PRIORITY_IMPLEMENTATION_GUIDE.md` for detailed week-by-week plan.

### Quick Priority List:
1. ✅ **Week 1 Days 3-4:** NYT Cookie Clearing (MOST IMPORTANT)
2. ✅ **Week 1 Day 5:** Test and fix cookie clearing
3. ✅ **Week 2 Days 1-2:** Search Referrer for NYT
4. ✅ **Week 2 Day 3:** Content extraction
5. ⚠️ **Week 3 Day 3:** WSJ Archive (lower priority)

## Testing URLs

### NYT Test Articles:
- Use recent NYT articles from different sections
- Test with articles that should be behind paywall
- Verify cookie clearing works

### WSJ Test Articles (Week 3):
- Use articles older than 6 months (better archive chance)
- Recent articles will likely fail (expected)

## Common Issues & Solutions

### Issue: Cookies still being sent
**Solution:** Verify `withCredentials: false` and fresh axios instance

### Issue: Still seeing paywall
**Check:**
- Are cookies actually cleared? (check network inspector)
- Is paywall detection logic correct?
- Try from different IP (server-side tracking possible)

### Issue: Content extraction fails
**Solution:** Check if Readability can parse the HTML structure

## Next Steps

1. **Complete Week 1:** Get NYT cookie clearing working
2. **Test thoroughly:** 10+ NYT articles
3. **Week 2:** Add search referrer
4. **Week 3:** Add WSJ support (with realistic expectations)

See `PRIORITY_IMPLEMENTATION_GUIDE.md` for complete roadmap.

---

**Start with cookie clearing - it's your primary method for NYT success!**
