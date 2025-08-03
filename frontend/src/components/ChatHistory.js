import React, { useEffect, useRef } from 'react';
import { MessageCircle, User, Bot, Clock } from 'lucide-react';

const ChatHistory = ({ messages, currentTranscript, isRecording }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentTranscript]);

  const renderMessage = (message, index) => {
    const { sender, message: text, timestamp } = message;
    
    return (
      <div key={index} className={`message ${sender}`}>
        <div className="message-header">
          <div className="message-avatar">
            {sender === 'user' ? (
              <User className="avatar-icon" />
            ) : sender === 'assistant' ? (
              <Bot className="avatar-icon" />
            ) : (
              <MessageCircle className="avatar-icon" />
            )}
          </div>
          <div className="message-info">
            <span className="sender-name">
              {sender === 'user' ? 'You' : 
               sender === 'assistant' ? 'Rev Assistant' : 
               'System'}
            </span>
            <span className="message-time">
              <Clock className="time-icon" />
              {timestamp}
            </span>
          </div>
        </div>
        <div className="message-content">
          <p>{text}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-history">
      <div className="chat-header">
        <h2>Conversation</h2>
        <span className="message-count">
          {messages.filter(m => m.sender !== 'system').length} messages
        </span>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <Bot className="empty-icon" />
            <h3>Welcome to Revolt Motors Voice Chat!</h3>
            <p>
              I'm Rev, your AI assistant. I can help you with information about 
              Revolt's electric motorcycles, specifications, pricing, and services.
            </p>
            <p>Hold the microphone button below to start our conversation!</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map(renderMessage)}
          </div>
        )}

        {/* Current transcript display */}
        {(currentTranscript || isRecording) && (
          <div className="current-transcript">
            <div className="transcript-header">
              <div className="message-avatar">
                {isRecording ? <User className="avatar-icon" /> : <Bot className="avatar-icon" />}
              </div>
              <span className="sender-name">
                {isRecording ? 'You (speaking...)' : 'Rev (thinking...)'}
              </span>
            </div>
            <div className="transcript-content">
              {currentTranscript && (
                <p className={isRecording ? 'recording-text' : 'processing-text'}>
                  {currentTranscript}
                  {isRecording && <span className="cursor-blink">|</span>}
                </p>
              )}
              {!currentTranscript && isRecording && (
                <div className="recording-indicator">
                  <div className="audio-bars">
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                  </div>
                  <span>Listening...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auto-scroll target */}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length === 0 && (
        <div className="quick-suggestions">
          <h4>Try asking about:</h4>
          <div className="suggestions-grid">
            <button className="suggestion-chip">
              "What are the features of RV400?"
            </button>
            <button className="suggestion-chip">
              "Tell me about battery swapping"
            </button>
            <button className="suggestion-chip">
              "How much does RV1+ cost?"
            </button>
            <button className="suggestion-chip">
              "Where can I test ride?"
            </button>
            <button className="suggestion-chip">
              "What's the range of Revolt bikes?"
            </button>
            <button className="suggestion-chip">
              "Tell me about service options"
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistory;