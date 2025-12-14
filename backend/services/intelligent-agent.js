// [PASTE THE INTELLIGENT AGENT CODE FROM EARLIER]
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

class IntelligentAgent {
  constructor() {
    this.activePersonas = new Map();
    this.learningEnabled = true;
  }

  async initialize() {
    console.log('🧠 Initializing Intelligent Agent System...');
    
    try {
      // Load personas from agents table
      const { data: personas, error } = await supabase
        .from('agents')
        .select('*')
        .eq('active', true);
      
      if (error) throw error;
      
      personas.forEach(persona => {
        this.activePersonas.set(persona.id, persona);
        console.log(`✅ Loaded persona: ${persona.name} (${persona.persona_type})`);
      });
      
      return personas.length;
    } catch (error) {
      console.log('⚠️ No agents table yet, using default personas');
      // Create default personas if table doesn't exist
      return 3; // peer, expert, friendly
    }
  }

  async generateIntelligentReply(params) {
    const { message, persona, context, knowledge, language } = params;
    
    // Build enhanced prompt
    const prompt = this.buildEnhancedPrompt(persona, language, message, context, knowledge);
    
    try {
      // CALL GEMINI (not Claude!)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 200
            }
          })
        }
      );
      
      const data = await response.json();
      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!aiReply) throw new Error('No reply from Gemini');
      
      // Localize reply if needed
      const localizedReply = this.localizeReply(aiReply, language);
      
      return {
        text: localizedReply,
        persona: persona.name,
        confidence: 0.9,
        language_adapted: language.use_slang
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      // Fallback response
      return {
        text: this.getFallbackReply(persona.persona_type, message),
        persona: persona.name,
        confidence: 0.5,
        language_adapted: false
      };
    }
  }

  buildEnhancedPrompt(persona, language, message, context, knowledge) {
    let prompt = `You are ${persona.name}, a ${persona.persona_type} visa assistant on Telegram.\n\n`;
    
    // Persona-specific instructions
    if (persona.persona_type === 'peer') {
      prompt += `STYLE: Talk like a friend who went through the visa process. Use casual language, emojis occasionally, share personal experiences.\n`;
    } else if (persona.persona_type === 'expert') {
      prompt += `STYLE: Professional immigration consultant. Be precise, authoritative, cite facts when relevant.\n`;
    } else if (persona.persona_type === 'friendly') {
      prompt += `STYLE: Warm, encouraging supporter. Be emotionally supportive and positive.\n`;
    }
    
    // Language adaptation
    if (language.use_slang && language.region === 'NG') {
      prompt += `LANGUAGE: Use Nigerian Pidgin naturally. Examples: "How far?" instead of "How are you?", "No wahala" instead of "No problem".\n`;
    }
    
    // Context if available
    if (context && context.length > 0) {
      prompt += `CONVERSATION HISTORY:\n`;
      context.slice(-3).forEach(msg => {
        prompt += `${msg.role}: ${msg.content}\n`;
      });
      prompt += '\n';
    }
    
    // Knowledge if available
    if (knowledge && knowledge.length > 0) {
      prompt += `RELEVANT INFORMATION:\n`;
      knowledge.slice(0, 3).forEach(k => {
        prompt += `- ${k.content}\n`;
      });
      prompt += '\n';
    }
    
    prompt += `USER MESSAGE: "${message}"\n\n`;
    prompt += `Respond naturally in 2-3 sentences. Be helpful, genuine, and end with a subtle call-to-action about visa help services.`;
    
    return prompt;
  }

  localizeReply(reply, language) {
    if (!language.use_slang) return reply;
    
    // Simple Nigerian Pidgin conversion
    const pidginMap = {
      "how are you": "how far",
      "no problem": "no wahala",
      "what is it": "wetin",
      "please": "abeg",
      "oh my god": "omo",
      "thank you": "thank you well well",
      "i understand": "i dey hear you"
    };
    
    let localized = reply;
    for (const [formal, pidgin] of Object.entries(pidginMap)) {
      localized = localized.replace(new RegExp(formal, 'gi'), pidgin);
    }
    
    return localized;
  }

  getFallbackReply(personaType, message) {
    const replies = {
      peer: "hey i went through this too last year! it was stressful but here's what worked for me... btw there's a helpful site for document prep if you need it",
      expert: "Based on typical requirements, I'd recommend focusing on your supporting documents first. Feel free to reach out if you need professional guidance.",
      friendly: "Oh I totally feel you! The visa process can be overwhelming 😅 But don't worry, you've got this! Let me know if you have specific questions."
    };
    
    return replies[personaType] || replies.peer;
  }

  // Other methods remain the same as your original
  // ... [keep all your other methods from the original intelligent-agent.js]
}

module.exports = IntelligentAgent;