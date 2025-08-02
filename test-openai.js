require('dotenv').config();
const OpenAI = require('openai');

console.log('Testing OpenAI credentials...');
console.log('API Key:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');

if (process.env.OPENAI_API_KEY) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  openai.models.list()
    .then(response => {
      console.log('✅ OpenAI authentication successful!');
      console.log('Available models:', response.data.length);
    })
    .catch(error => {
      console.log('❌ OpenAI authentication failed:');
      console.log('Error:', error.message);
      console.log('Code:', error.code);
    });
} else {
  console.log('❌ Missing OpenAI API key in .env file');
} 