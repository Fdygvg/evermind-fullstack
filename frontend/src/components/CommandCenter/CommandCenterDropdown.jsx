/**
 * CommandCenterDropdown - The features menu that appears when clicking the button
 * Displays all available features grouped by category
 */

import React, { useEffect, useRef } from 'react';
import { useCommandCenter } from './hooks';
import { getFeaturesByCategory, FeatureCategories } from './core/FeatureRegistry';

/**
 * CommandCenterDropdown Component
 */
export function CommandCenterDropdown() {
  const {
    isOpen,
    position,
    availableFeatures,
    executeFeature,
    close
  } = useCommandCenter();

  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Check if click was on the button (handled by button component)
        const button = document.querySelector('.command-center-button');
        if (!button || !button.contains(event.target)) {
          close();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);

      // Add escape key listener
      const handleEscape = (event) => {
        if (event.key === 'Escape') {
          close();
        }
      };
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, close]);

  // Don't render if not open
  if (!isOpen) return null;

  // Group features by category
  const featuresByCategory = getFeaturesByCategory();

  // Calculate dropdown position (below button, with boundary checks)
  const dropdownWidth = 280;
  const dropdownHeight = 400;

  let dropdownX = position.x;
  let dropdownY = position.y + 60; // Below the button

  // Adjust if near right edge
  if (dropdownX + dropdownWidth > window.innerWidth) {
    dropdownX = window.innerWidth - dropdownWidth - 20;
  }

  // Adjust if near bottom edge
  if (dropdownY + dropdownHeight > window.innerHeight) {
    dropdownY = position.y - dropdownHeight - 10; // Above the button
  }

  // Ensure minimum position
  dropdownX = Math.max(20, dropdownX);
  dropdownY = Math.max(20, dropdownY);

  // Handle feature click
  const handleFeatureClick = (feature) => {
    executeFeature(feature.id);
  };

  // Get category label
  const getCategoryLabel = (category) => {
    const labels = {
      [FeatureCategories.PRODUCTIVITY]: 'Productivity',
      [FeatureCategories.SESSION_CONTROL]: 'Session Control',
      [FeatureCategories.APPEARANCE]: 'Appearance',
      [FeatureCategories.TOOLS]: 'Tools',
      [FeatureCategories.INTEGRATIONS]: 'Integrations',
    };

    return labels[category] || category;
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      [FeatureCategories.PRODUCTIVITY]: '🚀',
      [FeatureCategories.SESSION_CONTROL]: '🎮',
      [FeatureCategories.APPEARANCE]: '🎨',
      [FeatureCategories.TOOLS]: '🛠️',
      [FeatureCategories.INTEGRATIONS]: '🔌',
    };

    return icons[category] || '📁';
  };

  return (
    <div
      ref={dropdownRef}
      className="command-center-dropdown"
      style={{
        position: 'fixed',
        left: `${dropdownX}px`,
        top: `${dropdownY}px`,
        width: `${dropdownWidth}px`,
        maxHeight: `${dropdownHeight}px`,
        backgroundColor: 'rgba(20, 20, 30, 0.98)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        zIndex: 9999,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'dropdown-appear 0.2s ease-out',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px',
        }}>
          <div style={{
            fontSize: '24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            ⚙️
          </div>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: '#fff',
            }}>
              Command Center
            </h3>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
            }}>
              {availableFeatures.length} features available
            </p>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
      }}>
        {Object.entries(featuresByCategory).map(([category, features]) => (
          <div key={category} style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              padding: '0 8px',
            }}>
              <span style={{ fontSize: '16px' }}>
                {getCategoryIcon(category)}
              </span>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {getCategoryLabel(category)}
              </span>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              {features.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureClick(feature)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                    e.target.style.transform = 'translateX(0)';
                  }}
                  title={feature.description}
                >
                  <span style={{ fontSize: '18px', width: '24px' }}>
                    {feature.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>
                      {feature.label}
                    </div>
                    {feature.description && (
                      <div style={{
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginTop: '2px',
                      }}>
                        {feature.description}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.3)',
                  }}>
                    {feature.type === 'instant' ? '↗' :
                      feature.type === 'widget' ? '⬜' :
                        feature.type === 'modal' ? '📁' : '🔘'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {Object.keys(featuresByCategory).length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'rgba(255, 255, 255, 0.4)',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>😴</div>
            <div style={{ fontSize: '14px' }}>
              No features available
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              Start a review session to unlock features
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.4)',
        }}>
          <span>EVERMIND Command Center</span>
          <span>v1.0</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Simplified dropdown for mobile/compact view
 */
export function CommandCenterDropdownCompact() {
  const { isOpen, availableFeatures, executeFeature, close } = useCommandCenter();

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90%',
      maxWidth: '300px',
      maxHeight: '80vh',
      backgroundColor: 'rgba(20, 20, 30, 0.98)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
      zIndex: 9999,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        textAlign: 'center',
      }}>
        <h3 style={{ margin: 0, color: '#fff' }}>Quick Actions</h3>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
      }}>
        {availableFeatures.map((feature) => (
          <button
            key={feature.id}
            onClick={() => executeFeature(feature.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 8px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '24px', marginBottom: '8px' }}>
              {feature.icon}
            </span>
            <span>{feature.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={close}
        style={{
          padding: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: 'none',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        Close
      </button>
    </div>
  );
}

export default CommandCenterDropdown;