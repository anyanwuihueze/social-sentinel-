const express = require('express');
const { spawn } = require('child_process');
const readline = require('readline');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// ========== ENVIRONMENT FIX ==========
// Force Python virtual environment path
process.env.PATH = '/opt/venv/bin:' + process.env.PATH;
// =====================================

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize Group Manager
const GroupManager = require('./group-manager');
const groupManager = new GroupManager();

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://kodyzhrykckevpxejbyd.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZHl6aHJ5a2NrZXZweGVqYnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyODU2OTcsImV4cCI6MjA4MDg2MTY5N30.P9eahtzb4H31_Hvgz1pzefebv7bRI4hxj5YMT75uslE'
);

let telegramStatus = 'stopped';
let pythonProcess = null;
let agentConfig = {
  keywords: ['visa', 'interview', 'appointment', 'embassy', 'denied', 'rejected', 'travel', 'funds'],
  persona: 'peer',
  sentimentThreshold: -0.3,
  maxRepliesPerHour: 10,
  replyCount: 0,
  aiEnabled: true,
  totalMessages: 0,
  totalReplies: 0,
  leadsGenerated: 0,
  monitoredGroups: []
};

// ========== TELEGRAM BRIDGE ==========

function startTelegramBridge() {
  console.log('🚀 Starting Telegram API bridge...');
  telegramStatus = 'connecting';
  
  pythonProcess = spawn('/opt/venv/bin/python3', ['telegram-listener.py'], {
    env: { ...process.env, PATH: '/opt/venv/bin:' + process.env.PATH }
  });

  const rl = readline.createInterface({
    input: pythonProcess.stdout,
    crlfDelay: Infinity
  });

  rl.on('line', (line) => {
    try {
      const event = JSON.parse(line);
      
      if (event.type === 'ready') {
        console.log('✅ Connected to Telegram!');
        telegramStatus = 'connected';
      }
      
      if (event.type === 'message') {
        handleMessage(event);
      }
      
      if (event.type === 'error') {
        console.error('❌ Telegram error:', event.msg);
        telegramStatus = 'error';
      }
    } catch (e) {
      console.log('[TG]', line);
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error('[TG stderr]', data.toString());
  });

  pythonProcess.on('exit', (code) => {
    console.log(`Python process exited with code ${code}`);
    telegramStatus = 'stopped';
    pythonProcess = null;
  });
}

async function handleMessage(event) {
  try {
    // Check if group is monitored and active
    if (event.chat_id < 0) { // Negative IDs are groups
      const { data: group } = await supabase
        .from('monitored_groups')
        .select('active')
        .eq('group_id', event.chat_id.toString())
        .eq('active', true)
        .maybeSingle();

      if (!group) {
        console.log(`Group ${event.chat_id} not monitored or inactive, skipping...`);
        return;
      }
    }

    agentConfig.totalMessages++;
    
    const text = (event.text || '').toLowerCase();
    const hasKeyword = agentConfig.keywords.some(k => text.includes(k.toLowerCase()));
    
    if (!hasKeyword) return;

    console.log(`📨 Keyword detected in group ${event.chat_id}: "${event.text.substring(0, 60)}..."`);

    await saveMessage(event);

    const sentimentScore = analyzeSentiment(event.text);
    
    if (sentimentScore > agentConfig.sentimentThreshold) {
      console.log(`⏭️ Skipped (sentiment ${sentimentScore} > ${agentConfig.sentimentThreshold})`);
      return;
    }

    if (agentConfig.replyCount >= agentConfig.maxRepliesPerHour) {
      console.log('⏸️ Rate limit reached');
      return;
    }

    const isLead = isHighIntentLead(event.text, sentimentScore);
    if (isLead) {
      await saveLead(event, sentimentScore);
      agentConfig.leadsGenerated++;
    }

    const reply = await generateAIReply(event.text, agentConfig.persona);
    
    sendMessage(event.chat_id, reply);
    
    await saveReply(event, reply, sentimentScore);
    
    agentConfig.replyCount++;
    agentConfig.totalReplies++;
    
    // Update group stats
    if (event.chat_id < 0) {
      const statsUpdate = {
        messages_received: 1,
        messages_replied: 1,
        leads_generated: isLead ? 1 : 0
      };
      
      try {
        await groupManager.updateGroupStats(event.chat_id.toString(), statsUpdate);
      } catch (err) {
        console.error('Failed to update group stats:', err.message);
      }
    }
    
    setTimeout(() => {
      agentConfig.replyCount = Math.max(0, agentConfig.replyCount - 1);
    }, 60 * 60 * 1000);
    
  } catch (error) {
    console.error('Error handling message:', error);
  }
}

function analyzeSentiment(text) {
  const negativeWords = ['denied', 'rejected', 'frustrated', 'confused', 'stuck', 'failed', 'help', 'problem', 'issue', 'difficult', 'hard'];
  const positiveWords = ['approved', 'success', 'got it', 'thanks', 'helpful', 'great'];
  
  let score = 0;
  const lower = text.toLowerCase();
  
  negativeWords.forEach(word => {
    if (lower.includes(word)) score -= 0.2;
  });
  
  positiveWords.forEach(word => {
    if (lower.includes(word)) score += 0.2;
  });
  
  return Math.max(-1, Math.min(1, score));
}

function isHighIntentLead(text, sentiment) {
  const highIntentPhrases = [
    'need help', 'looking for', 'anyone know', 'how to', 'what should', 
    'consultant', 'advice', 'guide', 'lawyer', 'agent'
  ];
  
  const lower = text.toLowerCase();
  const hasIntent = highIntentPhrases.some(phrase => lower.includes(phrase));
  const isFrustrated = sentiment < -0.4;
  
  return hasIntent || isFrustrated;
}

async function generateAIReply(messageText, persona) {
  if (!agentConfig.aiEnabled || !process.env.GEMINI_API_KEY) {
    return getFallbackReply(persona);
  }

  const personaPrompts = {
    peer: `You're a regular person who successfully got their visa last year. You're chatting casually in a Telegram group about visa processes. Be friendly, use lowercase sometimes, throw in an emoji occasionally (not every message), and share personal experience. Don't sound like a consultant or bot.

Someone said: "${messageText}"

Reply naturally in 2-3 sentences like you're texting a friend. At the end, subtly mention "btw there's this helpful site I used for document prep" without being pushy. Make it conversational, not salesy.`,

    expert: `You're an experienced immigration consultant who's helped hundreds get visas. You're professional but approachable. Someone in a Telegram group said: "${messageText}"

Provide helpful, specific advice in 2-3 sentences. At the end, mention "If you need detailed guidance, check out [your service]" in a professional way.`,

    friendly: `You're a super friendly person who loves helping others with visa processes. You're enthusiastic and supportive. Someone said: "${messageText}"

Respond warmly and encouragingly in 2-3 sentences, then softly suggest they check out your visa help service if they need more support.`
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: personaPrompts[persona] || personaPrompts.peer }]
          }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 200
          }
        })
      }
    );

    const data = await response.json();
    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (aiReply) {
      console.log('🤖 AI reply generated');
      return aiReply.trim();
    }
  } catch (error) {
    console.error('AI generation failed:', error.message);
  }

  return getFallbackReply(persona);
}

function getFallbackReply(persona) {
  const replies = {
    peer: "hey i went through this exact same thing last year! it was so stressful lol. what part are you stuck on? also i used this site for document prep that really helped if you wanna check it out",
    expert: "I understand your concern. Based on your situation, I'd recommend focusing on your supporting documents first. Feel free to reach out if you need professional guidance with your application.",
    friendly: "Oh I totally feel you! The visa process can be so overwhelming 😅 But don't worry, you got this! Let me know if you have specific questions, or check out some resources that might help!"
  };
  
  return replies[persona] || replies.peer;
}

async function saveMessage(event) {
  try {
    await supabase.from('telegram_messages').insert({
      chat_id: event.chat_id.toString(),
      sender_id: event.sender_id.toString(),
      sender_username: event.sender_username || null,
      message_text: event.text,
      message_date: event.date,
      has_keyword: true,
      is_group: event.chat_id < 0
    });
  } catch (error) {
    console.error('Failed to save message:', error.message);
  }
}

async function saveLead(event, sentiment) {
  try {
    await supabase.from('telegram_leads').insert({
      chat_id: event.chat_id.toString(),
      sender_id: event.sender_id.toString(),
      sender_username: event.sender_username || null,
      message_text: event.text,
      sentiment_score: sentiment,
      lead_score: sentiment < -0.6 ? 'hot' : sentiment < -0.3 ? 'warm' : 'cold',
      is_group: event.chat_id < 0
    });
    console.log('💡 Lead saved!');
  } catch (error) {
    console.error('Failed to save lead:', error.message);
  }
}

