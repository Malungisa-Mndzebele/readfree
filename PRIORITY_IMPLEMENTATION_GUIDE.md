# Priority Implementation Guide: NYT First, Then WSJ

This guide provides a focused roadmap to get NYT working effectively first, then expand to WSJ support.

## Implementation Philosophy

**Primary Goal:** Achieve 65-75% success rate with NYT articles
**Secondary Goal:** Add WSJ support with realistic 15-25% expectations

## Phase Breakdown: NYT-Focused Implementation

### Week 1: Foundation + NYT Cookie Clearing

#### Day 1-2: Project Setup
```bash
# Set up project structure
mkdir freeread-backend freeread-frontend
cd freeread-backend
npm init -y
npm install express axios cheerio @mozilla/readability jsdom cors express-validator
npm install -D nodemon dotenv

cd ../freeread-frontend
npm init -y
npm install axios
npm install -D vite
```

**Create basic structure:**
- Express server with /api/fetch endpoint
- Simple frontend with URL input
- Basic error handling

#### Day 3-4: NYT Cookie Clearing Service (CRITICAL)

**Priority: HIGHEST** - This is your primary method for NYT.

**Implementation Steps:**

1. **Create Cookie Service Module**
   - File: `backend/src/services/cookieService.js`
   - Reference: `TECHNICAL_IMPLEMENTATION_NYT.md`

2. **Key Requirements:**
   ```javascript
   // Must have:
   - No cookies sent with requests (withCredentials: false)
   - Fresh axios instance per request
   - NYT-specific cookie list clearing
   - Session isolation
   ```

3. **Test Immediately:**
   - Test with 5-10 NYT article URLs
   - Verify no paywall detection
   - Check content extraction works

**Success Criteria:**
- ✅ 60%+ success rate on NYT articles
- ✅ No cookies in request headers
- ✅ Paywall detection working correctly

#### Day 5: NYT Integration & Testing

- Integrate cookie service into main API endpoint
- Add site detection (nytimes.com)
- Implement paywall detection
- Test with variety of NYT articles
- Fix any issues found

### Week 2: Enhance NYT Success Rate

#### Day 1-2: Search Engine Referrer Method

**Purpose:** Boost NYT success rate to 70-75%

**Implementation:**
1. Create search engine service
2. Set Googlebot user-agent
3. Set Google search referrer
4. Combine with cookie clearing

**Expected Impact:**
- Add ~5-10% to success rate
- Works for articles where cookie clearing alone fails

#### Day 3: Content Extraction & Reader View

**Priority:** HIGH - Must work for user experience

1. Integrate @mozilla/readability
2. Extract clean article content
3. Format for display
4. Handle extraction failures

#### Day 4-5: Method Routing & Fallback

**Implement intelligent method selection:**

```javascript
// For NYT:
1. Try cookie clearing first (fastest, most reliable)
2. Try search referrer if cookie fails
3. Try Wayback Machine as last resort
4. Return error if all fail
```

### Week 3: UI/UX Polish + WSJ Foundation

#### Day 1-2: Frontend Polish
- Clean, professional UI
- Loading states
- Error messages
- Success indicators
- Method used badges

#### Day 3: WSJ Wayback Machine Integration

**Lower Priority:** WSJ has limited success, but add basic support

**Implementation:**
1. Wayback Machine API integration
2. Prioritize older timestamps (6+ months)
3. Site detection for wsj.com
4. Realistic error messages

**Note:** Don't expect high success - this is a "bonus" feature

#### Day 4-5: Testing & Bug Fixes
- Test with 20+ NYT articles
- Test with 10+ WSJ articles (expect low success)
- Fix bugs
- Improve error handling

### Week 4: Testing, Optimization, Deployment

#### Day 1-2: Comprehensive Testing
- NYT: 50+ articles across different sections
- WSJ: 20+ articles (understanding limitations)
- Error scenarios
- Edge cases

#### Day 3: Performance Optimization
- Response time improvements
- Error handling refinement
- Better user feedback

