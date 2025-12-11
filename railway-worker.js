const express = require('express');
const { startTelegram } = require('./src/lib/telegram-scraper.js');

const app = express();
const PORT = process.env.PORT || 3001;

// Store instances
let telegramInstance = null;

app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    telegram: telegramInstance ? 'initialized' : 'stopped'
  });
});

app.get('/start', async (req, res) => {
  console.log('�� /start endpoint called');
  
  const PROXY_URL = process.env.PROXY_URL;
  if (!PROXY_URL) {
    return res.json({ error: 'No PROXY_URL set in environment' });
  }
  
  try {
    console.log('Starting Telegram with proxy...');
    
    // Start WITHOUT waiting for full initialization
    // Let it run in background
    startTelegram(PROXY_URL).then(result => {
      telegramInstance = result;
      console.log('✅ Telegram initialized in background');
    }).catch(err => {
      console.error('Background Telegram error:', err.message);
    });
    
    res.json({
      success: true,
      message: 'Telegram scraper starting in background',
      proxy: 'configured',
      check_logs: 'true'
    });
    
  } catch (error) {
    console.error('Start endpoint error:', error.message);
    res.json({ 
      success: false, 
      error: error.message.substring(0, 100) 
    });
  }
});

app.get('/status', (req, res) => {
  res.json({
    running: true,
    telegram: telegramInstance ? 'background_initializing' : 'not_started',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`🌐 Health: https://social-agents-1765342327.fly.dev/health`);
  console.log(`🚀 Start scrapers: https://social-agents-1765342327.fly.dev/start`);
  
  // Auto-start after 5 seconds
  setTimeout(() => {
    const PROXY_URL = process.env.PROXY_URL;
    if (PROXY_URL) {
      console.log('Auto-starting Telegram with proxy...');
      startTelegram(PROXY_URL).then(r => {
        telegramInstance = r;
        console.log('✅ Auto-started successfully');
      }).catch(e => {
        console.error('Auto-start failed:', e.message);
      });
    }
  }, 5000);
});
