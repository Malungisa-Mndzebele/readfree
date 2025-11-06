/**
 * Test script for WSJ API endpoint
 * Usage: node test-wsj-api.js <WSJ_URL>
 */

const axios = require('axios');

const url = process.argv[2] || 'https://www.wsj.com/business/autos/ford-150-lightning-ev-decision-89dc0d84?mod=hp_lead_pos1';
const apiUrl = 'http://localhost:3000/api/fetch';

async function testWSJAPI() {
  console.log('Testing WSJ URL via API:', url);
  console.log('API Endpoint:', apiUrl);
  console.log('='.repeat(60));

  try {
    console.log('\n[1] Sending request to API...');
    const response = await axios.post(apiUrl, { url }, {
      timeout: 60000, // 60 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n[2] Response received:');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Method:', response.data.method);

    if (response.data.success) {
      console.log('\n✅ Article fetched successfully!');
      console.log('\nArticle Title:', response.data.content.title);
      console.log('Article Length:', response.data.content.length, 'characters');
      console.log('Author:', response.data.content.author || 'Not found');
      console.log('\nFirst 500 characters:');
      console.log('-'.repeat(60));
      console.log(response.data.content.text.substring(0, 500) + '...');
      console.log('-'.repeat(60));
    } else {
      console.log('\n❌ Failed to fetch article');
      console.log('Error:', response.data.error);
    }
  } catch (error) {
    if (error.response) {
      console.log('\n❌ API Error Response:');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else if (error.request) {
      console.log('\n❌ Network Error:');
      console.log('Could not connect to API. Is the server running?');
      console.log('Start server with: npm start');
    } else {
      console.log('\n❌ Error:', error.message);
    }
  }
}

testWSJAPI();