async function saveReply(event, replyText, sentiment) {
  try {
    await supabase.from('telegram_replies').insert({
      chat_id: event.chat_id.toString(),
      original_message: event.text,
      reply_text: replyText,
      persona: agentConfig.persona,
      sentiment_score: sentiment,
      is_group: event.chat_id < 0
    });
  } catch (error) {
    console.error('Failed to save reply:', error.message);
  }
}

function sendMessage(chatId, text) {
  if (!pythonProcess) return;
  const cmd = JSON.stringify({ action: 'send', chat_id: chatId, text: text });
  pythonProcess.stdin.write(cmd + '\n');
}

// ========== API ENDPOINTS ==========

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    telegram: telegramStatus,
    config: agentConfig
  });
});

app.get('/start', async (req, res) => {
  if (pythonProcess) {
    return res.json({ success: false, message: 'Already running', status: telegramStatus });
  }
  startTelegramBridge();
  res.json({ success: true, message: 'Starting agent', status: 'connecting' });
});

app.get('/stop', (req, res) => {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
    telegramStatus = 'stopped';
  }
  res.json({ success: true, message: 'Agent stopped' });
});

app.post('/config', (req, res) => {
  if (req.body.keywords) agentConfig.keywords = req.body.keywords;
  if (req.body.persona) agentConfig.persona = req.body.persona;
  if (req.body.sentimentThreshold !== undefined) agentConfig.sentimentThreshold = req.body.sentimentThreshold;
  if (req.body.maxReplies) agentConfig.maxRepliesPerHour = req.body.maxReplies;
  if (req.body.aiEnabled !== undefined) agentConfig.aiEnabled = req.body.aiEnabled;
  
  console.log('✅ Config updated:', agentConfig);
  res.json({ success: true, config: agentConfig });
});

app.get('/config', (req, res) => {
  res.json({ success: true, config: agentConfig });
});

app.get('/stats', async (req, res) => {
  try {
    // Get group count
    const { count: groupCount } = await supabase
      .from('monitored_groups')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);
    
    res.json({
      success: true,
      stats: {
        status: telegramStatus,
        totalMessages: agentConfig.totalMessages,
        totalReplies: agentConfig.totalReplies,
        leadsGenerated: agentConfig.leadsGenerated,
        repliesThisHour: agentConfig.replyCount,
        maxReplies: agentConfig.maxRepliesPerHour,
        persona: agentConfig.persona,
        aiEnabled: agentConfig.aiEnabled,
        activeGroups: groupCount || 0
      }
    });
  } catch (error) {
    res.json({
      success: true,
      stats: {
        status: telegramStatus,
        totalMessages: agentConfig.totalMessages,
        totalReplies: agentConfig.totalReplies,
        leadsGenerated: agentConfig.leadsGenerated,
        repliesThisHour: agentConfig.replyCount,
        maxReplies: agentConfig.maxRepliesPerHour,
        persona: agentConfig.persona,
        aiEnabled: agentConfig.aiEnabled,
        activeGroups: 'N/A'
      }
    });
  }
});

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

