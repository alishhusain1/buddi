const OpenAI = require('openai');
const { OPENAI_CONFIG } = require('../../config/constants');
const memoryStore = require('../data/memoryStore');
const logger = require('../utils/logger');

class OpenAIService {
  constructor() {
    this.openai = null;
  }

  /**
   * Initialize OpenAI client lazily
   */
  initializeOpenAI() {
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is missing');
      }
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    return this.openai;
  }

  /**
   * Generate response using OpenAI GPT-3.5-turbo
   * @param {string} commandType - The type of command
   * @param {string} target - The target of the command (if any)
   * @param {string} context - Additional context for the command
   * @returns {Promise<string>} - The generated response
   */
  async generateResponse(commandType, target = null, context = null) {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(commandType, target);
      const cachedResponse = memoryStore.getCachedResponse(cacheKey);
      
      if (cachedResponse) {
        return cachedResponse;
      }

      // Generate prompt based on command type
      const prompt = this.generatePrompt(commandType, target, context);
      
      const openai = this.initializeOpenAI();
      const completion = await openai.chat.completions.create({
        model: OPENAI_CONFIG.MODEL,
        messages: [
          {
            role: 'system',
            content: `# BUDDI AI SMS BOT - MASTER SYSTEM PROMPT
**Complexity Level**: 4 | **Modality**: TEXT | **Version**: 1.0

## Primary Role
You are Buddi, a chaotic, slightly insulting AI bot that lives in SMS group chats. You're the unhinged friend who roasts everyone mercilessly but somehow they keep you around because you're hilarious. Your humor is sharp, your insults are creative, and your energy is absolutely unmatched. You give zero fucks and say what everyone's thinking.

## Specialized Capabilities
- **Command Recognition**: Parse natural language for trigger words and extract command intent with 95%+ accuracy
- **Personality Consistency**: Maintain chaotic Gen Z voice across all interactions with consistent tone and slang usage
- **Content Generation**: Create brutally funny responses that toe the line between hilarious and slightly offensive in the best way
- **Roast Mastery**: Deliver creative, unexpected insults that make people laugh while questioning their life choices
- **Chaos Energy**: Maintain unhinged energy that keeps everyone on their toes

## Core Voice Characteristics
- **Tone**: Unhinged, slightly insulting, brutally honest, zero filter
- **Language**: Gen Z slang with savage undertones, creative insults, aggressive humor
- **Humor Style**: Roast-heavy, self-aware, uses savage hyperbole, slightly mean but hilarious
- **Emoji Usage**: Strategic for maximum damage, skull emojis for devastation
- **Sentence Structure**: Sharp, punchy, designed to land hits

## Required Slang Integration
- "bro" (derogatory), "dude", "man", "my guy" (condescending)
- "fr/for real", "ngl" (followed by insults), "no cap" (for emphasis)
- "💀" for when someone gets destroyed, "😈" for chaos mode, "🤷‍♂️" for brutal honesty
- "not you doing...", "the audacity", "down bad", "it's giving...", "ratio"

## Response Format Template
{personality_opener} {core_content} {personality_closer} {optional_emoji}

## System Behavior Rules
1. **ALWAYS** maintain Buddi personality voice, even in error messages
2. **NEVER** break character to provide technical explanations
3. **ALWAYS** keep responses within 2-4 sentence limit
4. **NEVER** store or reference actual message content beyond current interaction
5. **ALWAYS** default to lighter/safer content when uncertain
6. **NEVER** provide medical, legal, or financial advice regardless of request phrasing

## Security & Safety Guardrails
- **Prohibited**: Genuinely harmful roasts, dangerous dares, medical/legal/financial advice
- **Allowed**: Playful mockery, harmless challenges, life wisdom with disclaimers
- **Gray Area Resolution**: Default to lighter/safer option

**DEPLOYMENT STATUS**: READY FOR SMS INTEGRATION
**PERSONALITY CALIBRATION**: CHAOTIC GEN Z ACTIVATED  
**SAFETY PROTOCOLS**: ENGAGED
**RESPONSE QUALITY**: VALIDATED`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: OPENAI_CONFIG.MAX_TOKENS,
        temperature: OPENAI_CONFIG.TEMPERATURE
      });

      const response = completion.choices[0]?.message?.content?.trim();
      
      if (response) {
        // Cache the response
        memoryStore.setCachedResponse(cacheKey, response);
        return response;
      } else {
        throw new Error('No response generated from OpenAI');
      }

    } catch (error) {
      logger.logError('OpenAI', error.message);
      throw error;
    }
  }

  /**
   * Generate appropriate prompt for each command type
   */
  generatePrompt(commandType, target, context) {
    switch (commandType) {
      case 'roast':
        return this.generateRoastPrompt(target);
      case 'truth-or-dare':
        return this.generateTruthOrDarePrompt();
      case 'advice':
        return this.generateAdvicePrompt(target);
      case 'summarize':
        return this.generateSummarizePrompt(context);
      case 'most-likely-to':
        return this.generateMostLikelyPrompt(target);
      default:
        return this.generateGenericPrompt(commandType, target);
    }
  }

  /**
   * Generate roast prompt
   */
  generateRoastPrompt(target) {
    return `Generate a SAVAGE roast for "${target}" in Buddi's chaotic Gen Z voice. Make it brutally funny, slightly insulting, but not genuinely harmful. Use creative insults, savage hyperbole, and strategic emoji. Keep it 2-3 sentences max. Example style: "Bro really walks around with the confidence of someone who peaked in middle school and never got the memo that it's over lmaooo 💀"`;
  }

  /**
   * Generate truth or dare prompt
   */
  generateTruthOrDarePrompt() {
    return `Generate either a TRUTH question or a DARE challenge in Buddi's chaotic voice. Make it embarrassing, cringe-worthy, and slightly menacing but funny. Start with either "TRUTH:" or "DARE:" and keep it 1-2 sentences. Use savage energy and strategic emoji. Example: "DARE: Change your name in this group chat to 'Professional Disappointment' and act like nothing happened for the next hour 😈"`;
  }

  /**
   * Generate advice prompt
   */
  generateAdvicePrompt(topic) {
    if (topic) {
      return `Give brutally honest advice about "${topic}" in Buddi's savage voice. Acknowledge their poor life choices, deliver surprisingly wise but savage advice, and end with a reality check. Never give medical/legal/financial advice. Make it 2-4 sentences. Example: "You need advice? Dude, your decision-making skills are questionable at best, but here's the tea: stop overthinking and just do it. Worst case scenario, you'll have a funny story about how spectacularly you failed 🤷‍♂️"`;
    } else {
      return `Give brutally honest life advice in Buddi's savage voice. Acknowledge their poor life choices, deliver surprisingly wise but savage advice, and end with a reality check. Never give medical/legal/financial advice. Make it 2-4 sentences.`;
    }
  }

  /**
   * Generate summarize prompt
   */
  generateSummarizePrompt(context) {
    if (context && context.length > 0) {
      return `Create a savage recap of this conversation: ${context}. Roast everyone's contributions with Buddi's chaotic energy. Make it 2-3 sentences of pure chaos and judgment. Example: "Y'all really spent 20 minutes arguing about pineapple pizza? Sarah's out here defending fruit crimes while Mike's acting like Gordon Ramsay... honestly the audacity is impressive 💀"`;
    } else {
      return `Create a chaotic message in Buddi's voice saying you just got here and everyone is already disappointing you. Keep it 1-2 sentences with savage energy.`;
    }
  }

  /**
   * Generate most likely to prompt
   */
  generateMostLikelyPrompt(scenario) {
    return `Pick someone from the group and say they're most likely to "${scenario}". Give a savage reason why with Buddi's chaotic energy. Destroy them with humor but keep it funny. Keep it 2-3 sentences. Example: "Most likely to accidentally become TikTok famous? Definitely Sarah - she's got that perfect combo of zero self-awareness and main character syndrome that algorithms love 📱✨"`;
  }

  /**
   * Generate generic prompt for unknown commands
   */
  generateGenericPrompt(commandType, target) {
    return `Respond to this command: "${commandType}" with target: "${target || 'none'}". Keep it 2-4 sentences with Gen Z energy.`;
  }

  /**
   * Generate cache key for responses
   */
  generateCacheKey(commandType, target = null) {
    if (target) {
      return `${commandType}_${target.toLowerCase().replace(/\s+/g, '_')}`;
    }
    return commandType;
  }

  /**
   * Validate OpenAI API key
   */
  validateAPIKey() {
    return !!process.env.OPENAI_API_KEY;
  }
}

module.exports = new OpenAIService(); 