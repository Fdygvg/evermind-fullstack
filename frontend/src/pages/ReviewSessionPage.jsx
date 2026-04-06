import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { sectionService } from "../services/sections";
import { sessionService } from "../services/sessions";
import { useSession } from '../hooks/useSession'
import { FaLayerGroup, FaBolt, FaTrash, FaTiktok, FaArchive, FaCheckSquare, FaRegSquare } from "react-icons/fa";

const ReviewSessionPage = () => {
  const [sections, setSections] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedMode, setSelectedMode] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showArchived, setShowArchived] = useState(false);
  const [archivedSections, setArchivedSections] = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);

  const { setActiveSession } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const hexToRgba = (hex, opacity) => {
    try {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } catch {
      return `rgba(100, 100, 200, ${opacity})`;
    }
  };

  useEffect(() => {
    loadSections();

    const checkResumeSession = async () => {
      if (location.state?.resumeSession && location.state?.sessionData) {
        const sessionData = location.state.sessionData;
        console.log('[RESUME] Resuming session:', sessionData);
        setActiveSession(sessionData);
        navigate('/session/start', {
          state: { resumeSession: true, sessionData },
          replace: true
        });
      }
    };
    checkResumeSession();
  }, [location.state, navigate, setActiveSession]);

  useEffect(() => {
    if (showArchived) loadArchivedSections();
  }, [showArchived]);

  const loadSections = async () => {
    try {
      const response = await sectionService.getSections();
      setSections(response.data.data.sections || []);
    } catch (error) {
      console.error("Failed to load sections:", error);
    }
  };

  const loadArchivedSections = async () => {
    try {
      setLoadingArchived(true);
      const response = await sectionService.getArchivedSections();
      setArchivedSections(response.data.data.sections || []);
    } catch (error) {
      console.error("Failed to load archived sections:", error);
    } finally {
      setLoadingArchived(false);
    }
  };

  const allSelectableSections = showArchived
    ? [...sections, ...archivedSections]
    : sections;

  const toggleSection = (sectionId) => {
    setSelectedSections(prev =>
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleSelectAll = () => setSelectedSections(allSelectableSections.map(s => s._id));
  const handleClearAll = () => setSelectedSections([]);

  const startSession = async () => {
    if (selectedSections.length === 0) { alert("Please select at least one section"); return; }

    // For normal/flashcard modes: DON'T call startSession() on the backend.
    // Instead, navigate directly and let SmartReviewWrapper call loadTodaysQuestions()
    // which uses the proper three-track scheduling system (NEW → PENDING → REVIEW).
    // Calling startSession() would fetch ALL questions and bypass scheduling entirely.
    if (selectedMode === 'normal' || selectedMode === 'flashcard') {
      navigate("/session/start", {
        state: {
          sectionIds: selectedSections,
          cardMode: selectedMode,
          useSmartReview: true
          // No sessionData — SmartReviewWrapper will call loadTodaysQuestions()
        }
      });
      return;
    }

    // For elimination/tiktok modes: still create a backend session
    setLoading(true);
    try {
      const response = await sessionService.startSession({
        sectionIds: selectedSections,
        cardMode: selectedMode,
        useSmartReview: true
      });

      if (response.data.success) {
        const sessionData = response.data.data.session;
        if (selectedMode === "elimination") {
          navigate("/elimination", { state: { sectionIds: selectedSections, useSmartReview: true, mode: 'elimination', sessionData } });
        } else if (selectedMode === "tiktok") {
          navigate("/tiktok-review", { state: { sectionIds: selectedSections, useSmartReview: true, mode: 'tiktok-review', sessionData } });
        }
      }
    } catch (error) {
      console.error("Failed to start session:", error);
      alert("Failed to start session: " + (error.response?.data?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const modes = [
    { id: 'normal',      label: 'Normal Mode',      icon: <FaLayerGroup />, description: 'Standard question and answer format with swipe gestures.', color: '#3b82f6' },
    { id: 'flashcard',   label: 'Flashcard Mode',    icon: <FaBolt />,       description: 'Quick-fire interactive flip cards for rapid review.',      color: '#f59e0b' },
    { id: 'elimination', label: 'Elimination Mode',  icon: <FaTrash />,      description: 'Clear the board! Correct answers remove cards.',           color: '#ef4444' },
    { id: 'tiktok',      label: 'TikTok Mode',       icon: <FaTiktok />,     description: 'Short-form video learning feed. (Under construction)',      color: '#555555' },
  ];

  const allSelected = allSelectableSections.length > 0 &&
    selectedSections.length === allSelectableSections.length;

  return (
    <div className="review-session-page">
      <h1>Start Revision Session</h1>

      <div className="mode-selection">
        <h2>Select Review Mode</h2>
        <div className="modes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          {modes.map(mode => (
            <div
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`mode-card-new ${selectedMode === mode.id ? 'selected' : ''}`}
              style={{
                cursor: 'pointer', padding: '24px', borderRadius: '16px',
                background: selectedMode === mode.id ? `linear-gradient(135deg, ${mode.color}20, ${mode.color}40)` : 'var(--color-surface)',
                border: `2px solid ${selectedMode === mode.id ? mode.color : 'transparent'}`,
                boxShadow: selectedMode === mode.id ? `0 8px 24px ${mode.color}40` : 'var(--shadow-sm)',
                transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px'
              }}
            >
              <div style={{ fontSize: '32px', color: mode.color, marginBottom: '8px' }}>{mode.icon}</div>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{mode.label}</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{mode.description}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedMode && (
        <div className="session-config-container" style={{ animation: 'fadeIn 0.5s ease' }}>
          <div className="section-selection">
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ margin: 0 }}>Select Sections to Study</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  {selectedSections.length} of {allSelectableSections.length} selected
                </span>
                {/* Select All / Clear All */}
                <button
                  onClick={allSelected ? handleClearAll : handleSelectAll}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: '8px',
                    border: allSelected ? 'none' : '1px solid var(--color-text-secondary, #6B728040)',
                    background: allSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: allSelected ? '#fff' : 'var(--color-text)',
                    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s ease'
                  }}
                >
                  {allSelected ? <FaCheckSquare /> : <FaRegSquare />}
                  {allSelected ? 'Clear All' : 'Select All'}
                </button>
                {/* Include Archived toggle */}
                <button
                  onClick={() => setShowArchived(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 14px', borderRadius: '8px',
                    border: showArchived ? '1px solid #F59E0B80' : '1px solid transparent',
                    background: showArchived ? '#F59E0B15' : 'var(--color-surface)',
                    color: showArchived ? '#F59E0B' : 'var(--color-text-secondary)',
                    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s ease'
                  }}
                >
                  <FaArchive />
                  {showArchived ? 'Hide Archived' : 'Include Archived'}
                </button>
              </div>
            </div>

            {/* Active sections grid */}
            <div className="sections-grid">
              {sections.map(section => (
                <div
                  key={section._id}
                  className={`section-card ${selectedSections.includes(section._id) ? 'selected' : ''}`}
                  onClick={() => toggleSection(section._id)}
                  style={{
                    borderLeftColor: section.color,
                    background: `linear-gradient(135deg, ${hexToRgba(section.color, 0.2)}, ${hexToRgba(section.color, 0.1)})`,
                    cursor: 'pointer'
                  }}
                >
                  <h3>{section.name}</h3>
                  <p>{section.description}</p>
                  {section.questionCount !== undefined && (
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{section.questionCount} questions</span>
                  )}
                </div>
              ))}
            </div>

            {/* Archived sections (conditional) */}
            {showArchived && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <FaArchive style={{ color: '#F59E0B' }} />
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F59E0B' }}>Archived Sections</span>
                </div>
                {loadingArchived ? (
                  <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.6 }}>Loading...</div>
                ) : archivedSections.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.5 }}>No archived sections</div>
                ) : (
                  <div className="sections-grid">
                    {archivedSections.map(section => (
                      <div
                        key={section._id}
                        className={`section-card ${selectedSections.includes(section._id) ? 'selected' : ''}`}
                        onClick={() => toggleSection(section._id)}
                        style={{
                          borderLeftColor: section.color,
                          background: `linear-gradient(135deg, ${hexToRgba(section.color || '#667eea', 0.12)}, ${hexToRgba(section.color || '#667eea', 0.06)})`,
                          cursor: 'pointer', border: `1px dashed ${section.color || '#667eea'}60`, opacity: 0.85
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ margin: 0 }}>{section.name}</h3>
                          <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: '#F59E0B20', color: '#F59E0B', borderRadius: '9999px', fontWeight: 600, border: '1px solid #F59E0B60' }}>Archived</span>
                        </div>
                        <p>{section.description}</p>
                        {section.questionCount !== undefined && (
                          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{section.questionCount} questions</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Start bar */}
          <div style={{ marginTop: '40px', padding: '20px', background: 'var(--color-surface)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-md)', borderTop: '4px solid var(--color-primary)' }}>
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
              style={{ padding: '12px 32px', fontSize: '1.1rem', margin: 0, width: 'auto' }}
            >
              {loading ? "Starting Session..." : "🚀 Start Session"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSessionPage;
