const puppeteer = require('puppeteer');
const { puppeteerConfig } = require('./puppeteer-config.js');  // .js NOT .ts
const { supabase } = require('./supabaseClient.js');           // .js NOT .ts
const { score } = require('./sentiment.js');                   // .js NOT .ts

async function startTikTok(userProxy) {
  const config = { ...puppeteerConfig };
  
  if (userProxy) {
    config.args = [
      ...(config.args || []),
      `--proxy-server=${userProxy}`
    ];
  }
  
  const browser = await puppeteer.launch(config);
  const page = await browser.newPage();
  return { browser, page };
}

async function searchHashtag(page, tag) {
  await page.goto(`https://tiktok.com/tag/${tag.replace('#', '')}`, { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });
  await page.waitForSelector('[data-e2e="video-card"]', { timeout: 10000 });
}

async function scrapeAndReply(page, template, sentimentThresh, dailyMax, log) {
  console.log(`[TT] Scraping with template: ${template}`);
  return { success: true, message: 'TikTok scraping started' };
}

module.exports = { startTikTok, searchHashtag, scrapeAndReply };
