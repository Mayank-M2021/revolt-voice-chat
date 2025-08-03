require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const GeminiLiveService = require('./services/geminiService');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// WebSocket Server for voice chat
const wss = new WebSocketServer({ 
  server,
  path: '/voice-chat'
});

// Store active sessions
const activeSessions = new Map();

// Revolt Motors system instructions
const REVOLT_SYSTEM_INSTRUCTIONS = `
You are Rev, the helpful AI assistant for Revolt Motors, India's leading electric motorcycle company. Your role is to:

1. Answer questions about Revolt Motors products, services, and company information
2. Provide details about electric motorcycles, specifications, features, and pricing
3. Assist with customer inquiries about purchases, service, maintenance, and support
4. Share information about Revolt's sustainability mission and electric mobility vision
5. Guide users through product comparisons and recommendations

Key Information about Revolt Motors:
- Founded in 2019, pioneering electric mobility in India
- Products: RV400 and RV1+ electric motorcycles
- Features: AI-enabled, connected, sustainable transportation
- Services: Home delivery, mobile service, battery swapping
- Mission: Making India electric with innovative, affordable e-mobility solutions

Guidelines:
- Stay focused on Revolt Motors topics
- If asked about competitors or unrelated topics, politely redirect to Revolt Motors
- Be enthusiastic about electric mobility and sustainability
- Provide accurate, helpful information in a conversational tone
- If you don't know specific details, acknowledge it and offer to help with what you do know

Remember: You're representing Revolt Motors, so maintain a professional yet friendly tone that reflects the brand's innovative and customer-focused values.
`;

// WebSocket connection handler
wss.on('connection', async (ws, request) => {
  const sessionId = generateSessionId();
  logger.info(`New WebSocket connection established: ${sessionId}`);

  try {
    // Initialize Gemini Live session
    const geminiService = new GeminiLiveService(process.env.GEMINI_API_KEY);
    await geminiService.initialize(REVOLT_SYSTEM_INSTRUCTIONS);
    
    activeSessions.set(sessionId, {
      ws,
      geminiService,
      isActive: true,
      lastActivity: Date.now()
    });

    ws.sessionId = sessionId;

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      sessionId,
      message: 'Connected to Revolt Motors voice assistant'
    }));

    // Handle incoming messages
    ws.on('message', async (data) => {
      // The client-side code will send binary messages for audio, so we must handle them differently.
      if (typeof data === 'string') {
        try {
          const message = JSON.parse(data);
          await handleWebSocketMessage(sessionId, message, data);
        } catch (error) {
          logger.error(`Error handling WebSocket JSON message: ${error.message}`);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message'
          }));
        }
      } else {
        // This is a binary message (audio data from the client)
        // We will directly pass the raw binary data to the gemini service.
        await handleWebSocketAudio(sessionId, data);
      }
    });

    // Handle connection close
    ws.on('close', () => {
      logger.info(`WebSocket connection closed: ${sessionId}`);
      const session = activeSessions.get(sessionId);
      if (session) {
        session.isActive = false;
        if (session.geminiService) {
          session.geminiService.cleanup();
        }
      }
      activeSessions.delete(sessionId);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for session ${sessionId}: ${error.message}`);
    });

  } catch (error) {
    logger.error(`Failed to initialize session: ${error.message}`);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to initialize voice chat session'
    }));
    ws.close();
  }
});

// Handle WebSocket messages
async function handleWebSocketMessage(sessionId, message) {
  const session = activeSessions.get(sessionId);
  if (!session || !session.isActive) {
    return;
  }

  const { ws, geminiService } = session;
  session.lastActivity = Date.now();

  switch (message.type) {
    case 'audio_start':
      logger.info(`Audio stream started for session: ${sessionId}`);
      await geminiService.startAudioStream();
      break;

    case 'audio_end':
      logger.info(`Audio stream ended for session: ${sessionId}`);
      const response = await geminiService.endAudioStream();
      if (response) {
        // Send a JSON object with the audio data as a base64 string
        ws.send(JSON.stringify({
          type: 'audio_response',
          audioData: response.audioData,
          transcript: response.transcript
        }));
      }
      break;

    case 'interrupt':
      logger.info(`Interruption detected for session: ${sessionId}`);
      await geminiService.handleInterruption();
      ws.send(JSON.stringify({
        type: 'interrupted',
        message: 'AI speech interrupted'
      }));
      break;

    case 'text_message':
      if (message.text) {
        const response = await geminiService.sendTextMessage(message.text);
        ws.send(JSON.stringify({
          type: 'text_response',
          text: response.text,
          audioData: response.audioData
        }));
      }
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    default:
      logger.warn(`Unknown message type: ${message.type}`);
      break;
  }
}

// New function to handle raw binary audio data
async function handleWebSocketAudio(sessionId, audioData) {
  const session = activeSessions.get(sessionId);
  if (!session || !session.isActive) {
    return;
  }
  session.lastActivity = Date.now();
  await session.geminiService.sendAudioData(audioData);
}

// Generate unique session ID
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Cleanup inactive sessions
setInterval(() => {
  const now = Date.now();
  const timeout = 30 * 60 * 1000; // 30 minutes

  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastActivity > timeout) {
      logger.info(`Cleaning up inactive session: ${sessionId}`);
      if (session.geminiService) {
        session.geminiService.cleanup();
      }
      if (session.ws && session.ws.readyState === 1) {
        session.ws.close();
      }
      activeSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    activeSessions: activeSessions.size,
    timestamp: new Date().toISOString()
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Revolt Motors Voice Chat API',
    version: '1.0.0',
    endpoints: {
      websocket: '/voice-chat',
      health: '/health'
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`Revolt Motors Voice Chat Server running on port ${PORT}`);
  logger.info(`WebSocket endpoint: ws://localhost:${PORT}/voice-chat`);
});