module.exports = {
  puppeteerConfig: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1280,720'
    ],
    defaultViewport: {
      width: 1280,
      height: 720
    },
    // Use the system-installed Chrome
    executablePath: '/usr/bin/google-chrome-stable',
    ignoreHTTPSErrors: true
  }
};