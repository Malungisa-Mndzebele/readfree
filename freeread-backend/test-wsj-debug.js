/**
 * Debug test for WSJ article - shows HTML content
 */

const WSJService = require('./src/services/wsjService');
const ContentProcessor = require('./src/services/contentProcessor');
const fs = require('fs');

const url = 'https://www.wsj.com/business/autos/ford-150-lightning-ev-decision-89dc0d84?mod=hp_lead_pos1';

async function test() {
  console.log('Testing WSJ article with debug output...');
  console.log('URL:', url);
  console.log('');

  const wsjService = new WSJService();
  const contentProcessor = new ContentProcessor();

  try {
    console.log('Fetching article...');
    const html = await wsjService.fetchArticle(url);
    
    console.log('✓ HTML fetched successfully!');
    console.log(`HTML length: ${html.length} characters`);
    console.log('');

    // Save HTML to file for inspection
    fs.writeFileSync('wsj-html-debug.html', html);
    console.log('HTML saved to: wsj-html-debug.html');
    console.log('');

    // Check for paywall
    const hasPaywall = wsjService.hasPaywall(html);
    console.log(`Paywall detected: ${hasPaywall ? 'Yes' : 'No'}`);
    console.log('');

    // Try to extract content anyway
    console.log('Attempting content extraction...');
    try {
      const content = await contentProcessor.extractContent(html, url);
      
      console.log('✓ Content extracted successfully!');
      console.log('');
      console.log('Title:', content.title);
      console.log('Length:', content.length, 'characters');
      console.log('Author:', content.author || 'Not found');
      console.log('');
      console.log('First 1000 characters of text:');
      console.log('-'.repeat(70));
      console.log(content.text.substring(0, 1000));
      console.log('-'.repeat(70));
      
      if (content.length > 500) {
        console.log('');
        console.log('✅ SUCCESS: Article can be read in full!');
        console.log(`   Full article length: ${content.length} characters`);
      }
      
    } catch (error) {
      console.log('❌ Content extraction failed:', error.message);
      console.log('');
      console.log('HTML preview (first 500 chars):');
      console.log('-'.repeat(70));
      console.log(html.substring(0, 500));
      console.log('-'.repeat(70));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();

