import type { PuppeteerLaunchOptions } from 'puppeteer';

export const puppeteerConfig: PuppeteerLaunchOptions = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process', // This is for containers
    '--disable-gpu',
    process.env.PROXY_URL ? `--proxy-server=${process.env.PROXY_URL}` : '',
  ].filter(Boolean),
  defaultViewport: {
    width: 1280,
    height: 720,
  },
  executablePath: process.env.NODE_ENV === 'production'
    ? process.env.PUPPETEER_EXECUTABLE_PATH
    : undefined,
};
