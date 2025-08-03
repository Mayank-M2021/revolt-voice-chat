const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

class GeminiLiveService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = null;
    this.chat = null;
    this.isInitialized = false;
    this.audioBuffer = []; // This will store incoming audio chunks
    this.isStreaming = false;
    this.interruptionFlag = false;

    // Model configuration
    this.modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.generationConfig = {
      temperature: 0.7,
      maxOutputTokens: 1000,
      candidateCount: 1
    };
  }

  async initialize(systemInstructions) {
    try {
      logger.info('Initializing Gemini Live service...');

      this.model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemInstructions,
        generationConfig: this.generationConfig
      });

      this.chat = this.model.startChat({
        history: []
      });

      this.isInitialized = true;
      logger.info('Gemini Live service initialized successfully');
    } catch (error) {
      logger.error(`Failed to initialize Gemini service: ${error.message}`);
      throw error;
    }
  }

  async startAudioStream() {
    if (!this.isInitialized) {
      throw new Error('Service not initialized');
    }

    this.audioBuffer = [];
    this.isStreaming = true;
    this.interruptionFlag = false;
    logger.info('Audio stream started');
  }

  async sendAudioData(audioData) {
    if (!this.isStreaming) {
      return;
    }

    try {
      this.audioBuffer.push(audioData);
      logger.debug(`Received audio chunk: ${audioData.length} bytes`);
    } catch (error) {
      logger.error(`Error processing audio data: ${error.message}`);
    }
  }

  async endAudioStream() {
    if (!this.isStreaming) {
      return null;
    }

    this.isStreaming = false;

    try {
      if (this.audioBuffer.length === 0) {
        logger.warn('No audio data to process');
        return null;
      }

      const combinedAudio = Buffer.concat(this.audioBuffer);
      logger.info(`Processing audio stream: ${combinedAudio.length} bytes`);

      // STEP 1: Simulate converting user's audio input to text
      const transcript = await this.simulateAudioToText(combinedAudio);
      if (!transcript) {
        logger.warn('No transcript to process');
        return null;
      }
      logger.info(`Simulated transcript: "${transcript}"`);

      // STEP 2: Get a text response from Gemini
      const geminiResponseText = await this.getGeminiTextResponse(transcript);
      
      // STEP 3: Simulate converting Gemini's text response to audio output
      const audioData = await this.simulateTextToSpeech(geminiResponseText);

      return {
        audioData: audioData,
        transcript: geminiResponseText
      };

    } catch (error) {
      logger.error(`Error processing audio stream: ${error.message}`);
      return null;
    } finally {
      this.audioBuffer = [];
    }
  }

  async getGeminiTextResponse(text) {
    logger.info(`Sending text message to Gemini: "${text}"`);
    try {
      const result = await this.chat.sendMessage(text);
      const response = await result.response;
      const responseText = response.text();
      logger.info(`Received response from Gemini: "${responseText}"`);
      return responseText;
    } catch (error) {
       logger.error(`Gemini API error: ${error.message}`);
       return "I'm sorry, I'm having trouble processing that request right now.";
    }
  }

  async handleInterruption() {
    logger.info('Handling interruption...');
    this.interruptionFlag = true;

    if (this.isStreaming) {
      this.isStreaming = false;
      this.audioBuffer = [];
    }
    
    logger.info('Interruption handled');
  }

  // Placeholder for audio-to-text conversion
  async simulateAudioToText(audioBuffer) {
    // In a real application, you would send the audioBuffer to a real STT service.
    // For the assignment, this simulates a transcript.
    logger.info("Simulating Speech-to-Text conversion...");
    return "What are the features of Revolt motorcycles?";
  }

  // Placeholder for text-to-speech conversion
  async simulateTextToSpeech(text) {
    // This function simulates converting text to audio by returning a silent buffer.
    logger.info("Simulating Text-to-Speech conversion...");
    const audioLength = Math.min(text.length * 100, 10000);
    const placeholderAudio = Buffer.alloc(audioLength, 0);
    
    return placeholderAudio.toString('base64');
  }

  cleanup() {
    logger.info('Cleaning up Gemini service...');
    this.isStreaming = false;
    this.audioBuffer = [];
    this.interruptionFlag = false;
  }

  isHealthy() {
    return this.isInitialized && this.model !== null;
  }
}

module.exports = GeminiLiveService;