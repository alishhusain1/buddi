require('dotenv').config();
const twilio = require('twilio');

console.log('Testing Twilio credentials...');
console.log('Account SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing');
console.log('Auth Token:', process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing');
console.log('Phone Number:', process.env.TWILIO_PHONE_NUMBER ? '✅ Set' : '❌ Missing');

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  client.api.accounts(process.env.TWILIO_ACCOUNT_SID)
    .fetch()
    .then(account => {
      console.log('✅ Twilio authentication successful!');
      console.log('Account Status:', account.status);
      console.log('Account Type:', account.type);
    })
    .catch(error => {
      console.log('❌ Twilio authentication failed:');
      console.log('Error:', error.message);
      console.log('Code:', error.code);
    });
} else {
  console.log('❌ Missing Twilio credentials in .env file');
} 