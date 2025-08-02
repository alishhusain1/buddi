// Trigger words for Buddi commands (case insensitive)
const TRIGGER_WORDS = ['@Buddi', '@buddi', 'buddi', 'Buddi'];

// Command types
const COMMAND_TYPES = {
  ROAST: 'roast',
  TRUTH_OR_DARE: 'truth-or-dare',
  ADVICE: 'advice',
  SUMMARIZE: 'summarize',
  MOST_LIKELY_TO: 'most-likely-to'
};

// Rate limiting constants
const RATE_LIMIT = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 5000, // 5 seconds
  MAX_COMMANDS: parseInt(process.env.MAX_COMMANDS_PER_WINDOW) || 1
};

// Response timeouts
const RESPONSE_TIMEOUT_MS = 10000; // 10 seconds

// Data cleanup intervals
const CLEANUP = {
  CONVERSATION_HOURS: parseInt(process.env.CONVERSATION_CLEANUP_HOURS) || 24,
  CACHE_HOURS: parseInt(process.env.CACHE_EXPIRY_HOURS) || 1,
  ACTIVE_USER_MINUTES: parseInt(process.env.ACTIVE_USER_TIMEOUT_MINUTES) || 30
};

// OpenAI configuration
const OPENAI_CONFIG = {
  MODEL: 'gpt-3.5-turbo',
  MAX_TOKENS: 150,
  TEMPERATURE: 0.8
};

// Error messages (maintaining character voice)
const ERROR_MESSAGES = {
  UNKNOWN_COMMAND: "I can roast people, play truth or dare, give advice, summarize convos, or play 'most likely to' - what sounds fun? 🤖",
  EMPTY_MESSAGE: "Did you mean to text me? Try 'buddi roast [name]' or 'buddi truth or dare' 😅",
  API_FAILURE: "My brain is buffering... try again in a sec 🤖",
  RATE_LIMIT: "Chill, let me catch up! ⚡",
  NO_HISTORY: "I just got here, catch me up! 👋"
};

// Default values
const DEFAULTS = {
  ROAST_TARGET: 'someone',
  GENERIC_SCENARIO: 'do something embarrassing',
  MAX_MESSAGES_IN_HISTORY: 10
};

module.exports = {
  TRIGGER_WORDS,
  COMMAND_TYPES,
  RATE_LIMIT,
  RESPONSE_TIMEOUT_MS,
  CLEANUP,
  OPENAI_CONFIG,
  ERROR_MESSAGES,
  DEFAULTS
}; 