/**
 * Test WSJ with stealth mode and bot protection handling
 */

const WSJService = require('./src/services/wsjService');
const ContentProcessor = require('./src/services/contentProcessor');
const fs = require('fs');

const url = 'https://www.wsj.com/business/autos/ford-150-lightning-ev-decision-89dc0d84?mod=hp_lead_pos1';

async function test() {
  console.log('='.repeat(70));
  console.log('WSJ Article Test - Stealth Mode');
  console.log('='.repeat(70));
  console.log(`URL: ${url}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('');

  const wsjService = new WSJService();
  const contentProcessor = new ContentProcessor();

  try {
    console.log('Fetching article with stealth techniques...');
    console.log('This may take 60-90 seconds due to bot protection...');
    console.log('');

    const startTime = Date.now();
    const html = await wsjService.fetchArticle(url);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`✓ HTML fetched successfully! (${elapsed}s)`);
    console.log(`HTML length: ${html.length} characters`);
    console.log('');

    // Check for bot protection
    const hasBotProtection = html.includes('captcha-delivery.com') || 
                             html.includes('cf-browser-verification') ||
                             html.includes('checking your browser');
    
    if (hasBotProtection) {
      console.log('⚠️  Bot protection detected in HTML');
      console.log('This means WSJ is blocking automated access.');
      console.log('');
    }

    // Save HTML for inspection
    fs.writeFileSync('wsj-html-stealth.html', html);
    console.log('HTML saved to: wsj-html-stealth.html');
    console.log('');

    // Check for paywall
    const hasPaywall = wsjService.hasPaywall(html);
    console.log(`Paywall detected: ${hasPaywall ? 'Yes' : 'No'}`);
    console.log('');

    // Try to extract content
    console.log('Attempting content extraction...');
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
      console.log('');
      
      if (content.length > 500) {
        console.log('='.repeat(70));
        console.log('FULL ARTICLE TEXT');
        console.log('='.repeat(70));
        console.log(content.text);
        console.log('='.repeat(70));
        console.log('');
        console.log('✅ SUCCESS: Article can be read in full!');
        console.log(`   Article length: ${content.length} characters`);
      } else {
        console.log('⚠️  WARNING: Article seems short. May be incomplete.');
        console.log(`   Article length: ${content.length} characters`);
        console.log('');
        console.log('First 500 characters:');
        console.log('-'.repeat(70));
        console.log(content.text.substring(0, 500));
        console.log('-'.repeat(70));
      }
      
    } catch (error) {
      console.log('❌ Content extraction failed:', error.message);
      console.log('');
      console.log('HTML preview (first 1500 chars):');
      console.log('-'.repeat(70));
      console.log(html.substring(0, 1500));
      console.log('-'.repeat(70));
      console.log('');
      console.log('This means the HTML still contains bot protection or paywall content.');
      console.log('WSJ has very strong bot protection that may require manual intervention.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('All methods failed. WSJ has very strong protection.');
  }
}

test();

