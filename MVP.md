# FreeRead - Minimum Viable Product (MVP) Plan

## MVP Goals

Create a functional web application that can successfully bypass paywalls for at least 70% of common news sites using the most effective and legal methods available.

**Note:** For specific target sites (NYT/WSJ), see `SITE_SPECIFIC_ANALYSIS.md` for realistic success expectations and required adjustments.

## MVP Scope: What's Included

### Core Features

1. **URL Input & Processing**
   - Simple URL input field
   - URL validation
   - Basic error handling

2. **Three Primary Methods**
   - **Method 1: Cookie Clearing** (Critical for NYT - see site analysis)
   - **Method 2: Wayback Machine** (Primary for WSJ, fallback for NYT)
   - **Method 3: Search Engine Referrer** (NYT secondary method)

3. **Content Display**
   - Basic reader view (readability extraction)
   - Clean article formatting
   - Link back to original article

4. **Basic UI**
   - Homepage with URL input
   - Loading/processing state
   - Success/failure states
   - Legal disclaimer

### MVP Scope: What's NOT Included

- User accounts
- Article saving/sharing
- Browser extension
- Advanced settings
- Site-specific customizations (except minimal for NYT/WSJ)
- Analytics dashboard
- Multiple method selection
- Caching system
- Mobile app
- API access

### Site-Specific Requirements (NYT/WSJ Focus)

**For NYT:**
- Enhanced cookie clearing (primary method)
- Session management to avoid server-side tracking
- Site-specific cookie rules

**For WSJ:**
- Wayback Machine as primary (only realistic method)
- Archive date filtering (prioritize older articles)
- Realistic expectations: ~15-25% success rate

See `SITE_SPECIFIC_ANALYSIS.md` for detailed analysis.

## Technical MVP Stack

### Frontend (Simplified)
```
- Vanilla JavaScript or React (if needed)
- Simple HTML/CSS
- Axios for HTTP requests
- @mozilla/readability for content extraction
```

### Backend (Simplified)
```
- Node.js + Express (minimal setup)
- cheerio for HTML parsing
- axios for HTTP requests
- @mozilla/readability server-side
```

### Deployment
```
- Frontend: Vercel/Netlify (free tier)
- Backend: Railway/Render free tier or single VPS
```

## MVP Implementation Plan

### Phase 1: Foundation (Week 1)
**Goal:** Basic infrastructure and URL handling

**Tasks:**
- [ ] Set up project structure
- [ ] Create basic frontend (HTML/JS)
- [ ] Set up Express backend
- [ ] Implement URL validation
- [ ] Create basic error handling
- [ ] Add legal disclaimer

**Deliverables:**
- Working URL input form
- Basic frontend-backend communication
- Error handling framework

### Phase 2: Cookie Clearing & Wayback Machine (Week 1-2)
**Goal:** Implement primary methods for NYT and WSJ

**Tasks - Cookie Clearing (Priority for NYT):**
- [ ] Research NYT cookie structure
- [ ] Implement cookie clearing service
- [ ] Create site-specific cookie rules (NYT: NYT-S, nyt-m, etc.)
- [ ] Implement session isolation
- [ ] Test cookie clearing effectiveness
- [ ] Handle server-side tracking detection

**Tasks - Wayback Machine (Priority for WSJ):**
- [ ] Research Wayback Machine API
- [ ] Implement archive URL checking
- [ ] Create timestamp selection logic (prioritize older for WSJ)
- [ ] Fetch archived content
- [ ] Handle archive failures gracefully
- [ ] Test with NYT and WSJ articles

**Deliverables:**
- Functional cookie clearing (NYT ~60-70% success)
- Functional archive access (WSJ ~15-25%, NYT ~30-60%)
- Site-specific method routing

### Phase 3: Search Engine Method (Week 2)
**Goal:** Implement secondary method for NYT recent articles

