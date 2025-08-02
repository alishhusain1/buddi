const memoryStore = require('../data/memoryStore');
const twilioService = require('../services/twilioService');
const logger = require('./logger');

class GroupSimulator {
  /**
   * Simulate group chat by broadcasting responses to active users
   * @param {string} senderPhoneNumber - The phone number that triggered the response
   * @param {string} response - The response message to broadcast
   * @returns {Promise<object>} - Broadcast results
   */
  async broadcastToGroup(senderPhoneNumber, response) {
    try {
      // Get all active users
      const activeUsers = memoryStore.getActiveUsers();
      
      // Filter out the sender (don't send back to them)
      const recipients = activeUsers.filter(phoneNumber => 
        phoneNumber !== senderPhoneNumber
      );

      if (recipients.length === 0) {
        // No other active users, just send to sender
        await twilioService.sendSMS(senderPhoneNumber, response);
        return {
          broadcastCount: 1,
          recipients: [senderPhoneNumber],
          success: true
        };
      }

      // Send to all active users including sender
      const allRecipients = [...recipients, senderPhoneNumber];
      const results = await twilioService.sendGroupSMS(allRecipients, response);

      // Count successful sends
      const successfulSends = results.filter(result => 
        result.status === 'fulfilled'
      ).length;

      logger.logGroupBroadcast(senderPhoneNumber, successfulSends);

      return {
        broadcastCount: successfulSends,
        recipients: allRecipients,
        success: successfulSends > 0
      };

    } catch (error) {
      logger.logError('GroupSimulator', error.message);
      throw error;
    }
  }

  /**
   * Add user to active group and update their status
   * @param {string} phoneNumber - The phone number to add
   * @param {string} commandType - The command type they used
   */
  addUserToGroup(phoneNumber, commandType) {
    memoryStore.updateUser(phoneNumber, commandType);
  }

  /**
   * Check if user is part of active group
   * @param {string} phoneNumber - The phone number to check
   * @returns {boolean} - Whether user is active
   */
  isUserInGroup(phoneNumber) {
    return memoryStore.isUserActive(phoneNumber);
  }

  /**
   * Get all active group members
   * @returns {Array<string>} - Array of active phone numbers
   */
  getActiveGroupMembers() {
    return memoryStore.getActiveUsers();
  }

  /**
   * Remove user from active group
   * @param {string} phoneNumber - The phone number to remove
   */
  removeUserFromGroup(phoneNumber) {
    memoryStore.removeUser(phoneNumber);
  }

  /**
   * Get group statistics
   * @returns {object} - Group statistics
   */
  getGroupStats() {
    const activeUsers = memoryStore.getActiveUsers();
    const stats = memoryStore.getStats();
    
    return {
      activeMembers: activeUsers.length,
      totalActiveUsers: stats.activeUsers,
      conversationHistory: stats.conversationHistory,
      recentActivity: this.getRecentActivity()
    };
  }

  /**
   * Get recent activity for group context
   * @returns {Array} - Recent activity data
   */
  getRecentActivity() {
    const activeUsers = memoryStore.getActiveUsers();
    const recentActivity = [];

    activeUsers.forEach(phoneNumber => {
      const user = memoryStore.activeUsers[phoneNumber];
      if (user && user.lastCommand) {
        recentActivity.push({
          phoneNumber,
          lastCommand: user.lastCommand,
          lastActive: user.lastActive,
          messageCount: user.messageCount
        });
      }
    });

    return recentActivity.sort((a, b) => 
      new Date(b.lastActive) - new Date(a.lastActive)
    );
  }

  /**
   * Simulate group context for responses
   * @param {string} phoneNumber - The sender's phone number
   * @returns {object} - Group context information
   */
  getGroupContext(phoneNumber) {
    const activeUsers = memoryStore.getActiveUsers();
    const recentSenders = memoryStore.getRecentSenders();
    
    return {
      sender: phoneNumber,
      activeMembers: activeUsers.length,
      recentSenders: recentSenders.length,
      isGroupChat: activeUsers.length > 1,
      groupSize: activeUsers.length
    };
  }

  /**
   * Handle group chat simulation logic
   * @param {string} senderPhoneNumber - The sender's phone number
   * @param {string} commandType - The command type
   * @param {string} target - The command target
   * @param {string} response - The generated response
   * @returns {Promise<object>} - Broadcast results
   */
  async handleGroupSimulation(senderPhoneNumber, commandType, target, response) {
    try {
      // Add sender to active group
      this.addUserToGroup(senderPhoneNumber, commandType);
      
      // Store message in conversation history (metadata only)
      memoryStore.addMessage(senderPhoneNumber, commandType, target);
      
      // Broadcast response to group
      const broadcastResults = await this.broadcastToGroup(senderPhoneNumber, response);
      
      return {
        success: true,
        response: response,
        broadcastResults: broadcastResults,
        groupContext: this.getGroupContext(senderPhoneNumber)
      };

    } catch (error) {
      logger.logError('GroupSimulator', error.message);
      return {
        success: false,
        error: error.message,
        response: response
      };
    }
  }

  /**
   * Clean up inactive group members
   */
  cleanupInactiveMembers() {
    const activeUsers = memoryStore.getActiveUsers();
    let removedCount = 0;

    activeUsers.forEach(phoneNumber => {
      if (!memoryStore.isUserActive(phoneNumber)) {
        memoryStore.removeUser(phoneNumber);
        removedCount++;
      }
    });

    if (removedCount > 0) {
      logger.logCleanup('group-members', removedCount);
    }

    return removedCount;
  }
}

module.exports = new GroupSimulator(); 