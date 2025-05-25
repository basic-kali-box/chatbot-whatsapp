require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { Groq } = require('groq-sdk');
const fs = require('fs');
const path = require('path');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Load FAQ document
let faqData = { faqs: [] };
const faqPath = path.join(__dirname, 'faq.json');

try {
  if (fs.existsSync(faqPath)) {
    const rawData = fs.readFileSync(faqPath, 'utf8');
    faqData = JSON.parse(rawData);
    console.log(`Loaded ${faqData.faqs.length} FAQs from ${faqPath}`);
  } else {
    console.log('FAQ file not found. Using empty FAQ database.');
  }
} catch (error) {
  console.error('Error loading FAQ data:', error);
}

// Initialize WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }
});

// Display QR code in terminal
client.on('qr', (qr) => {
  console.log('Scan the QR code below to log in to WhatsApp Web:');
  qrcode.generate(qr, { small: true });
});

// Handle client ready state
client.on('ready', () => {
  console.log('WhatsApp client is ready!');
  console.log('The bot is now active and will respond to incoming messages.');
});

// Handle disconnected state
client.on('disconnected', (reason) => {
  console.log('Client was disconnected:', reason);
});

// Handle authentication failures
client.on('auth_failure', (msg) => {
  console.error('Authentication failure:', msg);
});

// Process incoming messages
client.on('message', async (message) => {
  try {
    // Skip processing for messages sent by the bot itself
    if (message.fromMe) return;
    
    console.log(`New message from ${message.from}: ${message.body}`);
    
    // Get user's message
    const userMessage = message.body;
    
    // Skip empty messages
    if (!userMessage.trim()) return;
    
    // Send "typing" indicator
    const chat = await message.getChat();
    chat.sendStateTyping();
    
    // Process with Groq API
    const response = await processWithGroq(userMessage);
    
    // Reply to the message
    await message.reply(response);
    
  } catch (error) {
    console.error('Error processing message:', error);
    try {
      await message.reply('Sorry, I encountered an error processing your message. Please try again later.');
    } catch (replyError) {
      console.error('Error sending error reply:', replyError);
    }
  }
});

/**
 * Search the FAQ database for a matching question
 * @param {string} userQuery - The user's question
 * @returns {string|null} - The answer if found, null otherwise
 */
function searchFAQ(userQuery) {
  // Clean and normalize the query for better matching
  const normalizedQuery = userQuery.toLowerCase().trim();
  
  // Check for exact matches first
  for (const faq of faqData.faqs) {
    if (faq.question.toLowerCase() === normalizedQuery) {
      console.log('Found exact FAQ match');
      return faq.answer;
    }
  }
  
  // Check for partial matches (if query is at least 5 characters)
  if (normalizedQuery.length >= 5) {
    for (const faq of faqData.faqs) {
      if (faq.question.toLowerCase().includes(normalizedQuery) || 
          normalizedQuery.includes(faq.question.toLowerCase())) {
        console.log('Found partial FAQ match');
        return faq.answer;
      }
    }
  }
  
  // No match found
  return null;
}

/**
 * Process user message with FAQ lookup first, then Groq API as fallback
 * @param {string} userMessage - The message from the user
 * @returns {Promise<string>} - The response (from FAQ or AI)
 */
async function processWithGroq(userMessage) {
  try {
    // First check if we have an FAQ match
    const faqAnswer = searchFAQ(userMessage);
    if (faqAnswer) {
      console.log('Responding with FAQ answer');
      return faqAnswer;
    }
    
    // No FAQ match, use Groq API
    console.log('No FAQ match found, using Groq API');
    const completion = await groq.chat.completions.create({
      model: process.env.MODEL_ID,
      messages: [
        { role: "system", content: process.env.SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });
    
    return completion.choices[0]?.message?.content.trim() || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('Groq API error:', error);
    return "I'm having trouble connecting to my brain right now. Please try again in a moment.";
  }
}

/**
 * Reload FAQ data from the file
 */
function reloadFAQData() {
  try {
    if (fs.existsSync(faqPath)) {
      const rawData = fs.readFileSync(faqPath, 'utf8');
      faqData = JSON.parse(rawData);
      console.log(`Reloaded ${faqData.faqs.length} FAQs from ${faqPath}`);
    }
  } catch (error) {
    console.error('Error reloading FAQ data:', error);
  }
}

// Set up periodic FAQ data reloading (every 5 minutes)
setInterval(reloadFAQData, 5 * 60 * 1000);

// Initialize the client
client.initialize();

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await client.destroy();
  process.exit(0);
});
