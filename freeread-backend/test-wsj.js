/**
 * Test script for WSJ URLs
 * Usage: node test-wsj.js <WSJ_URL>
 */

const WSJService = require('./src/services/wsjService');
const ContentProcessor = require('./src/services/contentProcessor');
const ArchiveService = require('./src/services/archiveService');

// Enable debug mode
process.env.DEBUG = 'true';

const url = process.argv[2] || 'https://www.wsj.com/tech/ai/nvidia-poised-to-become-first-5-trillion-company-ae513ff0?mod=hp_lead_pos7';

async function testWSJ() {
  console.log('Testing WSJ URL:', url);
  console.log('='.repeat(60));

  const wsjService = new WSJService();
  const archiveService = new ArchiveService();
  const contentProcessor = new ContentProcessor();

  try {
    // Step 1: Check archive availability
    console.log('\n[1] Checking Wayback Machine for available archives...');
    const timestamps = await archiveService.getAvailableTimestamps(url, 10);
    
    if (timestamps.length === 0) {
      console.log('❌ No archives found for this URL');
      console.log('\nWhy this might happen:');
      console.log('  - WSJ actively blocks new content archiving');
      console.log('  - Article is too recent (< 6 months old)');
      console.log('  - Check manually: https://web.archive.org/web/*/' + url);
      return;
    }

    console.log(`✅ Found ${timestamps.length} archive(s):`);
    timestamps.slice(0, 5).forEach((ts, i) => {
      const date = new Date(
        ts.substring(0, 4),
        parseInt(ts.substring(4, 6)) - 1,
        ts.substring(6, 8),
        ts.substring(8, 10),
        ts.substring(10, 12),
        ts.substring(12, 14)
      );
      console.log(`  ${i + 1}. ${ts} - ${date.toLocaleDateString()}`);
    });

    // Step 2: Try fetching from archive
    console.log('\n[2] Attempting to fetch from archive...');
    const archiveResult = await archiveService.fetchFromArchive(url, { preferOlder: true });
    
    if (!archiveResult || !archiveResult.html) {
      console.log('❌ Failed to fetch from archive');
      return;
    }

    console.log('✅ Archive fetch successful!');
    console.log(`   Timestamp: ${archiveResult.timestamp}`);
    console.log(`   HTML length: ${archiveResult.html.length} characters`);

    // Step 3: Check for paywall
    console.log('\n[3] Checking for paywall in archived content...');
    const wsjService = new WSJService();
    // Access the cookieService through WSJService (it's private, so we'll check directly)
    // For now, let's just try extraction

    // Step 4: Extract content
    console.log('\n[4] Extracting content...');
    try {
      const content = await contentProcessor.extractContent(archiveResult.html, url);
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
      console.log('  - Paywall still present in archived version');
      console.log('  - Content structure too different for Readability');
      console.log('  - Archived version incomplete');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:');
    console.error(error.stack);
  }
}

testWSJ();

