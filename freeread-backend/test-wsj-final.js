/**
 * Final comprehensive test for WSJ article with all enhanced techniques
 */

const WSJService = require('./src/services/wsjService');
const ContentProcessor = require('./src/services/contentProcessor');
const fs = require('fs');

const url = 'https://www.wsj.com/business/autos/ford-150-lightning-ev-decision-89dc0d84?mod=hp_lead_pos1';

async function test() {
  console.log('='.repeat(70));
  console.log('WSJ Article Test - Enhanced Techniques');
  console.log('='.repeat(70));
  console.log(`URL: ${url}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('');

  const wsjService = new WSJService();
  const contentProcessor = new ContentProcessor();

  try {
    console.log('Fetching article with enhanced techniques...');
    console.log('Techniques being used:');
    console.log('  1. Cookie clearing');
    console.log('  2. Search engine referrer');
    console.log('  3. Headless browser with:');
    console.log('     - Paywall overlay removal');
    console.log('     - Content unlocking');
    console.log('     - Button clicking');
    console.log('     - Scrolling for lazy loading');
    console.log('     - Multiple user agents');
    console.log('  4. Archive (for older articles)');
    console.log('  5. Aggressive content extraction');
    console.log('');

    const startTime = Date.now();
    const html = await wsjService.fetchArticle(url);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`✓ HTML fetched successfully! (${elapsed}s)`);
    console.log(`HTML length: ${html.length} characters`);
    console.log('');

    // Save HTML for inspection
    fs.writeFileSync('wsj-html-final.html', html);
    console.log('HTML saved to: wsj-html-final.html');
    console.log('');

    // Check for paywall
    const hasPaywall = wsjService.hasPaywall(html);
    console.log(`Paywall detected: ${hasPaywall ? 'Yes' : 'No'}`);
    console.log('');

    // Try to extract content
    console.log('Attempting content extraction with aggressive techniques...');
    try {
      const content = await contentProcessor.extractContent(html, url);
      
      console.log('✓ Content extracted successfully!');
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
      
      if (content.length > 500) {
        console.log('✅ SUCCESS: Article can be read in full!');
        console.log(`   Article length: ${content.length} characters`);
        console.log(`   Completed: ${new Date().toISOString()}`);
      } else {
        console.log('⚠️  WARNING: Article seems short. May be incomplete.');
        console.log(`   Article length: ${content.length} characters`);
      }
      
      // Save results
      const output = [
        '='.repeat(70),
        'WSJ Article Test Results',
        '='.repeat(70),
        `URL: ${url}`,
        `Title: ${content.title}`,
        `Length: ${content.length} characters`,
        `Author: ${content.author || 'Not found'}`,
        '',
        'FULL ARTICLE TEXT:',
        '='.repeat(70),
        content.text,
        '='.repeat(70)
      ];
      fs.writeFileSync('wsj-test-result-final.txt', output.join('\n'));
      console.log('Results saved to: wsj-test-result-final.txt');
      
    } catch (error) {
      console.log('❌ Content extraction failed:', error.message);
      console.log('');
      console.log('HTML preview (first 1000 chars):');
      console.log('-'.repeat(70));
      console.log(html.substring(0, 1000));
      console.log('-'.repeat(70));
      console.log('');
      console.log('This means the HTML still contains paywall content.');
      console.log('WSJ has a very hard paywall that may not be bypassable for recent articles.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('All methods failed. WSJ has a very hard paywall.');
  }
}

test();

