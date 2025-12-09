import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req) {
  const { proxyUrl } = await req.json();
  if (!proxyUrl) return NextResponse.json({ status: 'disconnected', ip: null });

  const browser = await puppeteer.launch({
    headless: true,
    args: [`--proxy-server=${proxyUrl}`]
  });
  const page = await browser.newPage();
  try {
    await page.goto('https://api.ipify.org?format=json', { waitUntil: 'domcontentloaded', timeout: 8000 });
    const { ip } = await page.json();
    await browser.close();
    return NextResponse.json({ status: 'ok', ip, proxyUrl });
  } catch (e) {
    await browser.close();
    return NextResponse.json({ status: 'fail', error: e.message, proxyUrl });
  }
}
