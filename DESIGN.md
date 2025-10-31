# FreeRead - Complete Design Specification

## 1. Project Vision

FreeRead is a web application that provides users with multiple methods to access paywalled content, prioritizing legal and ethical approaches while offering transparency about methods used.

## 2. User Experience Design

### 2.1 User Journey

```
1. User visits FreeRead homepage
   ↓
2. User pastes URL of paywalled article
   ↓
3. User selects preferred method (or auto-detect)
   ↓
4. System attempts bypass using multiple methods
   ↓
5. Content displayed in reader view (or embedded)
   ↓
6. User can share, save, or report issues
```

### 2.2 Interface Mockups (Description)

#### Homepage
- **Hero Section:**
  - Logo and tagline
  - Large URL input field
  - "Access Article" button
  - Quick stats (success rate, articles accessed)
  
- **Method Selection:**
  - Radio buttons or dropdown:
    - Auto-detect (recommended)
    - Wayback Machine
    - Search Engine Method
    - Direct Access
    - Custom configuration

- **Recent Articles:** (optional for MVP)
  - List of recently accessed URLs

#### Processing Screen
- Loading animation
- Progress indicator showing current method attempted
- Status messages:
  - "Checking Wayback Machine..."
  - "Attempting direct access..."
  - "Success! Loading content..."

#### Result Screen
- **Success State:**
  - Article content in reader view (readability.js style)
  - Original URL link
  - Method used badge
  - Actions: Save, Share, Report Issue
  
- **Failure State:**
  - Clear error message
  - Suggested alternatives:
    - Try different method
    - Check if site is supported
    - Report as unsupported site
  - Link to original article

#### Settings Page
- **Method Preferences:**
  - Enable/disable specific methods
  - Preferred archive date
  - User-agent customization
  
- **Privacy Settings:**
  - Disable analytics
  - Clear history
  
- **Legal Disclaimer:**
  - Acknowledgment checkbox
  - Terms of use

### 2.3 Visual Design Principles

- **Clean & Minimal:** Focus on content, not UI
- **Trust Signals:** Clear disclaimers, transparent methods
- **Dark Mode:** Essential for reading
- **Accessibility:** WCAG 2.1 AA compliance
- **Mobile Responsive:** Works on all devices

## 3. Technical Design

### 3.1 Architecture Overview

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │
       │ HTTPS
       ↓
┌─────────────┐
│  Backend    │
│   Server    │
└──────┬──────┘
       │
       ├──→ Wayback Machine API
       ├──→ Content Scraping
       ├──→ Cookie Management
       └──→ Reader View Processing
```

### 3.2 Core Components

#### Frontend Components:
1. **URL Input Component**
   - Validation
   - URL normalization
   - History (localStorage)

2. **Method Selector**
   - Auto-detect logic
   - Manual selection
   - Method descriptions

3. **Content Viewer**
   - Reader view (readability)
   - Article extraction
   - Clean formatting

4. **Status Component**
   - Progress indicator
   - Error handling
   - Success/feedback messages

#### Backend Services:
1. **URL Validator**
   - Valid URL check
   - Supported sites detection
   - Domain whitelist/blacklist

2. **Archive Service**
   - Wayback Machine API integration
   - Multiple timestamp checking
   - Fallback logic

3. **Content Fetcher**
   - HTTP requests with modified headers
   - Cookie handling
   - User-agent rotation
   - Referrer manipulation

4. **Content Processor**
   - HTML parsing (cheerio/jsdom)
   - Readability extraction
   - Paywall detection
   - Content cleaning

5. **Method Router**
   - Method selection logic
   - Fallback chain
   - Success/failure handling

### 3.3 Data Flow

```
User Input (URL)
    ↓
URL Validation & Normalization
    ↓
Method Selection / Auto-detect
    ↓
┌──────────────────────────────┐
│  Try Method 1: Archive       │
│  └─→ Success? Display        │
│  └─→ Fail? Next method       │
└──────────────────────────────┘
    ↓
┌──────────────────────────────┐
│  Try Method 2: Search Engine │
│  └─→ Success? Display        │
│  └─→ Fail? Next method       │
└──────────────────────────────┘
    ↓
┌──────────────────────────────┐
│  Try Method 3: Direct Access │
│  └─→ Success? Display         │
│  └─→ Fail? Show error         │
└──────────────────────────────┘
    ↓
Content Processing (Readability)
    ↓
