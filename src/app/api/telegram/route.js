import { NextRequest } from 'next/server';
import { startTelegram, joinGroup, monitorGroups } from '@/lib/telegram-scraper';
import { logSSE } from '@/lib/sse';

export async function POST(req: NextRequest) {
  const { proxy, groups, keywords, persona, sentimentThresh, dailyMax } = await req.json();
  await startTelegram(proxy);
  for (const g of groups.split(',')) await joinGroup(g.trim());
  monitorGroups(keywords, persona, sentimentThresh, dailyMax, logSSE);
  return Response.json({ status: 'TG monitor started' });
}
