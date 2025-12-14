const express = require('express');
const { spawn } = require('child_process');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client (using YOUR credentials)
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://kodyzhrykckevpxejbyd.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Import your intelligent agent and routes
const IntelligentAgent = require('./backend/services/intelligent-agent');
const intelligentAgent = new IntelligentAgent();
const personasRouter = require('./backend/routes/personas');

// Mount persona routes
app.use('/api', personasRouter);

// Store Telegram bridge process
let telegramBridge = null;
let agentConfig = {
  keywords: ['visa', 'interview', 'appointment', 'embassy', 'denied', 'rejected'],
  persona: 'peer',
  sentimentThreshold: -0.3,
  maxRepliesPerHour: 10,
  replyCount: 0,
  aiEnabled: true,
  totalMessages: 0,
  totalReplies: 0,
  leadsGenerated: 0
};

// ===== 1. TELEGRAM BRIDGE SETUP =====
function startTelegramBridge() {
  console.log('🤖 Starting Telegram API bridge...');
  
  telegramBridge = spawn('/opt/venv/bin/python3', ['telegram-listener.py'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env
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
async function handleTelegramEvent(event) {
  switch (event.type) {
    case 'ready':
      console.log('✅ Connected to Telegram!');
      break;
      
    case 'message':
      await processIncomingMessage(event);
      break;
      
    case 'error':
      console.error('❌ Telegram error:', event.msg);
      break;
  }
}

// ===== 3. MESSAGE PROCESSING WITH INTELLIGENT AGENT =====
async function processIncomingMessage(message) {
  agentConfig.totalMessages++;
  
  const text = (message.text || '').toLowerCase();
  const hasKeyword = agentConfig.keywords.some(k => text.includes(k));
  
  if (!hasKeyword) return;

  console.log(`📨 Keyword detected: "${message.text.substring(0, 60)}..."`);

  // Save to Supabase
  await saveMessage(message);

  // Analyze sentiment
  const sentimentScore = analyzeSentiment(message.text);
  
  // Only reply if frustrated or needs help
  if (sentimentScore > agentConfig.sentimentThreshold) {
    console.log(`⏭️ Skipped (sentiment ${sentimentScore} > ${agentConfig.sentimentThreshold})`);
    return;
  }

  // Rate limiting
  if (agentConfig.replyCount >= agentConfig.maxRepliesPerHour) {
    console.log('⏸️ Rate limit reached');
    return;
  }

  // Use intelligent agent to generate reply
  try {
    const aiReply = await intelligentAgent.generateIntelligentReply({
      message: message.text,
      persona: { name: agentConfig.persona, persona_type: agentConfig.persona },
      context: [],
      knowledge: [],
      language: { region: 'US', style: 'formal', use_slang: false }
    });
    
    // Send reply
    sendTelegramMessage(message.chat_id, aiReply.text);
    
    // Save reply
    await saveReply(message, aiReply.text, sentimentScore);
    
    agentConfig.replyCount++;
    agentConfig.totalReplies++;
    
    console.log(`🤖 ${agentConfig.persona} replied: ${aiReply.text.substring(0, 50)}...`);
  } catch (error) {
    console.error('AI reply failed:', error);
  }
}

// ===== 4. HELPER FUNCTIONS =====
function sendTelegramMessage(chatId, text) {
  if (!telegramBridge || !telegramBridge.stdin.writable) return false;
  
  const cmd = JSON.stringify({
    action: 'send',
    chat_id: chatId,
    text: text
  });
  
  telegramBridge.stdin.write(cmd + '\n');
  return true;
}

function analyzeSentiment(text) {
  const negativeWords = ['denied', 'rejected', 'frustrated', 'confused', 'stuck', 'failed'];
  const positiveWords = ['approved', 'success', 'thanks', 'helpful'];
  
  let score = 0;
  const lower = text.toLowerCase();
  
  negativeWords.forEach(word => { if (lower.includes(word)) score -= 0.2; });
  positiveWords.forEach(word => { if (lower.includes(word)) score += 0.2; });
  
  return Math.max(-1, Math.min(1, score));
}

async function saveMessage(event) {
  try {
    await supabase.from('telegram_messages').insert({
      chat_id: event.chat_id.toString(),
      sender_id: event.sender_id.toString(),
      sender_username: event.sender_username || null,
      message_text: event.text,
      message_date: event.date,
      has_keyword: true
    });
  } catch (error) {
    console.error('Failed to save message:', error.message);
  }
}

async function saveReply(event, replyText, sentiment) {
  try {
    await supabase.from('telegram_replies').insert({
      chat_id: event.chat_id.toString(),
      original_message: event.text,
      reply_text: replyText,
      persona: agentConfig.persona,
      sentiment_score: sentiment
    });
  } catch (error) {
    console.error('Failed to save reply:', error.message);
  }
}

// ===== 5. EXPRESS ENDPOINTS (Your existing + new) =====

// Health check
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    telegram: telegramBridge ? 'connected' : 'stopped',
    config: agentConfig
  });
});

// Start agent
app.get('/start', (req, res) => {
  startTelegramBridge();
  res.json({ success: true, message: 'Agent started' });
});

// Stop agent
app.get('/stop', (req, res) => {
  if (telegramBridge) {
    telegramBridge.kill();
    telegramBridge = null;
  }
  res.json({ success: true, message: 'Agent stopped' });
});

// Config endpoints (your existing)
app.post('/config', (req, res) => {
  if (req.body.keywords) agentConfig.keywords = req.body.keywords;
  if (req.body.persona) agentConfig.persona = req.body.persona;
  if (req.body.sentimentThreshold !== undefined) agentConfig.sentimentThreshold = req.body.sentimentThreshold;
  if (req.body.maxReplies) agentConfig.maxRepliesPerHour = req.body.maxReplies;
  if (req.body.aiEnabled !== undefined) agentConfig.aiEnabled = req.body.aiEnabled;
  
  res.json({ success: true, config: agentConfig });
});

app.get('/config', (req, res) => {
  res.json({ success: true, config: agentConfig });
});

// Stats
app.get('/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      status: telegramBridge ? 'connected' : 'stopped',
      totalMessages: agentConfig.totalMessages,
      totalReplies: agentConfig.totalReplies,
      leadsGenerated: agentConfig.leadsGenerated,
      repliesThisHour: agentConfig.replyCount,
      maxReplies: agentConfig.maxRepliesPerHour,
      persona: agentConfig.persona,
      aiEnabled: agentConfig.aiEnabled
    }
  });
});

// Test AI
app.post('/test-ai', async (req, res) => {
  const { text, persona } = req.body;
  try {
    const aiReply = await intelligentAgent.generateIntelligentReply({
      message: text,
      persona: { name: persona || agentConfig.persona, persona_type: persona || agentConfig.persona },
      context: [],
      knowledge: [],
      language: { region: 'US', style: 'formal', use_slang: false }
    });
    res.json({ success: true, reply: aiReply.text });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Messages endpoint
app.get('/messages', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const { data, error } = await supabase
      .from('telegram_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    res.json({ success: true, messages: data });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ===== 6. SERVER STARTUP =====
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`🌐 Health: https://social-agents-1765342327.fly.dev/health`);
  console.log(`🎭 Personas API: https://social-agents-1765342327.fly.dev/api/personas`);
  
  // Initialize intelligent agent
  intelligentAgent.initialize().then(count => {
    console.log(`🧠 Intelligent agent initialized with ${count} personas`);
  });
  
  // Auto-start Telegram bridge
  setTimeout(() => {
    console.log('Auto-starting Telegram...');
    startTelegramBridge();
  }, 5000);
});