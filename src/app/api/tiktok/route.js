import { NextRequest } from 'next/server';
import { startTikTok, searchHashtag, scrapeAndReply } from '@/lib/tiktok-scraper';
import { logSSE } from '@/lib/sse';

export async function POST(req: NextRequest) {
  const { proxy, hashtags, template, sentimentThresh, dailyMax } = await req.json();
  await startTikTok(proxy);
  for (const tag of hashtags.split(',')) {
    await searchHashtag(tag.trim());
    await scrapeAndReply(template, sentimentThresh, dailyMax, logSSE);
  }
  return Response.json({ status: 'TT monitor started' });
}
