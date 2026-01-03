/**
 * TimerConfigModal - Modal for configuring timer settings
 * Appears when user selects "Timer" from Command Center
 */

import React, { useState, useEffect } from 'react';
import { timerConfig, getDurationLabel, getAutoScoreOption } from '../config/timer.config';

/**
 * TimerConfigModal Component
 */
export function TimerConfigModal({
  isOpen,
  onClose,
  onConfirm,
  initialConfig = {}
}) {
  const [config, setConfig] = useState({
    duration: initialConfig.duration || timerConfig.defaults.duration,
    autoScore: initialConfig.autoScore || timerConfig.defaults.autoScore,
    autoReset: initialConfig.autoReset !== false,
    beepOnEnd: initialConfig.beepOnEnd !== false,
  });

  // Reset config when modal opens with new initialConfig
  useEffect(() => {
    if (isOpen) {
      setConfig({
        duration: initialConfig.duration || timerConfig.defaults.duration,
        autoScore: initialConfig.autoScore || timerConfig.defaults.autoScore,
        autoReset: initialConfig.autoReset !== false,
        beepOnEnd: initialConfig.beepOnEnd !== false,
      });
    }
  }, [isOpen, initialConfig]);

  // Don't render if not open
  if (!isOpen) return null;

  // Handle config change
  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // Handle custom duration input
  const handleCustomDuration = (e) => {
    const value = parseInt(e.target.value) || 30;
    const clamped = Math.max(
      timerConfig.validation.minDuration,
      Math.min(timerConfig.validation.maxDuration, value)
    );
    handleConfigChange('duration', clamped);
  };

  // Handle confirm
  const handleConfirm = () => {
    onConfirm(config);
    onClose();
  };

  // Get auto-score info
  const autoScoreInfo = getAutoScoreOption(config.autoScore);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10001,
      animation: 'fadeIn 0.2s ease-out',
    }} onClick={onClose}>
      <div
        style={{
          backgroundColor: 'rgba(20, 20, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          width: '90%',
          maxWidth: '400px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '12px',
          }}>
            <div style={{
              fontSize: '32px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              ⏱️
            </div>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: '#fff',
              }}>
                Timer
              </h2>
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.6)',
              }}>
                Configure your study timer
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
        }}>
          {/* Duration Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '500',
              color: '#fff',
            }}>
              Duration
            </h3>

            {/* Quick Duration Buttons */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '16px',
            }}>
              {timerConfig.durations
                .filter(d => d.group === 'quick' || d.group === 'standard')
                .map((duration) => (
                  <button
                    key={duration.value}
                    onClick={() => handleConfigChange('duration', duration.value)}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: config.duration === duration.value
                        ? 'rgba(59, 130, 246, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${config.duration === duration.value
                        ? '#3b82f6'
                        : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      cursor: 'pointer',
                      flex: '1',
                      minWidth: '80px',
                    }}
                  >
                    {duration.label}
                  </button>
                ))}
            </div>

            {/* Custom Duration Input */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '10px',
              padding: '16px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
              }}>
                <label style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  flexShrink: 0,
                }}>
                  Custom duration:
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1,
                }}>
                  <input
                    type="number"
                    min={timerConfig.validation.minDuration}
                    max={timerConfig.validation.maxDuration}
                    value={config.duration}
                    onChange={handleCustomDuration}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  />
                  <span style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    flexShrink: 0,
                  }}>
                    seconds
                  </span>
                </div>
              </div>
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.4)',
                display: 'flex',
                justifyContent: 'space-between',
              }}>
                <span>Min: {timerConfig.validation.minDuration}s</span>
                <span>Max: {timerConfig.validation.maxDuration}s</span>
              </div>
            </div>
          </div>

          {/* Auto-Score Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '500',
              color: '#fff',
            }}>
              Auto-Score on Timeout
            </h3>

            <p style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '16px',
            }}>
              If you don't answer in time, the question will be automatically scored as:
            </p>

            {/* Auto-Score Options */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {timerConfig.autoScoreOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleConfigChange('autoScore', option.value)}
                  style={{
                    padding: '16px',
                    backgroundColor: config.autoScore === option.value
                      ? `${option.color}20`
                      : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${config.autoScore === option.value
                      ? option.color
                      : 'rgba(255, 255, 255, 0.05)'}`,
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{
                    fontSize: '20px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: config.autoScore === option.value
                      ? option.color
                      : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {option.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '500',
                      marginBottom: '4px',
                    }}>
                      {option.label}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}>
                      {option.description}
                    </div>
                  </div>
                  {config.autoScore === option.value && (
                    <div style={{
                      fontSize: '16px',
                      color: option.color,
                    }}>
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Behavior Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '500',
              color: '#fff',
            }}>
              Behavior
            </h3>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {/* Auto-Reset Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}>
                <div>
                  <div style={{
                    fontWeight: '500',
                    fontSize: '14px',
                    color: '#fff',
                    marginBottom: '4px',
                  }}>
                    Auto-reset timer
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}>
                    Automatically reset timer after timeout for next question
                  </div>
                </div>
                <div
                  onClick={() => handleConfigChange('autoReset', !config.autoReset)}
                  style={{
                    width: '44px',
                    height: '24px',
                    backgroundColor: config.autoReset ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: config.autoReset ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#fff',
                    borderRadius: '50%',
                    transition: 'left 0.2s',
                  }} />
                </div>
              </div>

              {/* Beep on End Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}>
                <div>
                  <div style={{
                    fontWeight: '500',
                    fontSize: '14px',
                    color: '#fff',
                    marginBottom: '4px',
                  }}>
                    Sound on timeout
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.5)',
                  }}>
                    Play a sound when timer ends
                  </div>
                </div>
                <div
                  onClick={() => handleConfigChange('beepOnEnd', !config.beepOnEnd)}
                  style={{
                    width: '44px',
                    height: '24px',
                    backgroundColor: config.beepOnEnd ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: config.beepOnEnd ? '22px' : '2px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#fff',
                    borderRadius: '50%',
                    transition: 'left 0.2s',
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Start Timer
          </button>
        </div>
      </div>
    </div>
  );
}

export default TimerConfigModal;