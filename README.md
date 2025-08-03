# Revolt Voice Chat

Revolt Motors Voice Chat Application
A real-time conversational voice interface built with the Gemini Live API, replicating the functionality of Revolt Motors' voice assistant with interruption handling and low-latency responses.

🚀 Features
Real-time Voice Conversation: Bidirectional audio communication
Interruption Handling: Users can interrupt the AI mid-response
Low Latency: Optimized for 1-2 second response times
Multi-language Support: Handles various languages
Clean UI: Modern, responsive interface
Keyboard Shortcuts: Space to record, ESC to interrupt
Real-time Status: Visual indicators for connection and activity


🏗️ Architecture
Backend: Node.js/Express with WebSocket support
Frontend: React with real-time audio processing
API: Google Gemini Live API integration
Communication: WebSocket for real-time bidirectional communication


📋 Prerequisites
Node.js 18+
npm or yarn
Google AI Studio API key
Modern web browser with microphone access


🚀 Running the Application
Development Mode
Start both backend and frontend in separate terminals:
bash# Terminal 1 - Backend
cd backend
npm run dev


# Terminal 2 - Frontend
cd frontend
npm start
The application will be available at:

Frontend: http://localhost:3000
Backend: http://localhost:3001
WebSocket: ws://localhost:3001/voice-chat

Production Mode
bash# Build frontend
cd frontend
npm run build

# Start backend (serves frontend)
cd ../backend
npm start


🎯 Usage

Basic Operation

Connect: The app automatically connects to the voice chat service
Speak: Hold the microphone button or press and hold SPACE
Release: Let go to send your audio to the AI
Listen: The AI responds with synthesized speech
Interrupt: Press ESC or click interrupt while AI is speaking


Keyboard Shortcuts

SPACE: Hold to record voice input
ESC: Interrupt AI response
Enter: Send text message (if implemented)

Voice Commands
Ask Rev (the AI assistant) about:

Revolt Motors products and specifications
Electric motorcycle features
Pricing and availability
Service and maintenance
Test rides and purchases
Battery technology and swapping
Company information


Model Selection
For development and testing, use:

gemini-2.0-flash-live-001 (higher rate limits)
gemini-live-2.5-flash-preview (alternative)

For production, use:

gemini-2.5-flash-preview-native-audio-dialog (native audio support)

Acknowledgments

Google Gemini Live API for real-time voice capabilities
Revolt Motors for the inspiration and use case
React and Node.js communities for excellent tooling
Lucide React for beautiful icon
