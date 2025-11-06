/**
 * Direct test script for WSJ Service
 * Usage: node test-wsj-direct.js <WSJ_URL>
 */

const WSJService = require('./src/services/wsjService');
const ContentProcessor = require('./src/services/contentProcessor');

const url = process.argv[2] || 'https://www.wsj.com/business/autos/ford-150-lightning-ev-decision-89dc0d84?mod=hp_lead_pos1';

async function testWSJDirect() {
  console.log('Testing WSJ URL:', url);
  console.log('='.repeat(60));

  const wsjService = new WSJService();
  const contentProcessor = new ContentProcessor();

  try {
    console.log('\n[1] Attempting to fetch article using multiple methods...');
    console.log('Methods will be tried in order:');
    console.log('  1. Cookie clearing');
    console.log('  2. Search engine referrer');
    console.log('  3. Headless browser');
    console.log('  4. Archive (for older articles)');
    console.log('');

    const html = await wsjService.fetchArticle(url);

    if (!html || html.length === 0) {
      console.log('❌ Received empty HTML');
      return;
    }

    console.log('✅ HTML fetched successfully!');
    console.log(`   HTML length: ${html.length} characters`);

    // Check for paywall
    console.log('\n[2] Checking for paywall...');
    const hasPaywall = wsjService.hasPaywall(html);
    if (hasPaywall) {
      console.log('⚠️  Paywall indicators detected, but attempting extraction anyway...');
    } else {
      console.log('✅ No paywall detected');
    }

    // Extract content
    console.log('\n[3] Extracting content...');
    try {
      const content = await contentProcessor.extractContent(html, url);
      console.log('✅ Content extracted successfully!');
      console.log('\nArticle Title:', content.title);
      console.log('Article Length:', content.length, 'characters');
      console.log('Author:', content.author || 'Not found');
      console.log('\nFirst 500 characters:');
      console.log('-'.repeat(60));
      console.log(content.text.substring(0, 500) + '...');
      console.log('-'.repeat(60));
    } catch (error) {
      console.log('❌ Content extraction failed:', error.message);
      console.log('\nThis might mean:');
      console.log('  - Paywall still present');
      console.log('  - Content structure too different for Readability');
      console.log('  - HTML structure incomplete');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:');
    console.error(error.stack);
  }
}

testWSJDirect();

