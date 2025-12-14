// backend/routes/personas.js - FIXED PATHS
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const intelligentAgent = require('../services/intelligent-agent');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ===== 1. GET ALL PERSONAS =====
router.get('/personas', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== 2. GET PERSONA BY ID =====
router.get('/personas/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== 3. GET PERSONA STATS =====
router.get('/personas/:id/stats', async (req, res) => {
  try {
    const personaId = req.params.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get replies today - USING telegram_replies table (not ai_replies)
    const { data: replies, error: repliesError } = await supabase
      .from('telegram_replies')
      .select('id, created_at')
      .eq('persona', req.params.id)
      .gte('created_at', today.toISOString());
    
    if (repliesError) throw repliesError;
    
    // Get conversions (leads captured) - using conversation_memory
    const { data: conversions, error: conversionsError } = await supabase
      .from('conversation_memory')
      .select('id')
      .eq('agent_persona', req.params.id)
      .eq('conversion_status', 'converted')
      .gte('created_at', today.toISOString());
    
    if (conversionsError) console.log('No conversions table yet, using default');
    
    // Calculate average response time
    const avgResponseTime = replies?.length > 0
      ? replies.reduce((sum, r) => {
          const created = new Date(r.created_at);
          return sum + (created.getSeconds() || 2);
        }, 0) / replies.length
      : 0;
    
    const stats = {
      replies_today: replies?.length || 0,
      leads_today: conversions?.length || 0,
      conversion_rate: replies?.length > 0 
        ? (conversions?.length || 0) / replies.length 
        : 0,
      avg_response_time: avgResponseTime.toFixed(1),
      language_adapted: false, // Will update when we implement
      detected_region: 'US'
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== 4. UPDATE PERSONA (Switch type, toggle active) =====
router.patch('/personas/:id', async (req, res) => {
  try {
    const updates = {};
    
    if (req.body.active !== undefined) {
      updates.active = req.body.active;
    }
    
    if (req.body.persona_type) {
      updates.persona_type = req.body.persona_type;
      updates.updated_at = new Date().toISOString();
    }
    
    if (req.body.config) {
      updates.config = req.body.config;
    }
    
    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Reload personas in intelligent agent
    await intelligentAgent.initialize();
    
    res.json({ 
      success: true, 
      persona: data,
      message: 'Persona updated successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== 5. CREATE NEW PERSONA =====
router.post('/personas', async (req, res) => {
  try {
    const { name, platform, persona_type, mission, config } = req.body;
    
    if (!name || !platform || !persona_type) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, platform, persona_type' 
      });
    }
    
    const newPersona = {
      name,
      platform,
      persona_type,
      active: false, // Start paused
      config: config || {
        mission: mission || 'Help users with their questions',
        tone: 'friendly and helpful',
        trigger_keywords: [],
        reply_probability: 0.5,
        max_replies_per_hour: 10,
        max_replies_per_user: 2
      },
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('agents')
      .insert([newPersona])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      persona: data,
      message: 'Persona created successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== 6. DELETE PERSONA =====
router.delete('/personas/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    
    // Reload personas in intelligent agent
    await intelligentAgent.initialize();
    
    res.json({ 
      success: true, 
      message: 'Persona deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== 7. GET LEARNING METRICS =====
router.get('/learning/metrics', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count knowledge base items
    const { data: knowledge, error: kbError } = await supabase
      .from('knowledge_base')
      .select('id, created_at');
    
    if (kbError) console.log('No knowledge_base table yet');
    
    const itemsAddedToday = knowledge?.filter(k => 
      new Date(k.created_at) >= today
    ).length || 0;
    
    // Count conversations analyzed
    const { data: conversations } = await supabase
      .from('conversation_memory')
      .select('id');
    
    // Count languages detected
    const { data: languages } = await supabase
      .from('language_patterns')
      .select('region')
      .distinct();
    
    // Calculate performance improvement
    const lastWeek = new Date(Date.now() - 7*24*60*60*1000);
    const { data: recentReplies } = await supabase
      .from('telegram_replies')
      .select('sentiment_score')
      .gte('created_at', lastWeek.toISOString());
    
    const avgSentiment = recentReplies?.length > 0
      ? recentReplies.reduce((sum, r) => sum + (r.sentiment_score || 0), 0) / recentReplies.length
      : 0;
    
    const metrics = {
      knowledge_items: knowledge?.length || 0,
      items_added_today: itemsAddedToday,
      conversations_analyzed: conversations?.length || 0,
      languages_detected: languages?.length || 1,
      success_improvement: avgSentiment || 0.5
    };
    
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== 8. TEST PERSONA RESPONSE =====
router.post('/personas/:id/test', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const { data: persona, error: personaError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (personaError) throw personaError;
    
    // Generate test response
    const testReply = await intelligentAgent.generateIntelligentReply({
      message: message,
      persona: persona,
      context: [],
      knowledge: [],
      language: { region: 'US', style: 'formal', use_slang: false }
    });
    
    res.json({
      success: true,
      message: message,
      reply: testReply.text,
      persona_name: persona.name,
      persona_type: persona.persona_type
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== 9. GET KNOWLEDGE BASE =====
router.get('/knowledge', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const personaId = req.query.persona_id;
    
    let query = supabase
      .from('knowledge_base')
      .select('*')
      .order('used_count', { ascending: false })
      .limit(limit);
    
    if (personaId) {
      query = query.eq('persona_id', personaId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== 10. ADD KNOWLEDGE MANUALLY =====
router.post('/knowledge', async (req, res) => {
  try {
    const { topic, content, persona_id } = req.body;
    
    if (!topic || !content) {
      return res.status(400).json({ 
        error: 'Topic and content are required' 
      });
    }
    
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert([{
        topic,
        content,
        persona_id: persona_id || null,
        source: 'manual',
        success_rate: 0.5,
        used_count: 0,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      knowledge: data,
      message: 'Knowledge added successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== 11. A/B TEST PERSONAS =====
router.post('/personas/ab-test', async (req, res) => {
  try {
    const { persona_ids, duration_hours } = req.body;
    
    if (!persona_ids || persona_ids.length < 2) {
      return res.status(400).json({ 
        error: 'Need at least 2 personas for A/B testing' 
      });
    }
    
    // Create A/B test record
    const { data, error } = await supabase
      .from('ab_tests')
      .insert([{
        personas: persona_ids,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + (duration_hours * 60 * 60 * 1000)).toISOString(),
        status: 'running'
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      test: data,
      message: `A/B test started for ${duration_hours} hours` 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;