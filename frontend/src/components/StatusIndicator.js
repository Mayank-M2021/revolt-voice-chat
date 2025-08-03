import React from 'react';
import { Wifi, WifiOff, Mic, Volume2, AlertCircle } from 'lucide-react';

const StatusIndicator = ({ status, isRecording, isPlaying }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <Wifi className="status-icon" />,
          text: 'Connected',
          className: 'connected'
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="status-icon" />,
          text: 'Disconnected',
          className: 'disconnected'
        };
      case 'error':
        return {
          icon: <AlertCircle className="status-icon" />,
          text: 'Connection Error',
          className: 'error'
        };
      default:
        return {
          icon: <WifiOff className="status-icon" />,
          text: 'Unknown',
          className: 'unknown'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="status-indicator">
      <div className={`connection-status ${statusInfo.className}`}>
        {statusInfo.icon}
        <span className="status-text">{statusInfo.text}</span>
      </div>

      <div className="activity-indicators">
        {/* Recording Indicator */}
        <div className={`activity-item ${isRecording ? 'active' : ''}`}>
          <Mic className="activity-icon" />
          <span className="activity-label">Recording</span>
          {isRecording && <div className="pulse-dot"></div>}
        </div>

        {/* Playing Indicator */}
        <div className={`activity-item ${isPlaying ? 'active' : ''}`}>
          <Volume2 className="activity-icon" />
          <span className="activity-label">Playing</span>
          {isPlaying && (
            <div className="audio-wave">
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusIndicator;