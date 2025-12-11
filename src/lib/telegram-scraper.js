const puppeteer = require('puppeteer');
const { puppeteerConfig } = require('./puppeteer-config.js');

async function startTelegram(userProxy) {
  console.log('[TG] Starting with proxy:', userProxy ? 'Yes' : 'No');
  
  // Parse proxy credentials if provided
  let proxyHost = null;
  let proxyUsername = null;
  let proxyPassword = null;
  
  if (userProxy) {
    // Extract credentials from proxy URL
    // Format: http://username:password@host:port
    const match = userProxy.match(/^https?:\/\/([^:]+):([^@]+)@(.+)$/);
    if (match) {
      proxyUsername = match[1];
      proxyPassword = match[2];
      proxyHost = `http://${match[3]}`; // Rebuild without credentials
      console.log('[TG] Parsed proxy - Host:', proxyHost);
    } else {
      proxyHost = userProxy; // No credentials in URL
    }
  }
  
  const config = {
    ...puppeteerConfig,
    args: [
      ...puppeteerConfig.args,
      // Add proxy WITHOUT credentials
      ...(proxyHost ? [`--proxy-server=${proxyHost}`] : [])
    ]
  };
  
  console.log('[TG] Launching browser...');
  const browser = await puppeteer.launch(config);
  const page = await browser.newPage();
  
  // Authenticate proxy AFTER page is created
  if (proxyUsername && proxyPassword) {
    console.log('[TG] Setting proxy authentication...');
    await page.authenticate({
      username: proxyUsername,
      password: proxyPassword
    });
  }
  
  // Set longer timeouts
  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(120000);
  
  try {
    console.log('[TG] Navigating to Telegram Web...');
    await page.goto('https://web.telegram.org', { 
      waitUntil: 'networkidle2',  // Changed to wait for more resources
      timeout: 120000 
    });
    
    console.log('[TG] ✅ Page loaded');
    
    // IMPROVED QR CODE DETECTION
    console.log('[TG] Checking login state...');
    
    // Wait for page to stabilize
    await page.waitForTimeout(3000);
    
    // Multiple ways to detect QR or login state
    const selectorsToCheck = [
      'canvas',  // Generic canvas (QR code)
      'div.qr-login',  // Telegram QR container
      'div.login-form',  // Login form (if not QR)
      'div.messages-container',  // Already logged in
      'div[aria-label="Scan me!"]',  // QR aria label
      'div.login-page',  // Login page wrapper
    ];
    
    let loginState = 'unknown';
    
    for (const selector of selectorsToCheck) {
      const element = await page.$(selector).catch(() => false);
      if (element) {
        if (selector.includes('canvas') || selector.includes('qr')) {
          loginState = 'qr_detected';
          console.log('[TG] 🟢 QR CODE DETECTED - Ready for scan!');
          console.log('[TG] Open Telegram app → Settings → Devices → Scan QR Code');
          break;
        } else if (selector.includes('messages')) {
          loginState = 'already_logged_in';
          console.log('[TG] ✅ ALREADY LOGGED IN - Ready to monitor!');
          break;
        }
      }
    }
    
    if (loginState === 'unknown') {
      // Take screenshot for debugging
      const screenshotPath = `/tmp/telegram-state-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`[TG] ⚠️ Unknown state - Screenshot saved to ${screenshotPath}`);
      console.log(`[TG] Current URL: ${page.url()}`);
      console.log(`[TG] Title: ${await page.title()}`);
    }
    
    return { browser, page, loginState };
    
  } catch (error) {
    console.error('[TG] ❌ Navigation failed:', error.message);
    await browser.close();
    throw error;
  }
}

async function joinGroup(inviteLink) {
  return { success: true, message: 'Join group placeholder' };
}

async function monitorGroups(keywords, persona, sentimentThresh, dailyMax, log) {
  return { success: true, message: 'Monitoring placeholder' };
}

module.exports = { startTelegram, joinGroup, monitorGroups };