/**
 * TimerWidget - The actual timer display widget
 * Renders timer controls and countdown display
 */

import React, { useEffect, useState } from 'react';
import { useTimer, useTimerListener } from '../hooks';
import { getAutoScoreOption } from '../config/timer.config';

/**
 * TimerWidget Component
 */
export function TimerWidget({ widgetId, config, onClose }) {
  const [localConfig, setLocalConfig] = useState(config);
  
  // Initialize timer
  const timer = useTimer({
    duration: localConfig.duration,
    autoScore: localConfig.autoScore,
    onTimeout: () => {
      console.log(`Timer ${widgetId} timeout! Auto-scoring as ${localConfig.autoScore}`);
      // In real app, this would trigger the review system
    },
    emitEvents: true,
  });
  
  // Listen for config updates
  useEffect(() => {
    if (config.duration !== localConfig.duration || config.autoScore !== localConfig.autoScore) {
      setLocalConfig(config);
      timer.updateConfig({
        duration: config.duration,
        autoScore: config.autoScore,
      });
    }
  }, [config, localConfig, timer]);
  
  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get auto-score info
  const autoScoreInfo = getAutoScoreOption(localConfig.autoScore);
  
  // Calculate progress bar width
  const progressWidth = (timer.progress || 0) + '%';
  
  // Handle quick duration change
  const handleQuickDuration = (seconds) => {
    timer.updateConfig({ duration: seconds });
  };
  
  // Handle auto-score change
  const handleAutoScoreChange = (score) => {
    timer.updateConfig({ autoScore: score });
  };
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      color: '#fff',
      fontFamily: 'monospace',
    }}>
      {/* Timer Display */}
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
      }}>
        <div style={{
          fontSize: '42px',
          fontWeight: 'bold',
          marginBottom: '8px',
          fontFeatureSettings: '"tnum"',
          letterSpacing: '2px',
        }}>
          {formatTime(timer.timeLeft)}
        </div>
        
        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '8px',
        }}>
          <div style={{
            width: progressWidth,
            height: '100%',
            backgroundColor: autoScoreInfo.color || '#3b82f6',
            transition: 'width 1s linear',
          }} />
        </div>
        
        <div style={{
          fontSize: '12px',
          color: '#aaa',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>0:00</span>
          <span>{formatTime(localConfig.duration)}</span>
        </div>
      </div>
      
      {/* Auto-Score Indicator */}
      <div style={{
        marginBottom: '20px',
        padding: '8px 12px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '6px',
        borderLeft: `4px solid ${autoScoreInfo.color}`,
      }}>
        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '2px' }}>
          Auto-score on timeout:
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontSize: '14px',
        }}>
          <span>{autoScoreInfo.icon}</span>
          <span>{autoScoreInfo.label}</span>
          <span style={{ 
            fontSize: '11px', 
            color: '#888',
            marginLeft: 'auto',
          }}>
            ({autoScoreInfo.description})
          </span>
        </div>
      </div>
      
      {/* Quick Duration Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>
          Quick durations:
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
        }}>
          {[5, 10, 30, 60, 120].map((seconds) => (
            <button
              key={seconds}
              onClick={() => handleQuickDuration(seconds)}
              disabled={timer.isRunning}
              style={{
                padding: '6px 10px',
                backgroundColor: localConfig.duration === seconds 
                  ? 'rgba(59, 130, 246, 0.3)' 
                  : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${localConfig.duration === seconds 
                  ? 'rgba(59, 130, 246, 0.5)' 
                  : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '12px',
                cursor: timer.isRunning ? 'not-allowed' : 'pointer',
                opacity: timer.isRunning ? 0.5 : 1,
              }}
            >
              {seconds}s
            </button>
          ))}
        </div>
      </div>
      
      {/* Auto-Score Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>
          Auto-score:
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
        }}>
          {[1, 2, 3, 4, 5].map((score) => {
            const scoreInfo = getAutoScoreOption(score);
            return (
              <button
                key={score}
                onClick={() => handleAutoScoreChange(score)}
                disabled={timer.isRunning}
                style={{
                  padding: '6px 10px',
                  backgroundColor: localConfig.autoScore === score 
                    ? `${scoreInfo.color}33` 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${localConfig.autoScore === score 
                    ? scoreInfo.color 
                    : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                  cursor: timer.isRunning ? 'not-allowed' : 'pointer',
                  opacity: timer.isRunning ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{scoreInfo.icon}</span>
                <span>{score}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Control Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: 'auto',
      }}>
        <button
          onClick={timer.isRunning ? timer.pause : timer.start}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor: timer.isRunning 
              ? 'rgba(239, 68, 68, 0.2)' 
              : 'rgba(34, 197, 94, 0.2)',
            border: `1px solid ${timer.isRunning ? '#ef4444' : '#22c55e'}`,
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {timer.isRunning ? (
            <>
              <span>⏸️</span>
              <span>Pause</span>
            </>
          ) : (
            <>
              <span>▶️</span>
              <span>Start</span>
            </>
          )}
        </button>
        
        <button
          onClick={timer.reset}
          style={{
            padding: '10px 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          🔄
        </button>
      </div>
    </div>
  );
}

export default TimerWidget;