**Tasks:**
- [ ] Implement user-agent spoofing (Googlebot)
- [ ] Add referrer header manipulation (Google search)
- [ ] Combine with cookie clearing
- [ ] Fetch content with modified headers
- [ ] Test with NYT (expect ~40-50% success, 5/day limit)
- [ ] Handle WSJ (doesn't work - skip gracefully)
- [ ] Handle failures

**Deliverables:**
- Functional search engine method for NYT
- ~40-50% success rate (limited by daily quota)
- Site-aware method selection

### Phase 4: Content Processing (Week 2-3)
**Goal:** Clean, readable article display

**Tasks:**
- [ ] Integrate readability.js
- [ ] Extract article content from HTML
- [ ] Clean and format content
- [ ] Handle extraction failures
- [ ] Style reader view
- [ ] Test with various article formats

**Deliverables:**
- Clean article reader view
- Proper content extraction

### Phase 5: Method Routing & Fallback (Week 3)
**Goal:** Intelligent method selection and fallback

**Tasks:**
- [ ] Implement method priority logic
- [ ] Create fallback chain (Archive → Search Engine → Error)
- [ ] Add method status display
- [ ] Improve error messages
- [ ] Test complete flow

**Deliverables:**
- Automatic method selection
- Seamless fallback between methods

### Phase 6: UI/UX Polish (Week 3-4)
**Goal:** Professional, usable interface

**Tasks:**
- [ ] Design clean interface
- [ ] Add loading states
- [ ] Improve error messages
- [ ] Add success indicators
- [ ] Implement dark mode (basic)
- [ ] Mobile responsiveness
- [ ] Accessibility basics

**Deliverables:**
- Polished, professional UI
- Good user experience

### Phase 7: Testing & Optimization (Week 4)
**Goal:** Ensure reliability and performance

**Tasks:**
- [ ] Test with 50+ different URLs
- [ ] Measure success rates
- [ ] Optimize performance
- [ ] Fix bugs
- [ ] Security audit
- [ ] Documentation

**Deliverables:**
- Stable, tested application
- Success rate tracking
- Basic documentation

## MVP Success Criteria

### Functional Requirements
- ✅ User can input a URL
- ✅ System attempts to fetch content via 2 methods
- ✅ Content displays in readable format
- ✅ Handles failures gracefully
- ✅ Legal disclaimer visible

### Performance Requirements
- ⏱️ Page load time < 3 seconds
- ⏱️ Article fetch time < 10 seconds
- 📊 Success rate > 50% on test sites
- 🔒 No security vulnerabilities

### Quality Requirements
- 📱 Works on desktop browsers (Chrome, Firefox, Safari)
- 📱 Responsive mobile design
- ♿ Basic accessibility (keyboard navigation, screen readers)
- ⚠️ Clear error messages
- 📝 User-friendly interface

## MVP Testing Plan

### Test Sites (Priority Order)
1. **Medium** - Common, well-documented paywall
2. **New York Times** - Metered paywall
3. **Washington Post** - Metered paywall
4. **Bloomberg** - Hard paywall (harder test)
5. **Financial Times** - Hard paywall
6. **The Guardian** - Soft paywall (easier)
7. **Wired** - Metered paywall
8. **Forbes** - Soft paywall
9. **The Atlantic** - Metered paywall
10. **WSJ** - Hard paywall (hardest test)

### Test Scenarios
1. **Archive Available:** Older articles with archive
2. **Archive Unavailable:** Recent articles, no archive
3. **Search Method Works:** Sites allowing search referrers
4. **Both Methods Fail:** Hard paywalls
5. **Invalid URLs:** Error handling
6. **Network Errors:** Offline/hosting issues

## MVP Architecture (Simplified)

```
┌─────────────────────────────────┐
│         Frontend (Static)        │
│  ┌───────────────────────────┐  │
│  │  URL Input + Button        │  │
│  │  Loading Indicator         │  │
│  │  Content Display Area      │  │
│  │  Error Messages            │  │
│  └───────────────────────────┘  │
└──────────────┬──────────────────┘
               │ POST /api/fetch
               ↓
┌─────────────────────────────────┐
│      Backend (Express API)       │
│  ┌───────────────────────────┐  │
│  │  1. Validate URL          │  │
│  │  2. Try Archive Method    │  │
│  │  3. Try Search Method     │  │
│  │  4. Extract Content       │  │
│  │  5. Return Article        │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

## MVP Dependencies

### Frontend
```json
{
  "axios": "^1.6.0",
  "@mozilla/readability": "^0.4.4"
}
```

### Backend
```json
{
  "express": "^4.18.0",
  "axios": "^1.6.0",
  "cheerio": "^1.0.0",
  "@mozilla/readability": "^0.4.4",
  "cors": "^2.8.5"
}
```

## MVP Deployment Checklist

- [ ] Frontend deployed (Vercel/Netlify)
- [ ] Backend deployed (Railway/Render)
- [ ] Environment variables configured
- [ ] CORS configured
- [ ] HTTPS enabled
- [ ] Domain configured (optional)
- [ ] Legal disclaimer visible
- [ ] Error handling tested
- [ ] Performance tested

## Post-MVP Enhancements

After MVP success, consider:
1. Browser extension version
2. Additional bypass methods
3. Site-specific rules engine
4. User accounts and history
5. Article saving/sharing
6. Mobile app
7. API for developers
8. Community features

