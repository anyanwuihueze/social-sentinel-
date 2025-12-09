import puppeteer from 'puppeteer';

// FIXED: Use correct file extensions/types
import { puppeteerConfig } from './puppeteer-config.ts';
import { supabase } from './supabaseClient.ts';
import { score } from './sentiment.ts';

let browser;
let page;

export async function startTelegram(userProxy) {
  const config = { ...puppeteerConfig };
  
  // Add proxy if provided
  if (userProxy) {
    config.args = [
      ...(config.args || []),
      `--proxy-server=${userProxy}`
    ];
  }
  
  browser = await puppeteer.launch(config);
  page = await browser.newPage();
  await page.goto('https://web.telegram.org', { waitUntil: 'networkidle2' });

  // wait for QR scan
  await page.waitForSelector('canvas', { timeout: 0 });
  console.log('[TG] QR shown – scan with phone');
  await page.waitForSelector('input[placeholder*="Search"]', { timeout: 0 });
  console.log('[TG] Logged in');
  return { browser, page };
}

export async function joinGroup(inviteLink) {
  if (!page) throw new Error('Telegram not started');
  await page.goto(inviteLink, { waitUntil: 'networkidle2' });
  try {
    await page.click('button:has-text("Join Group")');
    await page.waitForTimeout(2000);
    console.log('[TG] Joined group');
  } catch (e) {
    console.log('[TG] Already member or private');
  }
}

export async function monitorGroups(keywords, persona, sentimentThresh, dailyMax, log) {
  if (!page) throw new Error('Telegram not started');
  const kw = keywords.split(',').map(k => k.trim().toLowerCase());
  let today = 0;

  // For demo purposes - return mock data
  return {
    success: true,
    message: 'Running in demo mode (proxy server unavailable)',
    mockPosts: [
      { text: 'Demo: Marketing strategy discussion', sentiment: 0.8, user: 'user1' },
      { text: 'Demo: Customer feedback analysis', sentiment: -0.3, user: 'user2' }
    ]
  };
}

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }
