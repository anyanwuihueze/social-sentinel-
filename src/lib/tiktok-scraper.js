import puppeteer from 'puppeteer';
import { launchArgs } from './puppeteer-config.js';
import { supabase } from './supabase.js';
import { score } from './sentiment.js';

let page;

export async function startTikTok(userProxy) {
  const browser = await puppeteer.launch(launchArgs({ headless: false, proxyUrl: userProxy }));
  page = await browser.newPage();
}

export async function searchHashtag(tag) {
  await page.goto(`https://tiktok.com/tag/${tag.replace('#', '')}`, { waitUntil: 'networkidle2' });
  await page.waitForSelector('[data-e2e="video-card"]', { timeout: 10_000 });
}

export async function scrapeAndReply(template, sentimentThresh, dailyMax, log) {
  let commented = 0;
  const videos = await page.$$('[data-e2e="video-card"]');
  for (const v of videos.slice(0, Math.min(dailyMax, 5))) {
    await v.click();
    await page.waitForTimeout(3000);
    await page.click('[data-e2e="comment-button"]');
    await page.waitForSelector('[data-e2e="comment-text"]', { timeout: 5000 });

    const comments = await page.$$eval('[data-e2e="comment-text"]', nodes =>
      nodes.map(n => ({
        text: n.innerText,
        author: n.closest('[data-e2e="comment-item"]')?.querySelector('a')?.href?.split('@')?.[1] || 'unknown'
      }))
    );

    for (const c of comments) {
      const sent = score(c.text);
      log({ platform: 'TT', author: c.author, text: c.text, sentiment: sent });
      await supabase.from('visa_comments').insert({ video_id: 'temp', hashtag: 'usvisa', author: c.author, comment_text: c.text, sentiment: sent });

      if (sent < sentimentThresh && commented < dailyMax) {
        const reply = template.replace('{author}', c.author);
        await page.type('[data-e2e="comment-input"]', reply);
        await page.keyboard.press('Enter');
        await supabase.from('visa_comments').update({ our_reply: reply }).eq('author', c.author).eq('comment_text', c.text);
        log({ platform: 'TT', action: 'replied', text: reply });
        commented++;
        await delay(rand(30, 120));
      }
    }
    await page.goBack();
  }
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function delay(ms) { return new Promise(res => setTimeout(res, ms)); }
