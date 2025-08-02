const commandParser = require('../services/commandParser');
const responseGenerator = require('../utils/responseGenerator');
const groupSimulator = require('../utils/groupSimulator');
const memoryStore = require('../data/memoryStore');
const twilioService = require('../services/twilioService');
const logger = require('../utils/logger');
const { ERROR_MESSAGES, RESPONSE_TIMEOUT_MS } = require('../../config/constants');

class SMSController {
  /**
   * Handle incoming SMS webhook
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  async handleIncomingSMS(req, res) {
    try {
      // Validate webhook signature
      if (!twilioService.validateWebhookSignature(req, process.env.TWILIO_AUTH_TOKEN)) {
        logger.logError('SMSController', 'Invalid webhook signature');
        return res.status(403).send('Unauthorized');
      }

      // Extract SMS data
      const { Body: message, From: fromPhoneNumber } = req.body;
      
      if (!message || !fromPhoneNumber) {
        logger.logError('SMSController', 'Missing message or phone number');
        return res.status(400).send('Bad Request');
      }

      // Format phone number
      const formattedPhoneNumber = twilioService.formatPhoneNumber(fromPhoneNumber);
      if (!formattedPhoneNumber) {
        logger.logError('SMSController', `Invalid phone number format: ${fromPhoneNumber}`);
        return res.status(400).send('Invalid phone number');
      }

      // Check rate limiting
      if (memoryStore.checkRateLimit(formattedPhoneNumber)) {
        logger.logRateLimit(formattedPhoneNumber);
        await twilioService.sendSMS(formattedPhoneNumber, ERROR_MESSAGES.RATE_LIMIT);
        return res.status(200).send('Rate limited');
      }

      // Parse command
      const parsedCommand = commandParser.parseCommand(message);
      
      // Log incoming SMS (metadata only)
      logger.logIncomingSMS(formattedPhoneNumber, parsedCommand.type || 'unknown', parsedCommand.target);

      // Handle empty or invalid messages
      if (!message.trim()) {
        await twilioService.sendSMS(formattedPhoneNumber, ERROR_MESSAGES.EMPTY_MESSAGE);
        return res.status(200).send('Empty message handled');
      }

      // Handle unknown commands
      if (!parsedCommand.type) {
        await twilioService.sendSMS(formattedPhoneNumber, ERROR_MESSAGES.UNKNOWN_COMMAND);
        return res.status(200).send('Unknown command handled');
      }

      // Generate response with timeout
      const response = await this.generateResponseWithTimeout(
        parsedCommand.type,
        parsedCommand.target,
        formattedPhoneNumber
      );

      // Handle group simulation
      const simulationResult = await groupSimulator.handleGroupSimulation(
        formattedPhoneNumber,
        parsedCommand.type,
        parsedCommand.target,
        response
      );

      if (!simulationResult.success) {
        logger.logError('SMSController', simulationResult.error);
        await twilioService.sendSMS(formattedPhoneNumber, ERROR_MESSAGES.API_FAILURE);
        return res.status(500).send('Internal server error');
      }

      // Update rate limit
      memoryStore.updateRateLimit(formattedPhoneNumber);

      // Return success
      res.status(200).send('OK');

    } catch (error) {
      logger.logError('SMSController', error.message);
      
      // Try to send error message to user
      try {
        const fromPhoneNumber = req.body?.From;
        if (fromPhoneNumber) {
          const formattedPhoneNumber = twilioService.formatPhoneNumber(fromPhoneNumber);
          if (formattedPhoneNumber) {
            await twilioService.sendSMS(formattedPhoneNumber, ERROR_MESSAGES.API_FAILURE);
          }
        }
      } catch (sendError) {
        logger.logError('SMSController', `Failed to send error message: ${sendError.message}`);
      }

      res.status(500).send('Internal server error');
    }
  }

  /**
   * Generate response with timeout protection
   * @param {string} commandType - The command type
   * @param {string} target - The command target
   * @param {string} phoneNumber - The sender's phone number
   * @returns {Promise<string>} - The generated response
   */
  async generateResponseWithTimeout(commandType, target, phoneNumber) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(ERROR_MESSAGES.API_FAILURE);
      }, RESPONSE_TIMEOUT_MS);

      try {
        const response = await responseGenerator.generateResponse(commandType, target, phoneNumber);
        clearTimeout(timeout);
        resolve(response);
      } catch (error) {
        clearTimeout(timeout);
        logger.logError('SMSController', `Response generation failed: ${error.message}`);
        resolve(ERROR_MESSAGES.API_FAILURE);
      }
    });
  }

  /**
   * Handle health check endpoint
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  async handleHealthCheck(req, res) {
    try {
      const stats = memoryStore.getStats();
      const groupStats = groupSimulator.getGroupStats();
      
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          twilio: twilioService.validateConfiguration(),
          openai: !!process.env.OPENAI_API_KEY,
          memoryStore: true
        },
        stats: {
          ...stats,
          groupStats
        }
      };

      res.status(200).json(healthStatus);

    } catch (error) {
      logger.logError('SMSController', `Health check failed: ${error.message}`);
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle test endpoint for development
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  async handleTest(req, res) {
    try {
      const { message, phoneNumber } = req.body;
      
      if (!message || !phoneNumber) {
        return res.status(400).json({ error: 'Missing message or phone number' });
      }

      // Simulate incoming SMS with bypass for testing
      const mockRequest = {
        body: {
          Body: message,
          From: phoneNumber
        },
        headers: {
          'x-twilio-signature': 'test-signature-bypass'
        },
        protocol: 'http',
        get: () => 'localhost',
        originalUrl: '/webhook/sms'
      };

      // Bypass signature validation for test endpoint
      const originalValidateWebhookSignature = twilioService.validateWebhookSignature;
      twilioService.validateWebhookSignature = () => true;

      await this.handleIncomingSMS(mockRequest, res);

      // Restore original function
      twilioService.validateWebhookSignature = originalValidateWebhookSignature;

    } catch (error) {
      logger.logError('SMSController', `Test endpoint failed: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new SMSController(); 