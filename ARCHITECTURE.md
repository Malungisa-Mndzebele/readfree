# FreeRead - Technical Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Frontend Application                      │  │
│  │  • URL Input Component                                 │  │
│  │  • Status/Progress Component                           │  │
│  │  • Content Viewer Component                            │  │
│  │  • Error Handler Component                             │  │
│  └───────────────────────┬───────────────────────────────┘  │
└──────────────────────────┼───────────────────────────────────┘
                           │ HTTPS REST API
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server (Node.js)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              API Layer (Express)                       │  │
│  │  • POST /api/fetch - Main endpoint                    │  │
│  │  • GET /api/health - Health check                     │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                           ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Request Router & Orchestrator               │  │
│  │  • Method selection logic                              │  │
│  │  • Fallback chain management                           │  │
│  │  • Result aggregation                                  │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                           ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Method Handlers                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │   Archive    │  │   Search     │  │   Direct    │ │  │
│  │  │   Method     │  │   Engine     │  │   Access    │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                           ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Content Processor & Extractor                   │  │
│  │  • HTML parsing (cheerio)                              │  │
│  │  • Content extraction (Readability)                    │  │
│  │  • Paywall detection                                   │  │
│  │  • Content cleaning                                    │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Wayback    │  │    Target    │  │   Archive    │
│   Machine    │  │    Website   │  │   Services   │
│     API      │  │   (External) │  │   (Alt)      │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Component Details

### 1. Frontend Architecture

#### Technology Stack
- **Framework:** React (or Vue.js) for component structure
- **Styling:** Tailwind CSS for utility-first styling
- **HTTP Client:** Axios for API communication
- **State Management:** React Context API (simple) or Zustand
- **Build Tool:** Vite for fast development and builds

#### Component Structure
```
src/
├── components/
│   ├── UrlInput.jsx          # URL input form
│   ├── MethodSelector.jsx    # Method selection (MVP: auto-detect)
│   ├── ContentViewer.jsx     # Article display
│   ├── StatusIndicator.jsx   # Loading/error states
│   ├── ErrorDisplay.jsx      # Error messages
│   └── Disclaimer.jsx        # Legal disclaimer
├── services/
│   └── api.js                # API client
├── utils/
│   ├── urlValidator.js       # URL validation
│   └── formatters.js         # Content formatting
├── App.jsx                    # Main app component
└── index.jsx                 # Entry point
```

#### API Communication
```javascript
// services/api.js
const API_BASE = import.meta.env.VITE_API_URL;

export async function fetchArticle(url, method = 'auto') {
  const response = await axios.post(`${API_BASE}/api/fetch`, {
    url,
    method,
    options: {
      preferArchive: true,
      timeout: 10000
    }
  });
  return response.data;
}
```

### 2. Backend Architecture

#### Technology Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js for API server
- **HTML Parsing:** cheerio for server-side DOM manipulation
- **Content Extraction:** @mozilla/readability
- **HTTP Client:** axios for external requests
- **Request Handling:** express-validator for input validation

#### Project Structure
```
backend/
├── src/
│   ├── routes/
│   │   └── api.js            # API routes
│   ├── services/
│   │   ├── archiveService.js     # Wayback Machine integration
│   │   ├── searchEngineService.js # Search engine method
│   │   ├── directAccessService.js # Direct access method
│   │   └── contentProcessor.js   # Content extraction
│   ├── utils/
│   │   ├── urlUtils.js       # URL validation/normalization
│   │   ├── headers.js        # Header manipulation
│   │   └── errors.js        # Error handling
│   ├── middleware/
│   │   ├── cors.js          # CORS configuration
│   │   ├── validator.js     # Request validation
│   │   └── errorHandler.js  # Global error handler
│   └── app.js               # Express app setup
├── package.json
└── .env.example
```

#### API Endpoints

##### POST /api/fetch
**Request:**
```json
{
  "url": "https://example.com/article",
  "method": "auto" | "archive" | "search" | "direct",
  "options": {
    "preferArchive": true,
    "timeout": 10000,
    "userAgent": "custom"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "method": "archive",
  "content": {
    "title": "Article Title",
    "text": "Article content...",
    "html": "<article>...</article>",
    "author": "Author Name",
    "date": "2024-01-01"
  },
  "metadata": {
    "originalUrl": "https://example.com/article",
    "source": "archive",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "METHOD_FAILED",
    "message": "All methods failed",
    "details": {
      "archive": "Not available",
      "search": "Blocked",
      "direct": "Paywall detected"
    }
  }
}
```

##### GET /api/health
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### 3. Method Implementations

#### 3.1 Archive Service

```javascript
// services/archiveService.js
const axios = require('axios');

async function fetchFromArchive(url, options = {}) {
  // Check Wayback Machine for available snapshots
  const timestamps = await getAvailableTimestamps(url);
  
  // Try most recent first
  for (const timestamp of timestamps.slice(0, 5)) {
    try {
      const archiveUrl = `https://web.archive.org/web/${timestamp}/${url}`;
      const response = await axios.get(archiveUrl, {
        timeout: options.timeout || 10000,
        headers: {
          'User-Agent': 'FreeRead/1.0'
        }
      });
      
      if (isValidContent(response.data)) {
        return {
          html: response.data,
          source: 'archive',
          timestamp
        };
      }
    } catch (error) {
      continue; // Try next timestamp
    }
  }
  
  throw new Error('Archive unavailable');
}

