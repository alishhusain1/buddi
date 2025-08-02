# Buddi AI SMS Bot 🤖

A chaotic, funny AI bot that joins SMS group chats via Twilio and responds to commands with Gen Z personality. Users text natural language commands and Buddi replies instantly to simulate a wild friend in the group chat.

## Features

- **5 Core Commands**: Roast, Truth or Dare, Advice, Conversation Summary, Most Likely To
- **Natural Language Processing**: Understands casual phrasing and command variations
- **Group Chat Simulation**: Broadcasts responses to all active users
- **Rate Limiting**: Prevents spam with 5-second command limits
- **Response Caching**: Caches identical commands for 1 hour
- **Automatic Cleanup**: Removes old data every 24 hours

## Quick Start

### Prerequisites

- Node.js 16+ 
- Twilio account with SMS capabilities
- OpenAI API key
- Replit account (for deployment)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd buddi-sms-bot
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your API keys:

```bash
cp env.example .env
```

Edit `.env` with your credentials:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Local Development

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 4. Test the Bot

Use the test endpoint to simulate SMS:

```bash
curl -X POST http://localhost:3000/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "buddi roast john",
    "phoneNumber": "+1234567890"
  }'
```

## Commands

### Roast Command
```
buddi roast [name]
Buddi can you roast Mike?
```

### Truth or Dare
```
buddi truth or dare
truth or dare buddi
```

### Advice Command
```
buddi give advice
buddi advice about relationships
```

### Conversation Summary
```
buddi summarize
buddi what did I miss
```

### Most Likely To
```
buddi who's most likely to [scenario]
buddi who's most likely to trip in public
```

## Deployment

### Deploy to Replit

1. **Create Replit Project**
   - Go to [replit.com](https://replit.com)
   - Create new Node.js project
   - Upload all project files

2. **Configure Environment Variables**
   - Go to "Secrets" in your Replit project
   - Add all variables from `.env` file

3. **Set Webhook URL**
   - Copy your Replit URL (e.g., `https://your-project.replit.co`)
   - Add `/webhook/sms` to the end
   - Configure this URL in your Twilio phone number webhook settings

4. **Deploy**
   - Click "Run" in Replit
   - Your bot is now live!

### Deploy to Other Platforms

The bot can be deployed to any Node.js hosting platform:

- **Heroku**: Add `Procfile` with `web: node server.js`
- **Railway**: Connect GitHub repo and set environment variables
- **DigitalOcean App Platform**: Deploy from GitHub with environment variables

## API Endpoints

### POST /webhook/sms
Twilio webhook endpoint for incoming SMS messages.

### GET /health
Health check endpoint with system statistics.

### POST /test (Development Only)
Test endpoint for simulating SMS messages.

## Architecture

```
buddi-sms-bot/
├── server.js                   # Main Express server
├── src/
│   ├── controllers/
│   │   └── smsController.js    # SMS webhook handler
│   ├── services/
│   │   ├── openaiService.js    # OpenAI API integration
│   │   ├── twilioService.js    # Twilio SMS service
│   │   └── commandParser.js    # Natural language parser
│   ├── utils/
│   │   ├── responseGenerator.js # Response generation
│   │   ├── groupSimulator.js   # Group chat simulation
│   │   └── logger.js           # Logging utility
│   └── data/
│       └── memoryStore.js      # In-memory data storage
├── config/
│   └── constants.js            # App constants
└── README.md                   # This file
```

## Data Storage

The bot uses in-memory storage for the MVP:

- **Active Users**: Track users who messaged within 30 minutes
- **Conversation History**: Store last 10 messages per user (metadata only)
- **Rate Limits**: Track command frequency per user
- **Response Cache**: Cache identical commands for 1 hour

## Security

- All API keys stored in environment variables
- Twilio webhook signature validation
- No actual message content is stored (only metadata)
- Rate limiting prevents abuse
- Phone number validation and formatting

## Testing

### Manual Testing

1. **Test all commands**:
   ```bash
   curl -X POST http://localhost:3000/test \
     -H "Content-Type: application/json" \
     -d '{"message": "buddi roast john", "phoneNumber": "+1234567890"}'
   ```

2. **Test rate limiting**:
   Send multiple commands quickly to the same number

3. **Test group simulation**:
   Use multiple phone numbers to simulate group chat

### Automated Testing

Run the test suite:

```bash
npm test
```

## Monitoring

### Health Check

Monitor bot health:

```bash
curl http://localhost:3000/health
```

### Logs

The bot logs all activity (metadata only):

- Incoming SMS commands
- Outgoing responses
- API errors
- Rate limiting events
- Data cleanup

## Troubleshooting

### Common Issues

1. **"Invalid webhook signature"**
   - Check Twilio auth token
   - Verify webhook URL is correct

2. **"My brain is buffering..."**
   - Check OpenAI API key and credits
   - Verify internet connection

3. **No responses received**
   - Check Twilio phone number configuration
   - Verify webhook URL is accessible

4. **Rate limiting too aggressive**
   - Adjust `RATE_LIMIT_WINDOW_MS` in constants

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development DEBUG=* npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License - see LICENSE file for details.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review the logs for error messages
3. Test with the `/health` endpoint
4. Create an issue with detailed information

---

**Buddi AI SMS Bot** - Making group chats more chaotic and fun! 🤖✨ 