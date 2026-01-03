import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { sectionService } from "../services/sections";
import { useSession } from '../hooks/useSession'
import { FaLayerGroup, FaBolt, FaTrash, FaTiktok } from "react-icons/fa";

const ReviewSessionPage = () => {
  const [sections, setSections] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedMode, setSelectedMode] = useState(null); // 'normal', 'flashcard', 'elimination'
  const [loading, setLoading] = useState(false);

  const { setActiveSession } = useSession()
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to convert hex color to rgba with opacity
  const hexToRgba = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  useEffect(() => {
    loadSections();

    // Check if resuming a session from dashboard
    const checkResumeSession = async () => {
      if (location.state?.resumeSession && location.state?.sessionData) {
        const sessionData = location.state.sessionData;
        console.log('[RESUME] Resuming session:', sessionData);

        // Set the active session in context
        setActiveSession(sessionData);

        // Navigate directly to active session page
        navigate('/session/start', {
          state: {
            resumeSession: true,
            sessionData: sessionData
          },
          replace: true
        });
      }
    };

    checkResumeSession();
  }, [location.state, navigate, setActiveSession]);

  const loadSections = async () => {
    try {
      const response = await sectionService.getSections();
      setSections(response.data.data.sections);
    } catch (error) {
      console.error("Failed to load sections:", error);
    }
  };

  const toggleSection = (sectionId) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
  };

  const startSession = async () => {
    if (selectedSections.length === 0) {
      alert("Please select at least one section");
      return;
    }

    setLoading(true);
    try {
      // Configuration based on selected mode
      if (selectedMode === "elimination") {
        navigate("/elimination", {
          state: {
            sectionIds: selectedSections,
            useSmartReview: true
          }
        });
      } else if (selectedMode === "tiktok") {
        navigate("/tiktok-review", {
          state: {
            sectionIds: selectedSections,
            useSmartReview: true
          }
        });
      } else {
        // Normal or Flashcard
        navigate("/session/start", {
          state: {
            sectionIds: selectedSections,
            cardMode: selectedMode, // 'normal' or 'flashcard'
            useSmartReview: true
          }
        });
      }
    } catch (error) {
      console.error("Failed to start session:", error);
      alert(
        "Failed to start session: " +
        (error.response?.data?.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const modes = [
    {
      id: 'normal',
      label: 'Normal Mode',
      icon: <FaLayerGroup />,
      description: 'Standard question and answer format with swipe gestures.',
      color: '#3b82f6'
    },
    {
      id: 'flashcard',
      label: 'Flashcard Mode',
      icon: <FaBolt />,
      description: 'Quick-fire interactive flip cards for rapid review.',
      color: '#f59e0b'
    },
    {
      id: 'elimination',
      label: 'Elimination Mode',
      icon: <FaTrash />,
      description: 'Clear the board! Correct answers remove cards.',
      color: '#ef4444'
    },
    {
      id: 'tiktok',
      label: 'TikTok Mode',
      icon: <FaTiktok />,
      description: 'Short-form video learning feed.',
      color: '#000000' // or brand color
    }
  ];

  return (
    <div className="review-session-page">
      <h1>Start Revision Session</h1>

      <div className="mode-selection">
        <h2>Select Review Mode</h2>
        <div className="modes-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {modes.map((mode) => (
            <div
              key={mode.id}
              onClick={() => handleModeSelect(mode.id)}
              className={`mode-card-new ${selectedMode === mode.id ? 'selected' : ''}`}
              style={{
                cursor: 'pointer',
                padding: '24px',
                borderRadius: '16px',
                background: selectedMode === mode.id
                  ? `linear-gradient(135deg, ${mode.color}20, ${mode.color}40)`
                  : 'var(--color-surface)',
                border: `2px solid ${selectedMode === mode.id ? mode.color : 'transparent'}`,
                boxShadow: selectedMode === mode.id
                  ? `0 8px 24px ${mode.color}40`
                  : 'var(--shadow-sm)',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '12px'
              }}
            >
              <div style={{
                fontSize: '32px',
                color: mode.id === 'tiktok' ? 'var(--color-text)' : mode.color,
                marginBottom: '8px'
              }}>
                {mode.icon}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{mode.label}</h3>
              <p style={{
                margin: 0,
                fontSize: '0.9rem',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5
              }}>
                {mode.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {selectedMode && (
        <div className="session-config-container" style={{ animation: 'fadeIn 0.5s ease' }}>
          <div className="section-selection">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Select Sections to Study</h2>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                {selectedSections.length} selected
              </span>
            </div>

            <div className="sections-grid">
              {sections.map((section) => (
                <div
                  key={section._id}
                  className={`section-card ${selectedSections.includes(section._id) ? "selected" : ""}`}
                  onClick={() => toggleSection(section._id)}
                  style={{
                    borderLeftColor: section.color,
                    background: `linear-gradient(135deg, 
                      ${hexToRgba(section.color, 0.2)}, 
                      ${hexToRgba(section.color, 0.1)})`
                  }}
                >
                  <h3>{section.name}</h3>
                  <p>{section.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: '40px',
            padding: '20px',
            background: 'var(--color-surface)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--shadow-md)',
            borderTop: '4px solid var(--color-primary)'
          }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0' }}>Ready to Start?</h3>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                Mode: <strong>{modes.find(m => m.id === selectedMode)?.label}</strong> • Sections: <strong>{selectedSections.length}</strong>
              </p>
            </div>

            <button
              className="start-button"
              onClick={startSession}
              disabled={loading || selectedSections.length === 0}
              style={{
                padding: '12px 32px',
                fontSize: '1.1rem',
                margin: 0,
                width: 'auto'
              }}
            >
              {loading
                ? "Starting Session..."
                : "🚀 Start Session"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSessionPage;
