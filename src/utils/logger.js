const logger = {
  /**
   * Log incoming SMS metadata (never the actual message content)
   * @param {string} phoneNumber - The sender's phone number
   * @param {string} commandType - The type of command detected
   * @param {string} target - The target of the command (if any)
   * @param {Date} timestamp - The timestamp of the message
   */
  logIncomingSMS: (phoneNumber, commandType, target = null, timestamp = new Date()) => {
    console.log(`[${timestamp.toISOString()}] SMS from ${phoneNumber} - Command: ${commandType}${target ? `, Target: ${target}` : ''}`);
  },

  /**
   * Log outgoing SMS metadata
   * @param {string} phoneNumber - The recipient's phone number
   * @param {string} commandType - The type of command that generated the response
   * @param {Date} timestamp - The timestamp of the response
   */
  logOutgoingSMS: (phoneNumber, commandType, timestamp = new Date()) => {
    console.log(`[${timestamp.toISOString()}] SMS to ${phoneNumber} - Response for: ${commandType}`);
  },

  /**
   * Log API errors
   * @param {string} service - The service that failed (e.g., 'OpenAI', 'Twilio')
   * @param {string} error - The error message
   * @param {Date} timestamp - The timestamp of the error
   */
  logError: (service, error, timestamp = new Date()) => {
    console.error(`[${timestamp.toISOString()}] ${service} Error: ${error}`);
  },

  /**
   * Log rate limiting events
   * @param {string} phoneNumber - The phone number that was rate limited
   * @param {Date} timestamp - The timestamp of the rate limit
   */
  logRateLimit: (phoneNumber, timestamp = new Date()) => {
    console.log(`[${timestamp.toISOString()}] Rate limit hit for ${phoneNumber}`);
  },

  /**
   * Log data cleanup events
   * @param {string} type - The type of cleanup ('conversation', 'cache', 'active-users')
   * @param {number} count - The number of items cleaned up
   * @param {Date} timestamp - The timestamp of the cleanup
   */
  logCleanup: (type, count, timestamp = new Date()) => {
    console.log(`[${timestamp.toISOString()}] Cleanup: ${count} ${type} items removed`);
  },

  /**
   * Log group simulation events
   * @param {string} phoneNumber - The phone number that triggered the broadcast
   * @param {number} broadcastCount - The number of numbers the response was broadcast to
   * @param {Date} timestamp - The timestamp of the broadcast
   */
  logGroupBroadcast: (phoneNumber, broadcastCount, timestamp = new Date()) => {
    console.log(`[${timestamp.toISOString()}] Group broadcast from ${phoneNumber} to ${broadcastCount} active numbers`);
  }
};

module.exports = logger; 