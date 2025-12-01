import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import './css/ThemeSettings.css';



const ThemeSettings = () => {
  const { currentTheme, setTheme, themes } = useTheme();

  return (
    <div className="theme-settings">
      <h2 className="theme-settings-title">Choose Theme</h2>
      <p className="theme-settings-description">
        Select a color theme to personalize your experience
      </p>
      <div className="themes-grid">
        {Object.entries(themes).map(([key, theme]) => (
          <button
            key={key}
            className={`theme-card ${currentTheme === key ? 'active' : ''}`}
            onClick={() => setTheme(key)}
            aria-label={`Select ${theme.name} theme`}
          >
            <div className="theme-preview">
              <div
                className="theme-preview-gradient"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.gradientStart}, ${theme.colors.gradientEnd})`
                }}
              />
              <div className="theme-preview-colors">
                <div
                  className="theme-color-swatch"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="theme-color-swatch"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
                <div
                  className="theme-color-swatch"
                  style={{ backgroundColor: theme.colors.accent }}
                />
              </div>
            </div>
            <div className="theme-info">
              <h3 className="theme-name">{theme.name}</h3>
              <p className="theme-description">{theme.description}</p>
            </div>
            {currentTheme === key && (
              <div className="theme-checkmark">✓</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSettings;

