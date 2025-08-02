const twilio = require('twilio');
const logger = require('../utils/logger');

class TwilioService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  /**
   * Send SMS message
   * @param {string} to - Recipient phone number
   * @param {string} message - Message content
   * @returns {Promise<object>} - Twilio message object
   */
  async sendSMS(to, message) {
    try {
      const messageResponse = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: to
      });

      logger.logOutgoingSMS(to, 'response');
      return messageResponse;

    } catch (error) {
      logger.logError('Twilio', error.message);
      throw error;
    }
  }

  /**
   * Send SMS to multiple recipients (for group simulation)
   * @param {Array<string>} phoneNumbers - Array of phone numbers
   * @param {string} message - Message content
   * @returns {Promise<Array>} - Array of message responses
   */
  async sendGroupSMS(phoneNumbers, message) {
    const promises = phoneNumbers.map(phoneNumber => 
      this.sendSMS(phoneNumber, message)
    );

    try {
      const responses = await Promise.allSettled(promises);
      
      // Log successful sends
      const successful = responses.filter(r => r.status === 'fulfilled').length;
      const failed = responses.filter(r => r.status === 'rejected').length;
      
      if (successful > 0) {
        logger.logGroupBroadcast(phoneNumbers[0], successful);
      }
      
      if (failed > 0) {
        logger.logError('Twilio', `${failed} messages failed to send`);
      }

      return responses;

    } catch (error) {
      logger.logError('Twilio', error.message);
      throw error;
    }
  }

  /**
   * Validate webhook signature
   * @param {object} request - Express request object
   * @param {string} authToken - Twilio auth token
   * @returns {boolean} - Whether signature is valid
   */
  validateWebhookSignature(request, authToken) {
    try {
      const signature = request.headers['x-twilio-signature'];
      const url = request.protocol + '://' + request.get('host') + request.originalUrl;
      const params = request.body;

      return twilio.validateRequest(authToken, signature, url, params);

    } catch (error) {
      logger.logError('Twilio', `Webhook validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Format phone number to E.164 format
   * @param {string} phoneNumber - Raw phone number
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid US phone number
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (cleaned.length === 11 && !cleaned.startsWith('1')) {
      return `+1${cleaned}`;
    }
    
    return null;
  }

  /**
   * Validate Twilio configuration
   * @returns {boolean} - Whether configuration is valid
   */
  validateConfiguration() {
    return !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    );
  }

  /**
   * Get Twilio phone number
   * @returns {string} - Twilio phone number
   */
  getPhoneNumber() {
    return this.phoneNumber;
  }
}

module.exports = new TwilioService(); 