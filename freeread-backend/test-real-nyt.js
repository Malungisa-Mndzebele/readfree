/**
 * Test script for real NYT URLs
 * Usage: node test-real-nyt.js <NYT_URL>
 */

const NYTimesService = require('./src/services/nytimesService');
const ContentProcessor = require('./src/services/contentProcessor');
const DebugService = require('./src/services/debugService');

// Enable debug mode
process.env.DEBUG = 'true';

const url = process.argv[2] || 'https://www.nytimes.com/2024/01/15/technology/ai-openai-chatgpt.html';

async function testRealNYT() {
  console.log('Testing NYT URL:', url);
  console.log('='.repeat(60));

  const nytService = new NYTimesService();
  const contentProcessor = new ContentProcessor();
  const debugService = new DebugService();

  try {
    // Step 1: Fetch HTML
    console.log('\n[1] Fetching HTML with cookie clearing...');
    const html = await nytService.fetchArticle(url);
    console.log('✅ HTML fetched:', html.length, 'characters');

    // Step 2: Analyze HTML
    console.log('\n[2] Analyzing HTML...');
    const analysis = debugService.analyzeHtml(html);
    debugService.printAnalysis(analysis);

    // Step 3: Check paywall
    console.log('[3] Checking for paywall...');
    if (nytService.hasPaywall(html)) {
      console.log('❌ Paywall detected!');
      console.log('   Indicators found:', analysis.paywallIndicators);
      return;
    }
    console.log('✅ No paywall detected');

    // Step 4: Extract content
    console.log('\n[4] Extracting content with Readability...');
    const content = await contentProcessor.extractContent(html, url);
    console.log('✅ Content extracted successfully!');
    console.log('\nArticle Title:', content.title);
    console.log('Article Length:', content.length, 'characters');
    console.log('Author:', content.author || 'Not found');
    console.log('\nFirst 500 characters of text:');
    console.log('-'.repeat(60));
    console.log(content.text.substring(0, 500) + '...');
    console.log('-'.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:');
    console.error(error.stack);
  }
}

testRealNYT();