#### Day 4-5: Deployment
- Deploy backend to Railway/Render
- Deploy frontend to Vercel/Netlify
- Configure environment variables
- Final testing in production

## Implementation Priority Order

### Must Have (NYT Working)
1. ✅ **Cookie Clearing Service** - Week 1, Days 3-4
2. ✅ **NYT Site Detection** - Week 1, Day 5
3. ✅ **Paywall Detection** - Week 1, Day 5
4. ✅ **Content Extraction** - Week 2, Day 3
5. ✅ **Search Referrer Method** - Week 2, Days 1-2

### Should Have (Improved Success)
6. ✅ **Method Routing** - Week 2, Days 4-5
7. ✅ **Error Handling** - Throughout
8. ✅ **UI Polish** - Week 3, Days 1-2

### Nice to Have (WSJ Support)
9. ⚠️ **WSJ Archive Integration** - Week 3, Day 3
10. ⚠️ **Alternative Archive Services** - Post-MVP

## Code Implementation Checklist

### Backend Services (in order of priority)

- [ ] **cookieService.js** - Cookie clearing (Week 1, Day 3-4)
  - [ ] No-cookie axios instance
  - [ ] NYT-specific rules
  - [ ] Session isolation
  - [ ] Testing with NYT URLs

- [ ] **nytimesService.js** - NYT-specific logic (Week 1, Day 5)
  - [ ] Site detection
  - [ ] Paywall detection
  - [ ] Cookie service integration
  - [ ] Error handling

- [ ] **searchEngineService.js** - Search referrer (Week 2, Day 1-2)
  - [ ] Googlebot user-agent
  - [ ] Google referrer header
  - [ ] Combined with cookie clearing
  - [ ] NYT-specific (WSJ skip)

- [ ] **archiveService.js** - Wayback Machine (Week 2, Day 3 / Week 3, Day 3)
  - [ ] CDX API integration
  - [ ] Timestamp selection
  - [ ] WSJ-specific: prioritize older dates
  - [ ] Fallback logic

- [ ] **contentProcessor.js** - Article extraction (Week 2, Day 3)
  - [ ] Readability integration
  - [ ] HTML parsing
  - [ ] Clean output
  - [ ] Error handling

- [ ] **methodRouter.js** - Intelligent routing (Week 2, Day 4-5)
  - [ ] Site-specific method selection
  - [ ] Fallback chain
  - [ ] Error aggregation

### API Endpoints

- [ ] **POST /api/fetch** - Main endpoint (Week 1, Day 2)
  - [ ] URL validation
  - [ ] Site detection
  - [ ] Method routing
  - [ ] Response formatting

- [ ] **GET /api/health** - Health check (Week 1, Day 2)

### Frontend Components

- [ ] **URL Input** - (Week 1, Day 1-2)
  - [ ] Input field
  - [ ] Validation
  - [ ] Submit button

- [ ] **Loading State** - (Week 2)
  - [ ] Progress indicator
  - [ ] Method being tried

- [ ] **Content Viewer** - (Week 2, Day 3)
  - [ ] Article display
  - [ ] Reader view styling
  - [ ] Metadata display

- [ ] **Error Display** - (Week 2)
  - [ ] Clear error messages
  - [ ] Retry option
  - [ ] Suggestions

## Testing Strategy: NYT-First

### Week 1 Tests (Cookie Clearing)
```
Test Cases:
1. NYT article - should succeed with cookie clearing
2. NYT article - verify no paywall
3. NYT article - verify content extraction
4. Invalid URL - should error gracefully
5. Non-NYT URL - should attempt generic methods
```

### Week 2 Tests (Enhanced Methods)
```
Test Cases:
1. NYT where cookie fails - search referrer should work
2. Multiple NYT articles in sequence - test rate limits
3. Different NYT sections (tech, politics, etc.)
4. Old NYT articles - should work with archive
5. Very recent NYT articles - realistic expectations
```

