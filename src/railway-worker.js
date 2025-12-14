const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Store Telegram bridge process
let telegramBridge = null;

// ===== 1. TELEGRAM API BRIDGE SETUP =====
function startTelegramBridge() {
  console.log('🤖 Starting Telegram API bridge (Telethon)...');
  
  // CRITICAL FIX: Use virtual environment python
  telegramBridge = spawn('/opt/venv/bin/python', ['telegram_api_bridge.py'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      TELEGRAM_SESSION_STRING: process.env.TELEGRAM_SESSION_STRING || ''
    }
  });
  
  // Handle messages from Python
  telegramBridge.stdout.on('data', (data) => {
    try {
      const message = data.toString().trim();
      if (message) {
        const event = JSON.parse(message);
        handleTelegramEvent(event);
      }
    } catch (error) {
      console.error('Error parsing Telegram event:', error.message);
    }
  });
  
  telegramBridge.stderr.on('data', (data) => {
    console.error('Telegram Bridge Error:', data.toString());
  });
  
  telegramBridge.on('close', (code) => {
    console.log(`Telegram Bridge exited. Code: ${code}. Restarting in 5s...`);
    setTimeout(startTelegramBridge, 5000);
  });
}

// ===== 2. TELEGRAM EVENT HANDLER =====
function handleTelegramEvent(event) {
  console.log(`📨 [Telegram] ${event.type}`);
  
  switch (event.type) {
    case 'status':
      console.log(`✅ Connected as: ${event.user}`);
      break;
      
    case 'new_message':
      processIncomingMessage(event);
      break;
      
    case 'session_update':
      console.log('🔄 Session updated. Update your Fly.io secret if needed.');
      break;
      
    case 'error':
      console.error('❌ Telegram Error:', event.message);
      break;
      
    case 'joined_group':
      console.log(`✅ Joined group: ${event.group}`);
      break;
      
    case 'message_sent':
      console.log(`📤 Sent message to chat ${event.chat_id}`);
      break;
  }
}

// ===== 3. MESSAGE PROCESSING =====
async function processIncomingMessage(message) {
  // Your keywords from the UI
  const keywords = ['visa', 'us visa', 'interview', 'denied', 'schengen'];
  const foundKeywords = keywords.filter(kw => 
    message.text.toLowerCase().includes(kw.toLowerCase())
  );
  
  if (foundKeywords.length > 0) {
    console.log(`🔍 Keywords found: ${foundKeywords.join(', ')}`);
    
    // TODO: Add Supabase saving here
    // await supabase.from('messages').insert({...})
    
    // TODO: Add AI response logic here
    // if (shouldReply) {
    //   const aiReply = await generateAIResponse(message.text);
    //   sendTelegramMessage(message.chat_id, aiReply);
    // }
  }
}

// ===== 4. HELPER FUNCTIONS =====
function sendTelegramMessage(chatId, text) {
  if (!telegramBridge || !telegramBridge.stdin.writable) {
    console.error('Cannot send: Telegram bridge not ready');
    return false;
  }
  
  telegramBridge.stdin.write(JSON.stringify({
    type: 'send_message',
    chat_id: chatId,
    text: text
  }) + '\n');
  
  return true;
}

function joinTelegramGroup(inviteLink) {
  if (!telegramBridge || !telegramBridge.stdin.writable) {
    console.error('Cannot join: Telegram bridge not ready');
    return false;
  }
  
  telegramBridge.stdin.write(JSON.stringify({
    type: 'join_group',
    invite_link: inviteLink
  }) + '\n');
  
  return true;
}

// ===== 5. EXPRESS ENDPOINTS =====
app.get('/health', (req, res) => {
  const telegramStatus = telegramBridge ? 'connected' : 'stopped';
  res.json({ 
    ok: true, 
    status: 'healthy',
    telegram: telegramStatus,
    timestamp: new Date().toISOString()
  });
});

app.post('/start', (req, res) => {
  console.log('🚀 /start endpoint called');
  res.json({ 
    success: true, 
    message: 'Telegram bridge starting...',
    check_logs: true
  });
});

app.post('/join-group', (req, res) => {
  const { inviteLink } = req.body;
  
  if (!inviteLink) {
    return res.status(400).json({ error: 'Missing inviteLink' });
  }
  
  const success = joinTelegramGroup(inviteLink);
  
  res.json({ 
    success: success,
    message: success ? 'Joining group...' : 'Bridge not ready',
    inviteLink: inviteLink
  });
});

app.post('/send-message', (req, res) => {
  const { chatId, text } = req.body;
  
  if (!chatId || !text) {
    return res.status(400).json({ error: 'Missing chatId or text' });
  }
  
  const success = sendTelegramMessage(chatId, text);
  
  res.json({ 
    success: success,
    message: success ? 'Message sent...' : 'Bridge not ready'
  });
});

// ===== 6. SERVER STARTUP =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`🌐 Health: https://social-agents-1765342327.fly.dev/health`);
  console.log(`🚀 Start: https://social-agents-1765342327.fly.dev/start`);
  
  // Start the Telegram API bridge immediately
  startTelegramBridge();
});
