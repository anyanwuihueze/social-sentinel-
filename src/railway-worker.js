// railway-worker.js
const { startTelegram } = require('./src/lib/telegram-scraper.js');
const { startTikTok } = require('./src/lib/tiktok-scraper.js');

async function main() {
  console.log('🚀 Starting social media scrapers on Railway...');
  
  // Use your Webshare proxy
  const PROXY_URL = 'http://ezkslitf:3y7xwh8up9vx@142.111.48.253:7030';
  
  // Start Telegram (this will fail if imports are broken)
  try {
    console.log('Starting Telegram scraper...');
    const telegram = await startTelegram(PROXY_URL);
    console.log('✅ Telegram scraper started');
  } catch (error) {
    console.error('❌ Telegram failed:', error.message);
  }
  
  // Start TikTok
  try {
    console.log('Starting TikTok scraper...');
    const tiktok = await startTikTok(PROXY_URL);
    console.log('✅ TikTok scraper started');
  } catch (error) {
    console.error('❌ TikTok failed:', error.message);
  }
  
  // Keep the process alive
  setInterval(() => {
    console.log('❤️  Scraper heartbeat:', new Date().toISOString());
  }, 60000);
}

main();