async function getAvailableTimestamps(url) {
  // Use Wayback Machine CDX API
  const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${url}&output=json&limit=10`;
  // Parse and return timestamps
}
```

#### 3.2 Search Engine Service

```javascript
// services/searchEngineService.js
const axios = require('axios');

async function fetchWithSearchReferrer(url, options = {}) {
  const domain = new URL(url).hostname;
  
  const headers = {
    'User-Agent': options.userAgent || 
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Referer': `https://www.google.com/search?q=site:${domain}`,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };
  
  // Remove paywall cookies by not sending any cookies
  const response = await axios.get(url, {
    timeout: options.timeout || 10000,
    headers,
    maxRedirects: 5,
    validateStatus: (status) => status < 500
  });
  
  if (hasPaywall(response.data)) {
    throw new Error('Paywall detected');
  }
  
  return {
    html: response.data,
    source: 'search-engine'
  };
}
```

#### 3.3 Direct Access Service

```javascript
// services/directAccessService.js
const axios = require('axios');

async function fetchDirect(url, options = {}) {
  const headers = {
    'User-Agent': options.userAgent || 
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };
  
  const response = await axios.get(url, {
    timeout: options.timeout || 10000,
    headers,
    maxRedirects: 5
  });
  
  return {
    html: response.data,
    source: 'direct'
  };
}
```

### 4. Content Processing

```javascript
// services/contentProcessor.js
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const cheerio = require('cheerio');

async function extractContent(html, url) {
  // Convert HTML to DOM for Readability
  const dom = new JSDOM(html, { url });
  const document = dom.window.document;
  
  // Check for paywall indicators
  if (hasPaywall(html)) {
    throw new Error('Paywall detected in content');
  }
  
  // Use Readability to extract article
  const reader = new Readability(document);
  const article = reader.parse();
  
  if (!article || !article.text || article.text.length < 500) {
    throw new Error('Failed to extract meaningful content');
  }
  
  return {
    title: article.title,
    author: article.byline,
    text: article.textContent,
    html: article.content,
    excerpt: article.excerpt,
    length: article.length
  };
}

function hasPaywall(html) {
  const $ = cheerio.load(html);
  
  // Common paywall indicators
  const paywallSelectors = [
    '[class*="paywall"]',
    '[class*="subscription"]',
    '[id*="paywall"]',
    '[id*="subscribe"]',
    '.article-paywall',
    '#article-paywall'
  ];
  
  return paywallSelectors.some(selector => $(selector).length > 0);
}
```

### 5. Request Orchestration

```javascript
// routes/api.js
const express = require('express');
const router = express.Router();

router.post('/fetch', async (req, res) => {
  const { url, method = 'auto', options = {} } = req.body;
  
  // Validate URL
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  
  // Normalize URL
  const normalizedUrl = normalizeUrl(url);
  
  // Method selection and execution
  const methods = method === 'auto' 
    ? ['archive', 'search', 'direct']
    : [method];
  
  let lastError = null;
  
  for (const methodName of methods) {
    try {
      let html;
      
      switch (methodName) {
        case 'archive':
          ({ html } = await archiveService.fetchFromArchive(normalizedUrl, options));
          break;
        case 'search':
          ({ html } = await searchEngineService.fetchWithSearchReferrer(normalizedUrl, options));
          break;
        case 'direct':
          ({ html } = await directAccessService.fetchDirect(normalizedUrl, options));
          break;
      }
      
      // Extract content
      const content = await contentProcessor.extractContent(html, normalizedUrl);
      
      return res.json({
        success: true,
        method: methodName,
        content,
        metadata: {
          originalUrl: normalizedUrl,
          source: methodName,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      lastError = error;
      continue; // Try next method
    }
  }
  
  // All methods failed
  res.status(500).json({
    success: false,
    error: {
      code: 'ALL_METHODS_FAILED',
      message: 'Unable to access content',
      details: lastError?.message
    }
  });
});
```

## Security Considerations

### Input Validation
- URL validation (format, protocol, allowed domains)
- Request size limits
- Rate limiting per IP
- Timeout handling

### Output Sanitization
- HTML sanitization before display
- XSS prevention
- Content Security Policy headers

### Privacy
- No logging of URLs or content
- No user tracking
- No persistent storage
- Clear data handling policy

## Performance Optimization

### Caching Strategy (Future)
- Cache archive results (optional)
- Cache extracted content (short TTL)
- Redis for distributed caching

### Request Optimization
- Parallel method attempts (where possible)
- Connection pooling
- Request timeouts
- Retry logic with exponential backoff

## Monitoring & Logging

### Metrics to Track
- Success rate by method
- Average response time
- Error rates
- Popular sites/domains

### Logging
- Health check logs
- Error logs (no PII)
- Performance metrics
- Security events

## Deployment Architecture

### Development
```
Frontend (localhost:5173) ↔ Backend (localhost:3000)
```

### Production
```
Cloudflare/CDN → Frontend (Vercel) → Backend (Railway) → External APIs
```

### Environment Variables
```bash
# Backend
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://freeread.app
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100

# Frontend
VITE_API_URL=https://api.freeread.app
```

