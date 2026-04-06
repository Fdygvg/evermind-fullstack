import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sectionService } from "../services/sections";
import { sessionService } from "../services/sessions";
import SectionList from "../components/Common/SectionList";
import "../components/css/sectionList.css";
import { FaArchive, FaUndo, FaRedo, FaPlay } from "react-icons/fa";

const SectionListPage = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filteredSections, setFilteredSections] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("name");

  // Archive state
  const [showArchived, setShowArchived] = useState(false);
  const [archivedSections, setArchivedSections] = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [resettingProgress, setResettingProgress] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [lastPausedSession, setLastPausedSession] = useState(null); // { sessionId, sectionId }
  const [resuming, setResuming] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSections();
    fetchLastPausedSession();
  }, []);

  useEffect(() => {
    if (showArchived) {
      fetchArchivedSections();
    }
  }, [showArchived]);

  useEffect(() => {
    let result = [...sections];

    if (searchQuery.trim()) {
      result = result.filter(section =>
        section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    result.sort((a, b) => {
      switch (sortOption) {
        case "name": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "questions-asc": return (a.questionCount || 0) - (b.questionCount || 0);
        case "questions-desc": return (b.questionCount || 0) - (a.questionCount || 0);
        case "date-recent": return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "date-old": return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        default: return 0;
      }
    });

    setFilteredSections(result);
  }, [sections, searchQuery, sortOption]);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await sectionService.getSections();
      setSections(response.data.data.sections || []);
      setFilteredSections(response.data.data.sections || []);
    } catch (error) {
      console.error("Failed to fetch sections:", error);
      setError("Failed to load sections. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Find the most recently paused simplified session for the Resume button
  const fetchLastPausedSession = async () => {
    try {
      const response = await sessionService.getSimplifiedSessions();
      if (response.data.success) {
        const sessionMap = response.data.data.sessionMap || {};
        
        // Find all paused sessions
        const pausedEntries = Object.entries(sessionMap).filter(([, info]) => info.status === 'paused');
        
        if (pausedEntries.length > 0) {
          // Sort by lastUpdated descending to find the most recent
          pausedEntries.sort(([, a], [, b]) => {
            const timeA = new Date(a.lastUpdated || 0).getTime();
            const timeB = new Date(b.lastUpdated || 0).getTime();
            return timeB - timeA;
          });
          
          const mostRecentEntry = pausedEntries[0];
          setLastPausedSession({ sectionId: mostRecentEntry[0], ...mostRecentEntry[1] });
        } else {
          setLastPausedSession(null);
        }
      }
    } catch (error) {
      console.error('Failed to check for paused sessions:', error);
    }
  };

  const fetchArchivedSections = async () => {
    try {
      setLoadingArchived(true);
      const response = await sectionService.getArchivedSections();
      setArchivedSections(response.data.data.sections || []);
    } catch (error) {
      console.error("Failed to fetch archived sections:", error);
    } finally {
      setLoadingArchived(false);
    }
  };

  const handleDeleteSection = async (sectionId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure? This will delete all questions in this section too!")) return;
    try {
      await sectionService.deleteSection(sectionId);
      setSections(prev => prev.filter(s => s._id !== sectionId));
      setArchivedSections(prev => prev.filter(s => s._id !== sectionId));
    } catch (error) {
      console.error("Failed to delete section:", error);
      setError("Failed to delete section.");
    }
  };

  const handleSectionArchived = (sectionId) => {
    setSections(prev => prev.filter(s => s._id !== sectionId));
    if (showArchived) fetchArchivedSections();
  };

  const handleRestoreSection = async (sectionId) => {
    setRestoringId(sectionId);
    try {
      const response = await sectionService.restoreSection(sectionId);
      const restored = response.data.data.section;
      setArchivedSections(prev => prev.filter(s => s._id !== sectionId));
      setSections(prev => [...prev, restored]);
    } catch (error) {
      console.error("Failed to restore section:", error);
      setError("Failed to restore section.");
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteArchived = async (sectionId, e) => {
    e.stopPropagation();
    if (!window.confirm("Permanently delete this archived section and all its questions?")) return;
    try {
      await sectionService.deleteSection(sectionId);
      setArchivedSections(prev => prev.filter(s => s._id !== sectionId));
    } catch (error) {
      console.error("Failed to delete archived section:", error);
      setError("Failed to delete section.");
    }
  };

  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSelectedIds, setResetSelectedIds] = useState([]);

  const toggleResetSection = (id) => {
    setResetSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleResetAll = () => {
    if (resetSelectedIds.length === sections.length) {
      setResetSelectedIds([]);
    } else {
      setResetSelectedIds(sections.map(s => s._id));
    }
  };

  const handleResetProgress = async () => {
    if (resetSelectedIds.length === 0) return;

    const isAll = resetSelectedIds.length === sections.length;
    const label = isAll ? 'ALL sections' : `${resetSelectedIds.length} selected section(s)`;

    const confirmed = window.confirm(
      `⚠️ Reset progress for ${label}?\n\nThis will:\n• Reset every question back to Day 1\n• Wipe review history & stats\n• Delete paused sessions\n\nYour questions and sections will NOT be deleted.`
    );
    if (!confirmed) return;

    setResettingProgress(true);
    try {
      // Pass undefined for "all" so the backend resets everything; pass IDs for scoped
      await sectionService.resetAllProgress(isAll ? undefined : resetSelectedIds);
      localStorage.removeItem('smartReviewSession');
      localStorage.removeItem('sessionState');
      setResetSuccess(true);
      setShowResetModal(false);
      setResetSelectedIds([]);
      setTimeout(() => setResetSuccess(false), 3000);
      await fetchSections();
    } catch (error) {
      console.error('Failed to reset progress:', error);
      setError('Failed to reset progress. Please try again.');
    } finally {
      setResettingProgress(false);
    }
  };

  const sortOptions = [
    { value: "name", label: "Name (A-Z)" },
    { value: "name-desc", label: "Name (Z-A)" },
    { value: "questions-desc", label: "Most Questions" },
    { value: "questions-asc", label: "Fewest Questions" },
    { value: "date-recent", label: "Recently Created" },
    { value: "date-old", label: "Oldest First" }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading sections...</p>
      </div>
    );
  }

  const bookmarkedSection = {
    _id: 'bookmarked',
    name: 'Bookmarked',
    description: 'Questions you have saved for later',
    color: '#F59E0B',
    isVirtual: true
  };

  let displaySections = [...filteredSections];
  const showBookmark =
    sections.length > 0 &&
    (!searchQuery || "bookmarked questions".includes(searchQuery.toLowerCase()));

  if (showBookmark) {
    displaySections.unshift(bookmarkedSection);
  }

  return (
    <div className="section-list-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <h1>📚 My Study Sections</h1>
          <p className="subtitle">
            {sections.length} section{sections.length !== 1 ? 's' : ''} •{' '}
            {sections.reduce((total, s) => total + (s.questionCount || 0), 0)} total questions
          </p>
        </div>

        <div className="header-actions">
          <Link to="/sections/add" className="btn btn-primary">
            <span className="btn-icon">+</span> New Section
          </Link>
          <Link to="/questions/bulk-import" className="btn btn-secondary">
            <span className="btn-icon">📥</span> Bulk Import
          </Link>
          <Link to="/questions/export" className="btn btn-secondary">
            <span className="btn-icon">📤</span> Export
          </Link>
          <button
            className={`btn ${showArchived ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowArchived(v => !v)}
            title="Toggle archived sections"
          >
            <FaArchive style={{ marginRight: '0.4rem' }} />
            {showArchived ? 'Hide Archived' : 'Archived'}
          </button>
          <button
            className="btn"
            onClick={async () => {
              if (!lastPausedSession) return;
              setResuming(true);
              try {
                const response = await sessionService.resumeSimplifiedSession(lastPausedSession.sessionId);
                if (response.data.success) {
                  const sessionData = response.data.data.session;
                  navigate('/session/start', {
                    state: {
                      sectionIds: [lastPausedSession.sectionId],
                      cardMode: 'normal',
                      useSmartReview: false,
                      isSimplified: true,
                      resumeSession: true,
                      sessionData
                    }
                  });
                }
              } catch (error) {
                console.error('Failed to resume session:', error);
                alert('Failed to resume session.');
              } finally {
                setResuming(false);
              }
            }}
            disabled={!lastPausedSession || resuming}
            title={lastPausedSession ? `Resume paused session (${lastPausedSession.remaining}/${lastPausedSession.total} remaining)` : 'No paused session'}
            style={{
              background: lastPausedSession ? 'var(--color-primary, #8B5CF6)' : '#555',
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.3s ease',
              fontWeight: 600,
              opacity: lastPausedSession ? 1 : 0.5,
              cursor: lastPausedSession ? 'pointer' : 'not-allowed'
            }}
          >
            <FaPlay style={{ fontSize: '0.85rem' }} />
            {resuming ? 'Resuming...' : 'Resume'}
          </button>
          <button
            className="btn"
            onClick={() => { setResetSelectedIds([]); setShowResetModal(true); }}
            disabled={resettingProgress}
            title="Reset review progress for selected sections"
            style={{
              background: resettingProgress ? '#666' : resetSuccess ? '#10B981' : '#ef4444',
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              opacity: resettingProgress ? 0.7 : 1,
              transition: 'all 0.3s ease'
            }}
          >
            <FaRedo style={{ fontSize: '0.85rem' }} />
            {resettingProgress ? 'Resetting...' : resetSuccess ? '✓ Reset Done!' : 'Reset Progress'}
          </button>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="error-alert">
          <span className="error-icon">⚠️</span>
          {error}
          <button className="error-close" onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="controls-panel">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search sections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery("")}>×</button>
          )}
        </div>

        <div className="sort-control">
          <label className="sort-label">Sort by:</label>
          <div className="select-wrapper">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="sort-select"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Sections Grid */}
      <div className="list-container">
        {displaySections.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? (
              <>
                <div className="empty-icon">🔍</div>
                <h3>No sections found</h3>
                <p>No sections match "{searchQuery}"</p>
                <button className="btn btn-outline" onClick={() => setSearchQuery("")}>
                  Clear search
                </button>
              </>
            ) : (
              <>
                <div className="empty-icon">📚</div>
                <h3>No sections yet</h3>
                <p>Create your first section to organize your questions</p>
                <Link to="/sections/add" className="btn btn-primary">
                  Create First Section
                </Link>
              </>
            )}
          </div>
        ) : (
          <SectionList
            sections={displaySections}
            onDeleteSection={handleDeleteSection}
            searchQuery={searchQuery}
            onSectionArchived={handleSectionArchived}
          />
        )}
      </div>

      {/* Archived Sections Panel */}
      {showArchived && (
        <div className="archived-sections-panel" style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'var(--bg-card)',
          borderRadius: '12px',
          border: '2px dashed var(--color-warning, #F59E0B)',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <FaArchive style={{ color: 'var(--color-warning, #F59E0B)', fontSize: '1.25rem' }} />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Archived Sections</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
              {archivedSections.length} archived
            </span>
          </div>

          {loadingArchived ? (
            <div className="loading-container" style={{ padding: '1rem 0' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : archivedSections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
              <p>No archived sections</p>
            </div>
          ) : (
            <div className="sections-grid">
              {archivedSections.map(section => (
                <div
                  key={section._id}
                  className="section-card"
                  style={{ opacity: 0.78, cursor: 'default' }}
                >
                  <div className="card-accent" style={{ backgroundColor: section.color || '#667eea' }}></div>
                  <div className="card-content">
                    <div className="card-header">
                      <h3 className="section-title">{section.name}</h3>
                      <span style={{
                        fontSize: '0.7rem', padding: '2px 8px',
                        background: '#F59E0B20', color: '#F59E0B',
                        borderRadius: '9999px', fontWeight: 600,
                        border: '1px solid #F59E0B60'
                      }}>
                        Archived
                      </span>
                    </div>
                    <p className="card-description">{section.description || 'No description'}</p>
                    <div className="card-stats">
                      <div className="stat" title="Questions">
                        <span>❓</span>
                        <span>{section.questionCount || 0}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button
                        className="action-btn play start"
                        onClick={() => handleRestoreSection(section._id)}
                        disabled={restoringId === section._id}
                        title="Restore section"
                      >
                        {restoringId === section._id ? '...' : <><FaUndo style={{ marginRight: 4 }} /> Restore</>}
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={(e) => handleDeleteArchived(section._id, e)}
                        title="Permanently delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats Footer */}
      {sections.length > 0 && (
        <div className="stats-footer">
          <div className="stat-item">
            <span className="stat-value">{sections.length}</span>
            <span className="stat-label">Sections</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {sections.reduce((total, s) => total + (s.questionCount || 0), 0)}
            </span>
            <span className="stat-label">Total Questions</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {Math.round(sections.reduce((total, s) => total + (s.questionCount || 0), 0) / sections.length) || 0}
            </span>
            <span className="stat-label">Avg per Section</span>
          </div>
        </div>
      )}
      {/* Reset Progress Modal */}
      {showResetModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={() => setShowResetModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #1a1a2e)',
              color: 'var(--text-primary, var(--color-text, #333))',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '440px',
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaRedo style={{ color: 'var(--color-primary, #8B5CF6)' }} /> Reset Progress
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-secondary, #666)' }}>
              Select sections to reset back to Day 1. Questions are preserved.
            </p>

            {/* Select All toggle */}
            <label
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', marginBottom: '8px',
                background: 'var(--color-surface, rgba(255,255,255,0.05))',
                borderRadius: '10px', cursor: 'pointer', fontWeight: 600,
                fontSize: '0.9rem',
                border: resetSelectedIds.length === sections.length
                  ? '2px solid var(--color-primary, #8B5CF6)'
                  : '2px solid transparent',
                transition: 'border 0.2s'
              }}
            >
              <input
                type="checkbox"
                checked={resetSelectedIds.length === sections.length && sections.length > 0}
                onChange={toggleResetAll}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary, #8B5CF6)', cursor: 'pointer' }}
              />
              Select All ({sections.length})
            </label>

            {/* Section list */}
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {sections.map(section => (
                <label
                  key={section._id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px',
                    background: resetSelectedIds.includes(section._id)
                      ? 'rgba(239,68,68,0.1)' : 'var(--color-surface, rgba(255,255,255,0.03))',
                    borderRadius: '10px', cursor: 'pointer',
                    border: resetSelectedIds.includes(section._id)
                      ? '2px solid #ef4444' : '2px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={resetSelectedIds.includes(section._id)}
                    onChange={() => toggleResetSection(section._id)}
                    style={{ width: '18px', height: '18px', accentColor: '#ef4444', cursor: 'pointer' }}
                  />
                  <span
                    style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: section.color || '#667eea', flexShrink: 0
                    }}
                  />
                  <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-primary, inherit)' }}>{section.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #666)' }}>
                    {section.questionCount || 0} Q
                  </span>
                </label>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowResetModal(false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  border: '1px solid var(--color-border, rgba(255,255,255,0.15))',
                  background: 'transparent', color: 'var(--color-text, #fff)',
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleResetProgress}
                disabled={resetSelectedIds.length === 0 || resettingProgress}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  border: 'none',
                  background: resetSelectedIds.length === 0 ? '#555' : '#ef4444',
                  color: '#fff', fontWeight: 600, fontSize: '0.9rem',
                  cursor: resetSelectedIds.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: resettingProgress ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {resettingProgress ? 'Resetting...' : `Reset ${resetSelectedIds.length || ''} Section${resetSelectedIds.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionListPage;