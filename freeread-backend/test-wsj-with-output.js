/**
 * Test for WSJ article with output to file
 */

const WSJService = require('./src/services/wsjService');
const ContentProcessor = require('./src/services/contentProcessor');
const fs = require('fs');

const url = 'https://www.wsj.com/business/autos/ford-150-lightning-ev-decision-89dc0d84?mod=hp_lead_pos1';
const outputFile = 'wsj-test-result.txt';

async function test() {
  const output = [];
  
  function log(msg) {
    console.log(msg);
    output.push(msg);
  }
  
  log('='.repeat(70));
  log('WSJ Article Test');
  log('='.repeat(70));
  log(`URL: ${url}`);
  log(`Started: ${new Date().toISOString()}`);
  log('');

  const wsjService = new WSJService();
  const contentProcessor = new ContentProcessor();

  try {
    log('Fetching article (this may take 30-60 seconds for headless browser)...');
    log('');
    const startTime = Date.now();
    
    const html = await wsjService.fetchArticle(url);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`✓ HTML fetched successfully! (${elapsed}s)`);
    log(`HTML length: ${html.length} characters`);
    log('');

    log('Extracting content...');
    const content = await contentProcessor.extractContent(html, url);
    
    log('✓ Content extracted successfully!');
    log('');
    log('='.repeat(70));
    log(`ARTICLE TITLE: ${content.title}`);
    log('='.repeat(70));
    log(`ARTICLE LENGTH: ${content.length} characters`);
    log(`AUTHOR: ${content.author || 'Not found'}`);
    log('');
    log('='.repeat(70));
    log('FULL ARTICLE TEXT:');
    log('='.repeat(70));
    log(content.text);
    log('='.repeat(70));
    log('');
    
    if (content.length > 500) {
      log('✅ SUCCESS: Article can be read in full!');
      log(`   Article length: ${content.length} characters`);
    } else {
      log('⚠️  WARNING: Article seems short. May be incomplete.');
    }
    
    log('');
    log(`Completed: ${new Date().toISOString()}`);
    
    // Save to file
    fs.writeFileSync(outputFile, output.join('\n'));
    log(`Results saved to: ${outputFile}`);
    
  } catch (error) {
    log('');
    log('❌ Error: ' + error.message);
    log('');
    log('This means all methods failed:');
    log('  - Cookie clearing');
    log('  - Search engine referrer');
    log('  - Headless browser');
    log('  - Archive');
    log('');
    log('WSJ has a very hard paywall. Recent articles are difficult to access.');
    
    // Save error to file
    fs.writeFileSync(outputFile, output.join('\n'));
    log(`Results saved to: ${outputFile}`);
  }
}

test();

