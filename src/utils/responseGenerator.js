const { COMMAND_TYPES, ERROR_MESSAGES, DEFAULTS } = require('../../config/constants');
const openaiService = require('../services/openaiService');
const memoryStore = require('../data/memoryStore');
const logger = require('./logger');

class ResponseGenerator {
  /**
   * Generate response based on command type
   * @param {string} commandType - The type of command
   * @param {string} target - The target of the command
   * @param {string} phoneNumber - The sender's phone number
   * @returns {Promise<string>} - The generated response
   */
  async generateResponse(commandType, target, phoneNumber) {
    try {
      switch (commandType) {
        case COMMAND_TYPES.ROAST:
          return await this.generateRoastResponse(target);
        
        case COMMAND_TYPES.TRUTH_OR_DARE:
          return await this.generateTruthOrDareResponse();
        
        case COMMAND_TYPES.ADVICE:
          return await this.generateAdviceResponse(target);
        
        case COMMAND_TYPES.SUMMARIZE:
          return await this.generateSummarizeResponse(phoneNumber);
        
        case COMMAND_TYPES.MOST_LIKELY_TO:
          return await this.generateMostLikelyResponse(target, phoneNumber);
        
        default:
          return ERROR_MESSAGES.UNKNOWN_COMMAND;
      }
    } catch (error) {
      logger.logError('ResponseGenerator', error.message);
      return ERROR_MESSAGES.API_FAILURE;
    }
  }

  /**
   * Generate roast response
   */
  async generateRoastResponse(target) {
    const roastTarget = target || DEFAULTS.ROAST_TARGET;
    return await openaiService.generateResponse(COMMAND_TYPES.ROAST, roastTarget);
  }

  /**
   * Generate truth or dare response
   */
  async generateTruthOrDareResponse() {
    return await openaiService.generateResponse(COMMAND_TYPES.TRUTH_OR_DARE);
  }

  /**
   * Generate advice response
   */
  async generateAdviceResponse(topic) {
    return await openaiService.generateResponse(COMMAND_TYPES.ADVICE, topic);
  }

  /**
   * Generate summarize response
   */
  async generateSummarizeResponse(phoneNumber) {
    const history = memoryStore.getHistory(phoneNumber);
    
    if (!history || history.length === 0) {
      return ERROR_MESSAGES.NO_HISTORY;
    }

    // Create context from recent messages
    const recentMessages = history.slice(-5); // Last 5 messages
    const context = recentMessages.map(msg => 
      `${msg.commandType}${msg.target ? ` (${msg.target})` : ''}`
    ).join(', ');

    return await openaiService.generateResponse(COMMAND_TYPES.SUMMARIZE, null, context);
  }

  /**
   * Generate most likely to response
   */
  async generateMostLikelyResponse(scenario, phoneNumber) {
    const recentSenders = memoryStore.getRecentSenders();
    
    if (recentSenders.length === 0) {
      // If no recent senders, use a generic response
      return await openaiService.generateResponse(COMMAND_TYPES.MOST_LIKELY_TO, scenario);
    }

    // Pick a random sender from recent conversation
    const randomSender = recentSenders[Math.floor(Math.random() * recentSenders.length)];
    const senderName = this.extractNameFromPhoneNumber(randomSender);
    
    // Add the sender name to the scenario context
    const enhancedScenario = `${scenario} (${senderName})`;
    
    return await openaiService.generateResponse(COMMAND_TYPES.MOST_LIKELY_TO, enhancedScenario);
  }

  /**
   * Extract a name from phone number (for most likely to game)
   */
  extractNameFromPhoneNumber(phoneNumber) {
    // Simple name extraction - could be enhanced with a name database
    const last4 = phoneNumber.slice(-4);
    const names = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Quinn'];
    const nameIndex = parseInt(last4) % names.length;
    return names[nameIndex];
  }

  /**
   * Generate error response based on error type
   */
  generateErrorResponse(errorType) {
    switch (errorType) {
      case 'rate_limit':
        return ERROR_MESSAGES.RATE_LIMIT;
      case 'empty_message':
        return ERROR_MESSAGES.EMPTY_MESSAGE;
      case 'unknown_command':
        return ERROR_MESSAGES.UNKNOWN_COMMAND;
      case 'api_failure':
        return ERROR_MESSAGES.API_FAILURE;
      default:
        return ERROR_MESSAGES.API_FAILURE;
    }
  }

  /**
   * Generate "thinking" message for long operations
   */
  generateThinkingMessage() {
    return "🤔 Let me think about that...";
  }

  /**
   * Validate response length and format
   */
  validateResponse(response) {
    if (!response || typeof response !== 'string') {
      return false;
    }

    // Check if response is too long (SMS limit is 160 characters)
    if (response.length > 160) {
      return false;
    }

    // Check if response contains any technical error messages
    const technicalTerms = ['error', 'exception', 'failed', 'timeout', 'undefined', 'null'];
    const hasTechnicalTerms = technicalTerms.some(term => 
      response.toLowerCase().includes(term)
    );

    return !hasTechnicalTerms;
  }
}

module.exports = new ResponseGenerator(); 