Display to User
```

### 3.4 Technology Stack

#### Frontend:
- **Framework:** React or Vue.js
- **Styling:** Tailwind CSS or CSS Modules
- **Reader View:** readability.js or @mozilla/readability
- **HTTP Client:** Axios or fetch

#### Backend:
- **Runtime:** Node.js with Express
- **HTML Parsing:** cheerio or jsdom
- **HTTP Requests:** axios or node-fetch
- **Content Extraction:** @mozilla/readability
- **Caching:** Redis (optional for MVP)

#### Infrastructure:
- **Deployment:** Vercel/Netlify (frontend), Railway/Render (backend)
- **Database:** None for MVP (use localStorage/cookies)
- **CDN:** Cloudflare (optional)

## 4. Bypass Methods Implementation

### 4.1 Method 1: Wayback Machine

```javascript
async function fetchFromArchive(url) {
  const archiveUrl = `https://web.archive.org/web/${timestamp}/${url}`;
  // Try multiple timestamps
  // Check if content is accessible
  // Return HTML if successful
}
```

**Pros:**
- 100% legal
- Often works for older articles
- Reliable service

**Cons:**
- May not have recent articles
- Can be slow
- May not preserve formatting perfectly

### 4.2 Method 2: Search Engine Referrer

```javascript
async function fetchWithSearchReferrer(url) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Referer': 'https://www.google.com/search?q=site:' + domain,
    // Clear paywall-related cookies
  };
  // Fetch with modified headers
}
```

**Pros:**
- Often effective for metered paywalls
- Fast execution
- Works on many news sites

**Cons:**
- Gray legal area
- Some sites detect and block
- May violate ToS

### 4.3 Method 3: Direct Access with Cookie Clearing

```javascript
async function fetchDirect(url) {
  // Clear session cookies
  // Remove paywall-related cookies
  // Fetch with clean state
  // Process and extract content
}
```

**Pros:**
- Fast
- Can work for cookie-based paywalls
- Simple implementation

**Cons:**
- Limited effectiveness
- May trigger rate limits
- Server-side tracking bypasses this

### 4.4 Method 4: AMP/RSS Version

```javascript
async function fetchAMPVersion(url) {
  // Try to convert to AMP URL
  // Many sites have AMP versions without paywalls
  // Example: example.com/article → example.com/article/amp
}
```

**Pros:**
- Legal
- Often paywall-free
- Fast loading

**Cons:**
- Not all sites have AMP
- May have reduced formatting

## 5. Security & Privacy

### 5.1 Security Measures

- **HTTPS Only:** All traffic encrypted
- **Input Sanitization:** Prevent XSS/injection
- **Rate Limiting:** Prevent abuse
- **CORS:** Proper cross-origin handling
- **Content Security Policy:** Prevent malicious scripts

### 5.2 Privacy Features

- **No User Tracking:** No analytics without consent
- **No Data Storage:** URLs not stored server-side
- **Client-Side Processing:** Where possible
- **No Cookies:** Except functional ones
- **Privacy-First:** GDPR considerations

### 5.3 Legal Compliance

- **Clear Disclaimers:** Prominent warnings
- **Terms of Service:** User acknowledgment
- **DMCA Compliance:** Takedown procedure
- **Transparency:** Method disclosure

## 6. Error Handling

### 6.1 Error Types

1. **Invalid URL:** User-friendly validation
2. **Unsupported Site:** Suggest alternatives
3. **Archive Unavailable:** Try other methods
4. **Network Error:** Retry logic
5. **Content Extraction Failed:** Fallback rendering
6. **Rate Limited:** Wait and retry

### 6.2 User Feedback

- **Clear Error Messages:** Explain what went wrong
- **Suggestions:** What user can try
- **Report Issue:** Feedback mechanism
- **Fallback Options:** Always offer alternatives

## 7. Performance Considerations

- **Caching:** Archive results (optional)
- **Parallel Requests:** Try multiple methods simultaneously
- **Lazy Loading:** Content loading optimization
- **CDN:** Static asset delivery
- **Compression:** Response compression
- **Timeout Handling:** Fast failures

## 8. Success Metrics

### 8.1 Technical Metrics
- Success rate by method
- Average load time
- Error rates by site
- Method effectiveness ranking

### 8.2 User Metrics (with consent)
- URLs accessed
- Method preferences
- Failure patterns
- Feature usage

## 9. Future Enhancements (Post-MVP)

- Browser extension version
- Mobile app
- Bookmark service
- Article sharing/saving
- User accounts (optional)
- Site-specific rule engine
- Community-contributed rules
- Browser plugin integration
- Proxy service option
- API for developers

