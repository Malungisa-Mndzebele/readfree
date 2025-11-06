/**
 * Full test script for WSJ article - tests all methods and extracts full content
 * Usage: node test-wsj-full.js <WSJ_URL>
 */

const WSJService = require('./src/services/wsjService');
const ContentProcessor = require('./src/services/contentProcessor');

const url = process.argv[2] || 'https://www.wsj.com/business/autos/ford-150-lightning-ev-decision-89dc0d84?mod=hp_lead_pos1';

async function testWSJFull() {
  console.log('='.repeat(70));
  console.log('WSJ Article Full Test');
  console.log('='.repeat(70));
  console.log('URL:', url);
  console.log('='.repeat(70));
  console.log('');

  const wsjService = new WSJService();
  const contentProcessor = new ContentProcessor();

  const methods = [
    { name: 'cookie-clearing', display: 'Cookie Clearing' },
    { name: 'search-engine', display: 'Search Engine Referrer' },
    { name: 'headless', display: 'Headless Browser' },
    { name: 'archive', display: 'Archive (Wayback Machine)' }
  ];

  let html = null;
  let successfulMethod = null;

  // Try each method with progress reporting
  for (let i = 0; i < methods.length; i++) {
    const method = methods[i];
    console.log(`[${i + 1}/${methods.length}] Trying ${method.display}...`);
    
    try {
      // Create a modified WSJService that tries one method at a time
      const startTime = Date.now();
      
      // We'll need to modify the approach - let's try methods individually
      if (method.name === 'cookie-clearing') {
        html = await wsjService.tryCookieClearing(url, { timeout: 15000 });
      } else if (method.name === 'search-engine') {
        html = await wsjService.trySearchEngine(url, { timeout: 15000 });
      } else if (method.name === 'headless') {
        console.log('  (This may take 20-30 seconds - rendering JavaScript...)');
        // Use Promise.race to add a timeout
        html = await Promise.race([
          wsjService.tryHeadless(url, { timeout: 45000 }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Headless browser timeout after 45 seconds')), 45000)
          )
        ]);
      } else if (method.name === 'archive') {
        html = await wsjService.tryArchive(url, { timeout: 20000 });
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      
      if (html && html.length > 0) {
        const hasPaywall = wsjService.hasPaywall(html);
        const jsBlock = html.toLowerCase().includes('please enable js');
        
        console.log(`  ✓ Method succeeded (${elapsed}s)`);
        console.log(`  HTML length: ${html.length} characters`);
        console.log(`  Paywall detected: ${hasPaywall ? 'Yes' : 'No'}`);
        console.log(`  JS block: ${jsBlock ? 'Yes' : 'No'}`);
        
        // For headless, accept even with paywall
        if (method.name === 'headless' && !jsBlock) {
          successfulMethod = method.display;
          break;
        }
        
        // For archive, accept even with paywall
        if (method.name === 'archive' && !jsBlock) {
          successfulMethod = method.display;
          break;
        }
        
        // For other methods, need no paywall
        if (!hasPaywall && !jsBlock) {
          successfulMethod = method.display;
          break;
        }
        
        console.log(`  ⚠ Paywall/JS block detected, trying next method...`);
        html = null; // Reset for next method
      } else {
        console.log(`  ✗ Method returned empty HTML`);
      }
    } catch (error) {
      const elapsed = ((Date.now() - Date.now()) / 1000).toFixed(1);
      console.log(`  ✗ Method failed: ${error.message}`);
    }
    
    console.log('');
  }

  if (!html || html.length === 0) {
    console.log('❌ All methods failed - could not fetch article');
    console.log('');
    console.log('Possible reasons:');
    console.log('  - WSJ has a hard paywall that blocks all bypass methods');
    console.log('  - Article is too recent (not in archive)');
    console.log('  - Network/connection issues');
    console.log('  - WSJ detected automated access');
    return;
  }

  console.log('='.repeat(70));
  console.log(`✅ Successfully fetched article using: ${successfulMethod}`);
  console.log('='.repeat(70));
  console.log('');

  // Extract content
  console.log('[Extracting content...]');
  try {
    const content = await contentProcessor.extractContent(html, url);
    
    console.log('✅ Content extracted successfully!');
    console.log('');
    console.log('='.repeat(70));
    console.log('ARTICLE DETAILS');
    console.log('='.repeat(70));
    console.log(`Title: ${content.title}`);
    console.log(`Length: ${content.length} characters`);
    console.log(`Author: ${content.author || 'Not found'}`);
    console.log(`Excerpt: ${content.excerpt || 'Not found'}`);
    console.log('');
    
    console.log('='.repeat(70));
    console.log('FULL ARTICLE TEXT');
    console.log('='.repeat(70));
    console.log(content.text);
    console.log('='.repeat(70));
    console.log('');
    
    // Verify it's a full article
    if (content.length < 500) {
      console.log('⚠️  WARNING: Article seems short. May be incomplete.');
    } else {
      console.log(`✅ Article appears complete (${content.length} characters)`);
    }
    
  } catch (error) {
    console.log('❌ Content extraction failed:', error.message);
    console.log('');
    console.log('This might mean:');
    console.log('  - Paywall still present in HTML');
    console.log('  - Content structure too different for Readability');
    console.log('  - HTML structure incomplete');
  }
}

testWSJFull().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

