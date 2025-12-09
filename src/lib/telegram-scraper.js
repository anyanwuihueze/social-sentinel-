import { launchArgs } from './puppeteer-config.js';
import { supabase } from './supabase.js';
import { score } from './sentiment.js';
import puppeteer from 'puppeteer';

let browser;
let page;

export async function startTelegram(userProxy) {
  browser = await puppeteer.launch(launchArgs({ headless: false, proxyUrl: userProxy }));
  page = await browser.newPage();
  await page.goto('https://web.telegram.org', { waitUntil: 'networkidle2' });

  // wait for QR scan
  await page.waitForSelector('canvas', { timeout: 0 });
  console.log('[TG] QR shown – scan with phone');
  await page.waitForSelector('input[placeholder*="Search"]', { timeout: 0 });
  console.log('[TG] Logged in');
}

export async function joinGroup(inviteLink) {
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
  const kw = keywords.split(',').map(k => k.trim().toLowerCase());
  let today = 0;

  setInterval(async () => {
    if (today >= dailyMax) return;
    const msgs = await page.$$eval('.message', nodes =>
      nodes.slice(-10).map(n => ({
        text: n.innerText,
        user: n.querySelector('.user')?.innerText || 'unknown',
      }))
    );
    for (const m of msgs) {
      if (!m.text) continue;
      const txt = m.text.toLowerCase();
      if (!kw.some(k => txt.includes(k))) continue;
      const sent = score(m.text);
      log({ platform: 'TG', user: m.user, text: m.text, sentiment: sent });
      await supabase.from('telegram_msgs').insert({ chat_title: 'group', username: m.user, message_text: m.text, sentiment: sent });

      if (sent < sentimentThresh) {
        const reply = genReply(persona, sent);
        await page.type('div[contenteditable="true"]', reply);
        await page.keyboard.press('Enter');
        await supabase.from('telegram_msgs').update({ bot_reply: reply }).eq('username', m.user).eq('message_text', m.text);
        log({ platform: 'TG', action: 'replied', text: reply });
        today++;
        await delay(rand(15, 45));
      }
    }
  }, 5000);
}

function genReply(persona, sent) {
  const map = {
    Friendly: "Hang in there—this helped me 👉",
    Expert: "Based on what you wrote, you might find this useful:",
    Peer: "I was in the same boat—check this out:",
  };
  return map[persona] || map.Peer;
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function delay(ms) { return new Promise(res => setTimeout(res, ms)); }
