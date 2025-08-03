import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, Zap } from 'lucide-react';

const AudioControls = ({
  isConnected,
  isRecording,
  isPlaying,
  isMuted,
  onStartRecording,
  onStopRecording,
  onInterrupt,
  onToggleMute,
  onReconnect
}) => {
  return (
    <div className="audio-controls">
      <div className="controls-container">
        {/* Main Recording Button */}
        <div className="main-control">
          <button
            className={`record-button ${isRecording ? 'recording' : ''} ${!isConnected ? 'disabled' : ''}`}
            onMouseDown={isConnected ? onStartRecording : undefined}
            onMouseUp={isRecording ? onStopRecording : undefined}
            onMouseLeave={isRecording ? onStopRecording : undefined}
            onTouchStart={isConnected ? onStartRecording : undefined}
            onTouchEnd={isRecording ? onStopRecording : undefined}
            disabled={!isConnected}
            title={isConnected ? 'Hold to speak' : 'Not connected'}
          >
            <div className="button-content">
              {isRecording ? (
                <>
                  <MicOff className="icon" />
                  <span className="pulse-ring"></span>
                </>
              ) : (
                <Mic className="icon" />
              )}
            </div>
          </button>
          
          <div className="button-label">
            {isRecording ? 'Release to send' : 'Hold to speak'}
          </div>
        </div>

        {/* Secondary Controls */}
        <div className="secondary-controls">
          {/* Interrupt Button */}
          {isPlaying && (
            <button
              className="control-button interrupt-button"
              onClick={onInterrupt}
              title="Interrupt AI (ESC)"
            >
              <div className="interrupt-icon">
                <Zap className="icon" />
              </div>
              <span className="control-label">Interrupt</span>
            </button>
          )}

          {/* Mute Toggle */}
          <button
            className={`control-button mute-button ${isMuted ? 'muted' : ''}`}
            onClick={onToggleMute}
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX className="icon" /> : <Volume2 className="icon" />}
            <span className="control-label">
              {isMuted ? 'Unmute' : 'Mute'}
            </span>
          </button>

          {/* Reconnect Button */}
          {!isConnected && (
            <button
              className="control-button reconnect-button"
              onClick={onReconnect}
              title="Reconnect to voice chat"
            >
              <RotateCcw className="icon" />
              <span className="control-label">Reconnect</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      <div className="status-messages">
        {!isConnected && (
          <div className="status-message error">
            <span className="status-dot error"></span>
            Connection lost - Click reconnect to try again
          </div>
        )}
        
        {isConnected && !isRecording && !isPlaying && (
          <div className="status-message ready">
            <span className="status-dot ready"></span>
            Ready - Hold the microphone to start speaking
          </div>
        )}
        
        {isRecording && (
          <div className="status-message recording">
            <span className="status-dot recording"></span>
            Listening... Release when finished
          </div>
        )}
        
        {isPlaying && (
          <div className="status-message playing">
            <span className="status-dot playing"></span>
            AI is responding... Press interrupt to stop
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="shortcuts-info">
        <div className="shortcut">
          <kbd>Space</kbd> Hold to record
        </div>
        <div className="shortcut">
          <kbd>Esc</kbd> Interrupt AI
        </div>
      </div>
    </div>
  );
};

export default AudioControls;