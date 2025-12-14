const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');

(async () => {
  console.log('🚀 Launching browser for manual Telegram login...');
  console.log('⚠️  IMPORTANT: This will open a VISIBLE browser on the server.');
  
  const browser = await puppeteer.launch({
    headless: false,  // MUST be false to see and interact
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.CHROMIUM_PATH || undefined
  });
  
  const page = await browser.newPage();
  await page.goto('https://web.telegram.org');
  
  console.log('\n✅ Browser opened!');
  console.log('==========================================');
  console.log('MANUAL LOGIN REQUIRED:');
  console.log('1. In the browser window that appears:');
  console.log('2. Log into Telegram Web using:');
  console.log('   - QR code (scan with phone) OR');
  console.log('   - Phone number + SMS code');
  console.log('3. Wait until FULLY logged in (see chat list)');
  console.log('4. Come back here and press Enter');
  console.log('==========================================\n');
  
  // Wait for user confirmation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  await new Promise(resolve => {
    rl.question('Press Enter AFTER you are logged into Telegram in the browser...', () => {
      rl.close();
      resolve();
    });
  });
  
  // Get cookies
  const cookies = await page.cookies();
  console.log(`\n🍪 Captured ${cookies.length} cookies`);
  
  // Save to file
  fs.writeFileSync('telegram-cookies.json', JSON.stringify(cookies, null, 2));
  console.log('✅ Cookies saved to telegram-cookies.json');
  
  // Also show as base64 for easy copy
  const cookiesBase64 = Buffer.from(JSON.stringify(cookies)).toString('base64');
  console.log('\n📋 Base64 version (for fly secrets command):');
  console.log('==========================================');
  console.log(cookiesBase64);
  console.log('==========================================');
  
  await browser.close();
  console.log('\n🎉 Done! Now run:');
  console.log('fly secrets set TELEGRAM_COOKIES=\'PASTE_BASE64_ABOVE\' --app social-agents-1765342327');
})();
