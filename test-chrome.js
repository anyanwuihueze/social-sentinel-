const puppeteer = require('puppeteer');

async function test() {
  console.log('Testing Chrome in Docker...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--shm-size=2gb'
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable'
  });
  
  console.log('✅ Chrome launched successfully');
  
  const page = await browser.newPage();
  await page.goto('https://api.ipify.org?format=json');
  const content = await page.content();
  console.log('Page content:', content);
  
  await browser.close();
  console.log('✅ Test completed');
}

test().catch(console.error);
