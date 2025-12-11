import puppeteer from 'puppeteer';
import { launchArgs } from './src/lib/puppeteer-config.js';

const proxy = process.argv[2];
if (!proxy) { console.log('Usage: node test-proxy-cli.js http://user:pass@host:port'); process.exit(1); }

const browser = await puppeteer.launch(launchArgs({ proxyUrl: proxy, headless: true }));
const page = await browser.newPage();
try {
  await page.goto('https://api.ipify.org?format=json', { waitUntil: 'domcontentloaded', timeout: 8000 });
  const { ip } = await page.json();
  console.log('✅ Proxy OK – public IP:', ip);
} catch (e) {
  console.log('❌ Proxy fail:', e.message);
} finally {
  await browser.close();
}
