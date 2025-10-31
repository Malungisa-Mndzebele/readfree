# Step-by-Step Implementation Guide with Tests

This guide ensures every feature is tested before we continue to the next step.

## Testing Strategy

- **Unit Tests:** Test individual services and functions
- **Integration Tests:** Test API endpoints and service interactions
- **Test-Driven Development:** Write tests first, then implement
- **All tests must pass before moving to next step**

## Testing Framework Setup

We'll use **Jest** for testing with:
- Unit test coverage
- Mock HTTP requests (axios)
- Test utilities
- Coverage reporting

## Implementation Steps

### Step 1: Project Setup with Testing ✅
- Set up Jest
- Configure test scripts
- Create test directory structure
- Write first passing test

### Step 2: Cookie Service (Test First) ✅
- Write cookie service tests
- Implement CookieService
- All tests passing
- Verify no cookies sent

### Step 3: Site Detection ✅
- Write site detection tests
- Implement site detection utilities
- All tests passing

### Step 4: Paywall Detection ✅
- Write paywall detection tests
- Implement paywall detection
- All tests passing

### Step 5: NYT Service Integration ✅
- Write NYT service tests
- Implement NYTimesService
- Mock HTTP requests
- All tests passing

### Step 6: Content Extraction ✅
- Write content extraction tests
- Integrate Readability
- All tests passing

### Step 7: API Routes ✅
- Write API route tests
- Implement Express routes
- Integration tests passing

### Step 8: Frontend (Testing) ✅
- Write frontend component tests
- Implement UI components
- E2E test basic flow

## Test Running Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- cookieService.test.js
```

## Quality Gates

Before moving to next step:
- ✅ All existing tests pass
- ✅ New feature tests written
- ✅ Code coverage > 80% for new code
- ✅ No linting errors

