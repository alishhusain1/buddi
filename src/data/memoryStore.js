const { CLEANUP } = require('../../config/constants');
const logger = require('../utils/logger');

class MemoryStore {
  constructor() {
    // Initialize data structures as specified in PRD
    this.activeUsers = {};
    this.conversationHistory = {};
    this.rateLimits = {};
    this.cachedResponses = {};
    
    // Set up automatic cleanup
    this.setupCleanup();
  }

  // Active Users Management
  addUser(phoneNumber) {
    const now = new Date();
    this.activeUsers[phoneNumber] = {
      phoneNumber,
      lastActive: now.toISOString(),
      messageCount: 0,
      lastCommand: null,
      joinedAt: now.toISOString()
    };
  }

  updateUser(phoneNumber, commandType = null) {
    const now = new Date();
    if (this.activeUsers[phoneNumber]) {
      this.activeUsers[phoneNumber].lastActive = now.toISOString();
      this.activeUsers[phoneNumber].messageCount += 1;
      if (commandType) {
        this.activeUsers[phoneNumber].lastCommand = commandType;
      }
    } else {
      this.addUser(phoneNumber);
      if (commandType) {
        this.activeUsers[phoneNumber].lastCommand = commandType;
      }
    }
  }

  removeUser(phoneNumber) {
    delete this.activeUsers[phoneNumber];
  }

  getActiveUsers() {
    return Object.keys(this.activeUsers);
  }

  isUserActive(phoneNumber) {
    if (!this.activeUsers[phoneNumber]) return false;
    
    const lastActive = new Date(this.activeUsers[phoneNumber].lastActive);
    const now = new Date();
    const minutesSinceActive = (now - lastActive) / (1000 * 60);
    
    return minutesSinceActive <= CLEANUP.ACTIVE_USER_MINUTES;
  }

  // Conversation History Management
  addMessage(phoneNumber, commandType, target = null) {
    const now = new Date();
    const messageData = {
      timestamp: now.toISOString(),
      sender: phoneNumber,
      commandType,
      target,
      responseGenerated: true
    };

    if (!this.conversationHistory[phoneNumber]) {
      this.conversationHistory[phoneNumber] = {
        messages: [],
        lastCleanup: now.toISOString()
      };
    }

    this.conversationHistory[phoneNumber].messages.push(messageData);
    
    // Keep only last 10 messages
    if (this.conversationHistory[phoneNumber].messages.length > 10) {
      this.conversationHistory[phoneNumber].messages = 
        this.conversationHistory[phoneNumber].messages.slice(-10);
    }
  }

  getHistory(phoneNumber) {
    return this.conversationHistory[phoneNumber]?.messages || [];
  }

  getRecentSenders() {
    const senders = new Set();
    Object.values(this.conversationHistory).forEach(history => {
      history.messages.forEach(message => {
        senders.add(message.sender);
      });
    });
    return Array.from(senders);
  }

  // Rate Limiting Management
  checkRateLimit(phoneNumber) {
    const now = new Date();
    const windowStart = new Date(now.getTime() - (5 * 1000)); // 5 second window
    
    if (!this.rateLimits[phoneNumber]) {
      this.rateLimits[phoneNumber] = {
        lastCommandTime: now.toISOString(),
        commandCount: 1,
        windowStart: now.toISOString()
      };
      return false; // Not rate limited
    }

    const rateLimit = this.rateLimits[phoneNumber];
    const lastCommandTime = new Date(rateLimit.lastCommandTime);
    
    // If last command was more than 5 seconds ago, reset
    if (lastCommandTime < windowStart) {
      this.rateLimits[phoneNumber] = {
        lastCommandTime: now.toISOString(),
        commandCount: 1,
        windowStart: now.toISOString()
      };
      return false; // Not rate limited
    }

    // Check if within rate limit
    if (rateLimit.commandCount >= 1) {
      return true; // Rate limited
    }

    // Update rate limit
    rateLimit.commandCount += 1;
    rateLimit.lastCommandTime = now.toISOString();
    return false; // Not rate limited
  }

  updateRateLimit(phoneNumber) {
    const now = new Date();
    if (this.rateLimits[phoneNumber]) {
      this.rateLimits[phoneNumber].lastCommandTime = now.toISOString();
    }
  }

  // Caching Management
  getCachedResponse(key) {
    const cached = this.cachedResponses[key];
    if (!cached) return null;
    
    const now = new Date();
    const expiresAt = new Date(cached.expiresAt);
    
    if (now > expiresAt) {
      delete this.cachedResponses[key];
      return null;
    }
    
    return cached.response;
  }

  setCachedResponse(key, response) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (CLEANUP.CACHE_HOURS * 60 * 60 * 1000));
    
    this.cachedResponses[key] = {
      response,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };
  }

  // Cleanup Management
  setupCleanup() {
    // Run cleanup every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000); // 1 hour
  }

  cleanupOldData() {
    const now = new Date();
    let conversationCleanupCount = 0;
    let cacheCleanupCount = 0;
    let activeUserCleanupCount = 0;

    // Cleanup old conversation history
    Object.keys(this.conversationHistory).forEach(phoneNumber => {
      const history = this.conversationHistory[phoneNumber];
      const lastCleanup = new Date(history.lastCleanup);
      const hoursSinceCleanup = (now - lastCleanup) / (1000 * 60 * 60);
      
      if (hoursSinceCleanup >= CLEANUP.CONVERSATION_HOURS) {
        delete this.conversationHistory[phoneNumber];
        conversationCleanupCount++;
      }
    });

    // Cleanup expired cache
    Object.keys(this.cachedResponses).forEach(key => {
      const cached = this.cachedResponses[key];
      const expiresAt = new Date(cached.expiresAt);
      
      if (now > expiresAt) {
        delete this.cachedResponses[key];
        cacheCleanupCount++;
      }
    });

    // Cleanup inactive users
    Object.keys(this.activeUsers).forEach(phoneNumber => {
      if (!this.isUserActive(phoneNumber)) {
        delete this.activeUsers[phoneNumber];
        activeUserCleanupCount++;
      }
    });

    // Log cleanup results
    if (conversationCleanupCount > 0) {
      logger.logCleanup('conversation', conversationCleanupCount);
    }
    if (cacheCleanupCount > 0) {
      logger.logCleanup('cache', cacheCleanupCount);
    }
    if (activeUserCleanupCount > 0) {
      logger.logCleanup('active-users', activeUserCleanupCount);
    }
  }

  // Utility methods
  getStats() {
    return {
      activeUsers: Object.keys(this.activeUsers).length,
      conversationHistory: Object.keys(this.conversationHistory).length,
      rateLimits: Object.keys(this.rateLimits).length,
      cachedResponses: Object.keys(this.cachedResponses).length
    };
  }

  clearAll() {
    this.activeUsers = {};
    this.conversationHistory = {};
    this.rateLimits = {};
    this.cachedResponses = {};
  }
}

module.exports = new MemoryStore(); 