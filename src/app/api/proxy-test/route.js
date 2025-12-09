import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { launchArgs } from '@/lib/puppeteer-config';

export async function POST(req: Request) {
  const { proxyUrl } = await req.json();
  if (!proxyUrl) return NextResponse.json({ status: 'disconnected', ip: null });

  const browser = await puppeteer.launch(launchArgs({ proxyUrl, headless: true }));
  const page = await browser.newPage();
  try {
    await page.goto('https://api.ipify.org?format=json', { waitUntil: 'domcontentloaded', timeout: 8000 });
    const { ip } = await page.json();
    await browser.close();
    return NextResponse.json({ status: 'ok', ip, proxyUrl });
  } catch (e: any) {
    await browser.close();
    return NextResponse.json({ status: 'fail', error: e.message, proxyUrl });
  }
}
