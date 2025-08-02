const { TRIGGER_WORDS, COMMAND_TYPES, DEFAULTS } = require('../../config/constants');

class CommandParser {
  /**
   * Parse incoming message to extract command and target
   * @param {string} message - The incoming SMS message
   * @returns {object} - Parsed command with type, target, and confidence
   */
  parseCommand(message) {
    if (!message || typeof message !== 'string') {
      return { type: null, target: null, confidence: 0 };
    }

    const normalizedMessage = message.toLowerCase().trim();
    
    // Check for trigger words
    const hasTrigger = TRIGGER_WORDS.some(trigger => 
      normalizedMessage.includes(trigger.toLowerCase())
    );

    if (!hasTrigger) {
      return { type: null, target: null, confidence: 0 };
    }

    // Extract command type and target
    const roastMatch = this.parseRoastCommand(normalizedMessage);
    if (roastMatch.confidence > 0) return roastMatch;

    const truthOrDareMatch = this.parseTruthOrDareCommand(normalizedMessage);
    if (truthOrDareMatch.confidence > 0) return truthOrDareMatch;

    const adviceMatch = this.parseAdviceCommand(normalizedMessage);
    if (adviceMatch.confidence > 0) return adviceMatch;

    const summarizeMatch = this.parseSummarizeCommand(normalizedMessage);
    if (summarizeMatch.confidence > 0) return summarizeMatch;

    const mostLikelyMatch = this.parseMostLikelyCommand(normalizedMessage);
    if (mostLikelyMatch.confidence > 0) return mostLikelyMatch;

    return { type: null, target: null, confidence: 0 };
  }

  /**
   * Parse roast command variations
   */
  parseRoastCommand(message) {
    const roastKeywords = ['roast', 'roasted', 'roasting'];
    const hasRoastKeyword = roastKeywords.some(keyword => message.includes(keyword));
    
    if (!hasRoastKeyword) {
      return { type: null, target: null, confidence: 0 };
    }

    // Extract target name
    let target = DEFAULTS.ROAST_TARGET;
    
    // Look for names after "roast"
    const roastIndex = message.indexOf('roast');
    if (roastIndex !== -1) {
      const afterRoast = message.substring(roastIndex + 5).trim();
      if (afterRoast) {
        // Extract first word after "roast" as target
        const words = afterRoast.split(/\s+/);
        if (words[0] && words[0].length > 0) {
          target = words[0];
        }
      }
    }

    return {
      type: COMMAND_TYPES.ROAST,
      target: target,
      confidence: 0.9
    };
  }

  /**
   * Parse truth or dare command variations
   */
  parseTruthOrDareCommand(message) {
    const truthOrDareKeywords = ['truth or dare', 'truth', 'dare'];
    const hasKeyword = truthOrDareKeywords.some(keyword => message.includes(keyword));
    
    if (!hasKeyword) {
      return { type: null, target: null, confidence: 0 };
    }

    return {
      type: COMMAND_TYPES.TRUTH_OR_DARE,
      target: null,
      confidence: 0.9
    };
  }

  /**
   * Parse advice command variations
   */
  parseAdviceCommand(message) {
    const adviceKeywords = ['advice', 'advise', 'help'];
    const hasAdviceKeyword = adviceKeywords.some(keyword => message.includes(keyword));
    
    if (!hasAdviceKeyword) {
      return { type: null, target: null, confidence: 0 };
    }

    // Extract advice topic if provided
    let target = null;
    
    // Look for "about" or "on" after advice keywords
    const adviceIndex = message.indexOf('advice');
    if (adviceIndex !== -1) {
      const afterAdvice = message.substring(adviceIndex + 6).trim();
      if (afterAdvice) {
        // Check for "about" or "on"
        const aboutIndex = afterAdvice.indexOf('about');
        const onIndex = afterAdvice.indexOf('on');
        
        if (aboutIndex !== -1) {
          target = afterAdvice.substring(aboutIndex + 6).trim();
        } else if (onIndex !== -1) {
          target = afterAdvice.substring(onIndex + 2).trim();
        }
      }
    }

    return {
      type: COMMAND_TYPES.ADVICE,
      target: target,
      confidence: 0.8
    };
  }

  /**
   * Parse summarize command variations
   */
  parseSummarizeCommand(message) {
    const summarizeKeywords = ['summarize', 'summary', 'what did i miss', 'catch me up'];
    const hasKeyword = summarizeKeywords.some(keyword => message.includes(keyword));
    
    if (!hasKeyword) {
      return { type: null, target: null, confidence: 0 };
    }

    return {
      type: COMMAND_TYPES.SUMMARIZE,
      target: null,
      confidence: 0.9
    };
  }

  /**
   * Parse most likely to command variations
   */
  parseMostLikelyCommand(message) {
    const mostLikelyKeywords = ['most likely', 'most likely to'];
    const hasKeyword = mostLikelyKeywords.some(keyword => message.includes(keyword));
    
    if (!hasKeyword) {
      return { type: null, target: null, confidence: 0 };
    }

    // Extract scenario
    let target = DEFAULTS.GENERIC_SCENARIO;
    
    // Look for scenario after "most likely to"
    const mostLikelyIndex = message.indexOf('most likely to');
    if (mostLikelyIndex !== -1) {
      const afterMostLikely = message.substring(mostLikelyIndex + 13).trim();
      if (afterMostLikely) {
        target = afterMostLikely;
      }
    }

    return {
      type: COMMAND_TYPES.MOST_LIKELY_TO,
      target: target,
      confidence: 0.8
    };
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid US phone number (10 or 11 digits)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (cleaned.length === 11 && !cleaned.startsWith('1')) {
      return `+1${cleaned}`;
    }
    
    return false;
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
}

module.exports = new CommandParser(); 