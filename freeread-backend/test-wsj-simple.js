/**
 * Simple test for WSJ article - waits for headless browser and shows results
 */

const WSJService = require('./src/services/wsjService');
const ContentProcessor = require('./src/services/contentProcessor');

const url = 'https://www.wsj.com/business/autos/ford-150-lightning-ev-decision-89dc0d84?mod=hp_lead_pos1';

async function test() {
  console.log('Testing WSJ article...');
  console.log('URL:', url);
  console.log('');

  const wsjService = new WSJService();
  const contentProcessor = new ContentProcessor();

  try {
    console.log('Fetching article (this may take 30-60 seconds for headless browser)...');
    const html = await wsjService.fetchArticle(url);
    
    console.log('✓ HTML fetched successfully!');
    console.log(`HTML length: ${html.length} characters`);
    console.log('');

    console.log('Extracting content...');
    const content = await contentProcessor.extractContent(html, url);
    
    console.log('✓ Content extracted successfully!');
    console.log('');
    console.log('='.repeat(70));
    console.log('ARTICLE TITLE:', content.title);
    console.log('='.repeat(70));
    console.log('ARTICLE LENGTH:', content.length, 'characters');
    console.log('AUTHOR:', content.author || 'Not found');
    console.log('');
    console.log('='.repeat(70));
    console.log('FULL ARTICLE TEXT:');
    console.log('='.repeat(70));
    console.log(content.text);
    console.log('='.repeat(70));
    
    if (content.length > 500) {
      console.log('');
      console.log('✅ SUCCESS: Article can be read in full!');
      console.log(`   Article length: ${content.length} characters`);
    } else {
      console.log('');
      console.log('⚠️  WARNING: Article seems short. May be incomplete.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('This means all methods failed:');
    console.error('  - Cookie clearing');
    console.error('  - Search engine referrer');
    console.error('  - Headless browser');
    console.error('  - Archive');
    console.error('');
    console.error('WSJ has a very hard paywall. Recent articles are difficult to access.');
  }
}

test();

