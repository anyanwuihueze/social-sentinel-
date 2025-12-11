import express from 'express';
import cors from 'cors';
import { startTelegram, joinGroup, monitorGroups } from './src/lib/telegram-scraper.js';
import { startTikTok, searchHashtag, scrapeAndReply } from './src/lib/tiktok-scraper.js';
import { supabase } from './src/lib/supabase.js';

const app = express();
app.use(cors());
app.use(express.json());

let tgPage, tkPage;

/* ---------- Telegram ---------- */
app.post('/telegram/start', async (req, res) => {
  const { proxy, groups, keywords, persona, sentimentThresh, dailyMax } = req.body;
  await startTelegram(proxy);
  for (const g of groups.split(',')) await joinGroup(g.trim());
  monitorGroups(keywords, persona, sentimentThresh, dailyMax, console.log);
  res.json({ status: 'TG monitor started on Fly' });
});

/* ---------- TikTok ---------- */
app.post('/tiktok/start', async (req, res) => {
  const { proxy, hashtags, template, sentimentThresh, dailyMax } = req.body;
  await startTikTok(proxy);
  for (const t of hashtags.split(',')) {
    await searchHashtag(t.trim());
    await scrapeAndReply(template, sentimentThresh, dailyMax, console.log);
  }
  res.json({ status: 'TT monitor started on Fly' });
});

/* ---------- Health ---------- */
app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(3001, () => console.log('Fly Puppeteer server on :3001'));