### Week 3 Tests (WSJ Basic)
```
Test Cases:
1. Old WSJ article (>6 months) - archive should work
2. Recent WSJ article - should fail gracefully
3. Error messages for WSJ - should explain limitations
```

## Success Metrics to Track

### NYT Metrics (Primary)
- Cookie clearing success rate (target: 60-70%)
- Search referrer additional success (target: +5-10%)
- Combined success rate (target: 65-75%)
- Average response time (target: <5 seconds)

### WSJ Metrics (Secondary)
- Archive availability rate (target: 20-30%)
- Success rate for old articles (target: 15-25%)
- User expectations managed (clear messaging)

## Quick Reference: Critical Code Snippets

### NYT Cookie Clearing (Week 1)
```javascript
// Most critical code - get this right
const client = axios.create({
  withCredentials: false, // CRITICAL: No cookies
  headers: {
    // Don't send cookie header
    'User-Agent': 'Mozilla/5.0...'
  }
});
```

### Site Detection (Week 1)
```javascript
const domain = new URL(url).hostname;
if (domain.includes('nytimes.com')) {
  // Use cookie clearing method
} else if (domain.includes('wsj.com')) {
  // Use archive only
}
```

### Paywall Detection (Week 1)
```javascript
const paywallIndicators = [
  'Subscribe to The Times',
  "You've reached your article limit"
];
const hasPaywall = paywallIndicators.some(ind => 
  html.includes(ind)
);
```

## Common Pitfalls to Avoid

### Week 1 Pitfalls
❌ **Sending cookies unintentionally**
- Always use `withCredentials: false`
- Create fresh axios instance

❌ **Assuming cookie clearing works immediately**
- Test thoroughly with real NYT URLs
- Check response HTML for paywall

### Week 2 Pitfalls
❌ **Not combining methods**
- Cookie + Search referrer together
- Fallback to archive if needed

❌ **Poor error messages**
- Users need to know why it failed
- Suggest alternatives

### Week 3 Pitfalls
❌ **Expecting WSJ high success**
- Set realistic expectations
- Focus on old articles
- Clear messaging to users

## Daily Standup Questions

Ask yourself each day:
1. **Did I test NYT cookie clearing today?** (Week 1)
2. **What's my current NYT success rate?** (Track daily)
3. **Are errors handled gracefully?** (Throughout)
4. **Is the user experience smooth?** (Week 3+)

## Recommended Workflow

### Morning Routine
1. Test yesterday's code with 5 NYT URLs
2. Fix any issues found
3. Continue with today's tasks

### Implementation Routine
1. Write code for one feature
2. Test immediately with real URLs
3. Fix issues
4. Move to next feature

### End of Day
1. Test all implemented features
2. Document any issues
3. Plan tomorrow's tasks

## Getting Help

### Stuck on Cookie Clearing?
- Review `TECHNICAL_IMPLEMENTATION_NYT.md`
- Check axios configuration
- Verify no cookies in network inspector

### Stuck on Paywall Detection?
- Test with known paywalled articles
- Check HTML for specific strings
- Look at Bypass Paywalls Clean source code (reference)

### WSJ Not Working?
- **This is expected** - set realistic goals
- Focus on old articles only
- Consider it a bonus feature

## Final Checklist Before Deployment

### NYT Must Work
- [ ] Cookie clearing: 60%+ success
- [ ] Search referrer: Working
- [ ] Combined: 65%+ success
- [ ] Content extraction: Clean articles
- [ ] Error handling: Graceful failures

### WSJ Basic Support
- [ ] Archive integration: Working
- [ ] Error messages: Realistic expectations
- [ ] Old articles: 15-25% success

### General
- [ ] UI: Professional and clean
- [ ] Performance: <5 second responses
- [ ] Security: No vulnerabilities
- [ ] Legal: Disclaimers visible

---

**Remember:** Focus on NYT success first. Get it working well (65-75%), then add WSJ as a bonus feature. Don't let WSJ's limitations derail your MVP success!

