import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, Zap } from 'lucide-react';
import AudioControls from './AudioControls';
import ChatHistory from './ChatHistory';
import StatusIndicator from './StatusIndicator';

const VoiceChatApp = () => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [chatHistory, setChatHistory] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [error, setError] = useState(null);

  // Refs for audio and WebSocket
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioElementRef = useRef(null);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001/voice-chat';
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        setIsRecording(false);
        setIsPlaying(false);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error. Please try again.');
        setConnectionStatus('error');
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to connect to voice chat service');
    }
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'connected':
        console.log('Connected to voice chat:', message.sessionId);
        addToChatHistory('system', 'Connected to Revolt Motors voice assistant');
        break;

      case 'audio_response':
        handleAudioResponse(message);
        break;

      case 'text_response':
        addToChatHistory('assistant', message.text);
        if (message.audioData) {
          playAudioResponse(message.audioData);
        }
        break;

      case 'interrupted':
        setIsPlaying(false);
        console.log('AI speech interrupted');
        break;

      case 'error':
        setError(message.message);
        console.error('Server error:', message.message);
        break;

      case 'pong':
        // Keep-alive response
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  };

  // Initialize audio context and get microphone access
  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        processRecordedAudio();
      };

      console.log('Audio initialized successfully');
      return true;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access required for voice chat');
      return false;
    }
  };

  // Process recorded audio
  const processRecordedAudio = async () => {
    if (audioChunksRef.current.length === 0) {
      return;
    }

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Send audio to server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'audio_data',
          audioData: base64Audio
        }));

        wsRef.current.send(JSON.stringify({
          type: 'audio_end'
        }));
      }

      audioChunksRef.current = [];
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Failed to process audio');
    }
  };

  // Start recording
  const startRecording = async () => {
    if (!streamRef.current) {
      const audioReady = await initializeAudio();
      if (!audioReady) return;
    }

    if (!isConnected) {
      setError('Not connected to voice chat service');
      return;
    }

    try {
      // Stop any current playback
      if (isPlaying) {
        handleInterrupt();
      }

      audioChunksRef.current = [];
      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      setCurrentTranscript('Listening...');

      // Send audio start signal
      wsRef.current.send(JSON.stringify({
        type: 'audio_start'
      }));

      console.log('Recording started');
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setCurrentTranscript('Processing...');
      console.log('Recording stopped');
    }
  };

  // Handle interruption
  const handleInterrupt = () => {
    if (isPlaying && audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      setIsPlaying(false);
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'interrupt'
      }));
    }

    // Start new recording
    if (!isRecording) {
      startRecording();
    }
  };

  // Play audio response
  const playAudioResponse = (audioData) => {
    if (!audioData || isMuted) return;

    try {
      // Convert base64 to blob and play
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const audioBlob = new Blob([bytes], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioElementRef.current) {
        audioElementRef.current.src = audioUrl;
        audioElementRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Error playing audio:', err);
    }
  };

  // Handle audio response
  const handleAudioResponse = (message) => {
    if (message.transcript) {
      addToChatHistory('assistant', message.transcript);
    }
    if (message.audioData) {
      playAudioResponse(message.audioData);
    }
  };

  // Add message to chat history
  const addToChatHistory = (sender, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setChatHistory(prev => [...prev, { sender, message, timestamp }]);
  };

  // Send text message (fallback)
  const sendTextMessage = (text) => {
    if (!isConnected) {
      setError('Not connected to voice chat service');
      return;
    }

    addToChatHistory('user', text);
    
    wsRef.current.send(JSON.stringify({
      type: 'text_message',
      text: text
    }));
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioElementRef.current) {
      audioElementRef.current.muted = !isMuted;
    }
  };

  // Cleanup function
  const cleanup = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
  };

  // Effects
  useEffect(() => {
    connectWebSocket();
    initializeAudio();

    return cleanup;
  }, [connectWebSocket]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      }
      if (event.code === 'Escape') {
        if (isPlaying) {
          handleInterrupt();
        }
      }
    };

    const handleKeyUp = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isRecording, isPlaying]);

  return (
    <div className="voice-chat-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <Zap className="logo-icon" />
            <h1>Revolt Motors</h1>
            <span className="subtitle">Voice Assistant</span>
          </div>
          <StatusIndicator 
            status={connectionStatus} 
            isRecording={isRecording} 
            isPlaying={isPlaying} 
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Chat History */}
        <ChatHistory 
          messages={chatHistory}
          currentTranscript={currentTranscript}
          isRecording={isRecording}
        />

        {/* Audio Controls */}
        <AudioControls
          isConnected={isConnected}
          isRecording={isRecording}
          isPlaying={isPlaying}
          isMuted={isMuted}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onInterrupt={handleInterrupt}
          onToggleMute={toggleMute}
          onReconnect={connectWebSocket}
        />

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <span className="error-text">{error}</span>
            <button 
              className="error-dismiss"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="instructions">
          <p>
            <strong>How to use:</strong>
          </p>
          <ul>
            <li>Click and hold the microphone button to speak</li>
            <li>Press and hold SPACE bar for quick recording</li>
            <li>Press ESC to interrupt the AI while speaking</li>
            <li>Ask about Revolt Motors products, features, and services</li>
          </ul>
        </div>
      </main>

      {/* Hidden audio element for playback */}
      <audio
        ref={audioElementRef}
        onEnded={() => setIsPlaying(false)}
        onError={(e) => console.error('Audio playback error:', e)}
        preload="none"
      />
    </div>
  );
};

export default VoiceChatApp;