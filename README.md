# WhatsApp Groq Chatbot

A production-ready WhatsApp chatbot using Node.js, whatsapp-web.js, and the Groq API for LLM responses.

## Features

- WhatsApp Web integration using whatsapp-web.js
- Automated responses powered by Groq API (LLaMA3, Mixtral, etc.)
- Custom FAQ document integration for quick responses
- Auto-reload of FAQ data every 5 minutes
- Secure credentials management with dotenv
- Error handling for message processing and API calls
- Simple QR code authentication via terminal
- Docker support for cloud deployment

## Prerequisites

- Node.js (v14 or newer)
- A Groq API key (get one at https://console.groq.com)
- A WhatsApp account on your mobile device

## Setup Instructions

1. **Clone or download this repository**

2. **Install dependencies**

   ```bash
   cd whatsapp-groq-bot
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file and add your Groq API key and preferred model:

   ```
   GROQ_API_KEY=your_groq_api_key_here
   MODEL_ID=llama3-8b-8192
   SYSTEM_PROMPT="You are a helpful and professional customer service assistant. Answer concisely and clearly."
   ```

4. **Run the bot**

   ```bash
   npm start
   ```

5. **Authenticate with WhatsApp**

   - A QR code will be displayed in your terminal
   - Open WhatsApp on your phone
   - Go to Settings > Linked Devices > Link a Device
   - Scan the QR code displayed in your terminal

6. **Use the bot**

   Once authenticated, the bot will automatically respond to incoming messages using the Groq API.

## Models

You can use any model available on the Groq platform by changing the `MODEL_ID` in your `.env` file. Some options include:

- `llama3-8b-8192` - Meta's LLaMA 3 8B model
- `llama3-70b-8192` - Meta's LLaMA 3 70B model
- `mixtral-8x7b-32768` - Mixtral 8x7B model

## Troubleshooting

- If you encounter authentication issues, delete the `.wwebjs_auth` directory and try again
- Make sure your Groq API key is valid and has sufficient quota
- Check your internet connection if QR code generation fails

## Cloud Deployment

To keep your bot running 24/7 even when your PC is off, deploy it to a cloud server:

### Option 1: VPS Deployment (Recommended)

1. **Rent a VPS** from providers like DigitalOcean, Linode, AWS, etc. ($5-10/month)
2. **Connect to your VPS** via SSH:
   ```bash
   ssh user@your-server-ip
   ```
3. **Set up the environment**:
   ```bash
   # Install Node.js and npm
   sudo apt update
   sudo apt install -y nodejs npm git
   
   # Clone your repository (or upload files via SFTP)
   git clone https://your-repo-url.git
   # OR: Upload the files manually
   
   # Install dependencies
   cd whatsapp-groq-bot
   npm install
   
   # Set up your environment variables
   cp .env.example .env
   nano .env  # Edit with your API keys
   ```
4. **Install PM2** to keep your app running:
   ```bash
   npm install -g pm2
   pm2 start index.js --name whatsapp-bot
   pm2 startup  # Follow instructions to make PM2 start on boot
   pm2 save
   ```
5. **First-time authentication**:
   - For the first run, you'll need to scan the QR code
   - Use `ssh -Y user@server-ip` for X11 forwarding to see the QR code
   - OR: Use `pm2 logs whatsapp-bot` to see the QR code as text and use an online QR generator

### Option 2: Docker Deployment

The bot includes Docker configuration for easy deployment:

1. **Install Docker** on your server:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose
   ```
2. **Copy your project files** to the server
3. **Create .env file** with your configuration:
   ```bash
   cp .env.example .env
   nano .env  # Add your GROQ_API_KEY and other variables
   ```
4. **Build and start the container**:
   ```bash
   docker-compose up -d  # Run in detached mode
   docker-compose logs -f  # View logs and scan the QR code
   ```
5. **Update your FAQ** anytime by editing the `faq.json` file on your server

### Option 3: Cloud Platform Deployment

1. **Railway, Render, or Heroku**:
   - Create an account on these platforms
   - Connect your GitHub repository
   - Set environment variables in the platform dashboard
   - Deploy your app

2. **First-time setup**:
   - You'll need to connect once for QR code scanning
   - Use the platform's log viewer to see the QR code

## Notes

- The first authentication always requires scanning a QR code
- After scanning once, the session is saved for future runs
- For security, keep your .env file and .wwebjs_auth directory protected
- Regularly back up your session data