app.get('/leads', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('telegram_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    res.json({ success: true, leads: data });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/test-ai', async (req, res) => {
  const { text, persona } = req.body;
  const reply = await generateAIReply(text, persona || agentConfig.persona);
  res.json({ success: true, reply });
});

// ========== KEYWORDS API ==========

app.get('/api/keywords', (req, res) => {
  res.json({
    success: true,
    keywords: agentConfig.keywords,
    count: agentConfig.keywords.length
  });
});

app.post('/api/keywords', (req, res) => {
  const { keyword } = req.body;
  
  if (!keyword || typeof keyword !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Keyword must be a non-empty string' 
    });
  }
  
  const normalizedKeyword = keyword.toLowerCase().trim();
  
  if (!agentConfig.keywords.includes(normalizedKeyword)) {
    agentConfig.keywords.push(normalizedKeyword);
    console.log(`✅ Keyword added: "${normalizedKeyword}"`);
  }
  
  res.json({
    success: true,
    keyword: normalizedKeyword,
    keywords: agentConfig.keywords,
    message: `Keyword "${normalizedKeyword}" added successfully`
  });
});

app.delete('/api/keywords/:keyword', (req, res) => {
  const keyword = req.params.keyword.toLowerCase();
  
  const index = agentConfig.keywords.indexOf(keyword);
  if (index > -1) {
    agentConfig.keywords.splice(index, 1);
    console.log(`🗑️ Keyword removed: "${keyword}"`);
    
    res.json({
      success: true,
      keyword: keyword,
      keywords: agentConfig.keywords,
      message: `Keyword "${keyword}" removed successfully`
    });
  } else {
    res.status(404).json({
      success: false,
      error: `Keyword "${keyword}" not found`
    });
  }
});

app.delete('/api/keywords', (req, res) => {
  const oldCount = agentConfig.keywords.length;
  agentConfig.keywords = ['visa'];
  console.log(`🧹 Cleared ${oldCount - 1} keywords, kept default "visa"`);
  
  res.json({
    success: true,
    keywords: agentConfig.keywords,
    message: 'Cleared all keywords, kept default "visa"'
  });
});

// ========== GROUP MANAGEMENT API ==========

// 1. Join group by invite link
app.post('/api/groups/join', async (req, res) => {
  try {
    const { invite_link } = req.body;
    
    if (!invite_link) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invite link is required' 
      });
    }
    
    const result = await groupManager.joinGroup(invite_link);
    res.json(result);
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to join group' 
    });
  }
});

// 2. List monitored groups  
app.get('/api/groups', async (req, res) => {
  try {
    const activeOnly = req.query.active !== 'false';
    const groups = await groupManager.listGroups(activeOnly);
    res.json({ 
      success: true, 
      groups 
    });
  } catch (error) {
    console.error('List groups error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 3. Leave group
app.delete('/api/groups/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const result = await groupManager.leaveGroup(groupId);
    res.json(result);
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 4. Pause/resume group monitoring
app.patch('/api/groups/:groupId/monitoring', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { active } = req.body;
    
    if (typeof active !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        error: 'Active status is required (boolean)' 
      });
    }
    
    const result = await groupManager.toggleGroupMonitoring(groupId, active);
    res.json(result);
  } catch (error) {
    console.error('Toggle monitoring error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 5. Get group statistics
app.get('/api/groups/:groupId/stats', async (req, res) => {
  try {
    const { groupId } = req.params;
    const days = parseInt(req.query.days) || 7;
    
    const stats = await groupManager.getGroupStats(groupId, days);
    res.json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    console.error('Get group stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ========== SERVER STARTUP ==========

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`🌐 Health: https://social-agents-1765342327.fly.dev/health`);
  console.log(`🔑 Keywords API: https://social-agents-1765342327.fly.dev/api/keywords`);
  console.log(`👥 Groups API: https://social-agents-1765342327.fly.dev/api/groups`);
  
  setTimeout(() => {
    console.log('Auto-starting Telegram...');
    startTelegramBridge();
  }, 5000);
});
