import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaQuestionCircle,
  FaCheckCircle,
  FaCalendarAlt,
  FaSearch,
  FaBook,
  FaInfoCircle,
  FaPlay,
  FaPause,
  FaStop
} from "react-icons/fa";
import { sessionService } from "../../services/sessions";
import "../../components/css/sectionList.css";

const SectionList = ({ sections, onDeleteSection, searchQuery }) => {
  const navigate = useNavigate();
  const [simplifiedSessions, setSimplifiedSessions] = useState({});
  const [loadingAction, setLoadingAction] = useState(null); // track which section is loading

  // Fetch active simplified sessions on mount
  useEffect(() => {
    fetchSimplifiedSessions();
  }, []);

  const fetchSimplifiedSessions = async () => {
    try {
      const response = await sessionService.getSimplifiedSessions();
      if (response.data.success) {
        setSimplifiedSessions(response.data.data.sessionMap || {});
      }
    } catch (error) {
      console.error("Failed to fetch simplified sessions:", error);
    }
  };

  const handleSectionClick = (sectionId) => {
    navigate(`/sections/${sectionId}/questions`);
  };

  const handleEditSection = (section, e) => {
    e.stopPropagation();
    navigate(`/sections/edit/${section._id}`, { state: { section } });
  };

  const handleDeleteClick = (sectionId, e) => {
    e.stopPropagation();
    onDeleteSection(sectionId, e);
  };

  const handleInfoClick = (sectionId, e) => {
    e.stopPropagation();
    navigate(`/sections/${sectionId}/stats`);
  };

  // Quick Play: Start a new simplified session
  const handlePlayClick = async (sectionId, e) => {
    e.stopPropagation();
    setLoadingAction(sectionId);
    try {
      const response = await sessionService.startSession({
        sectionIds: [sectionId],
        cardMode: 'normal',
        isSimplified: true
      });

      if (response.data.success) {
        const sessionData = response.data.data.session;
        navigate("/session/start", {
          state: {
            sectionIds: [sectionId],
            cardMode: 'normal',
            useSmartReview: false,
            isSimplified: true,
            sessionData
          }
        });
      }
    } catch (error) {
      console.error("Failed to start simplified session:", error);
      alert("Failed to start session: " + (error.response?.data?.message || "Unknown error"));
    } finally {
      setLoadingAction(null);
    }
  };

  // Quick Play: Resume a paused simplified session
  const handleResumeClick = async (sectionId, e) => {
    e.stopPropagation();
    const sessionInfo = simplifiedSessions[sectionId];
    if (!sessionInfo) return;

    setLoadingAction(sectionId);
    try {
      const response = await sessionService.resumeSimplifiedSession(sessionInfo.sessionId);

      if (response.data.success) {
        const sessionData = response.data.data.session;
        navigate("/session/start", {
          state: {
            sectionIds: [sectionId],
            cardMode: 'normal',
            useSmartReview: false,
            isSimplified: true,
            resumeSession: true,
            sessionData
          }
        });
      }
    } catch (error) {
      console.error("Failed to resume simplified session:", error);
      alert("Failed to resume session: " + (error.response?.data?.message || "Unknown error"));
    } finally {
      setLoadingAction(null);
    }
  };

  // Quick Play: End a simplified session
  const handleEndClick = async (sectionId, e) => {
    e.stopPropagation();
    const sessionInfo = simplifiedSessions[sectionId];
    if (!sessionInfo) return;

    if (!window.confirm("End this review session?")) return;

    setLoadingAction(sectionId);
    try {
      await sessionService.endSimplifiedSession(sessionInfo.sessionId);
      // Remove from local state
      setSimplifiedSessions(prev => {
        const updated = { ...prev };
        delete updated[sectionId];
        return updated;
      });
    } catch (error) {
      console.error("Failed to end simplified session:", error);
    } finally {
      setLoadingAction(null);
    }
  };

  const calculateProgress = (section) => {
    const totalQuestions = section.questionCount || 0;
    const answeredQuestions = section.answeredCount || 0;
    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  };

  if (!sections || sections.length === 0) {
    return (
      <div className="empty-sections">
        {searchQuery ? (
          <>
            <div className="empty-icon"><FaSearch /></div>
            <h3>No sections found</h3>
            <p>No sections match "{searchQuery}"</p>
          </>
        ) : (
          <>
            <div className="empty-icon"><FaBook /></div>
            <h3>No sections yet</h3>
            <p>Create your first section to organize your questions</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="sections-grid">
      {sections.map((section) => {
        const isVirtual = section.isVirtual || section._id === 'bookmarked';
        const progress = !isVirtual ? calculateProgress(section) : 0;
        const activeSession = simplifiedSessions[section._id];
        const isLoading = loadingAction === section._id;

        return (
          <div
            key={section._id}
            className="section-card"
            onClick={() => handleSectionClick(section._id)}
          >
            <div className="card-accent" style={{ backgroundColor: section.color || "#667eea" }}></div>

            <div className="card-content">
              <div className="card-header">
                <h3 className="section-title">{section.name}</h3>
                {!isVirtual && (
                  <button
                    className="info-btn"
                    onClick={(e) => handleInfoClick(section._id, e)}
                    title="Section details"
                  >
                    <FaInfoCircle />
                  </button>
                )}
              </div>

              <div className="card-tags">
                {section.tags && section.tags.length > 0 && section.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="tag-pill">{tag}</span>
                ))}
                {isVirtual && <span className="tag-pill">Collection</span>}
              </div>

              <p className="card-description">
                {section.description || "No description provided"}
              </p>

              {!isVirtual && (
                <div className="progress-section">
                  <div className="progress-header">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: section.color || "#667eea"
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {isVirtual ? (
                <div className="card-stats" style={{ height: '2rem', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <FaBook style={{ marginRight: '0.5rem' }} />
                    Saved Questions
                  </span>
                </div>
              ) : (
                <div className="card-stats">
                  <div className="stat" title="Total Questions">
                    <FaQuestionCircle className="stat-icon" />
                    <span>{section.questionCount || 0}</span>
                  </div>
                  <div className="stat" title="Answered">
                    <FaCheckCircle className="stat-icon" />
                    <span>{section.answeredCount || 0}</span>
                  </div>
                  <div className="stat date" title="Created Date">
                    <FaCalendarAlt className="stat-icon" />
                    <span>
                      {section.createdAt ? new Date(section.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                    </span>
                  </div>
                </div>
              )}

              <div className="card-actions">
                {/* Quick Play buttons */}
                {!isVirtual && (
                  activeSession ? (
                    <>
                      <button
                        className="action-btn play resume"
                        onClick={(e) => handleResumeClick(section._id, e)}
                        title={`Resume session (${activeSession.remaining}/${activeSession.total} remaining)`}
                        disabled={isLoading}
                      >
                        <FaPause /> Resume
                      </button>
                      <button
                        className="action-btn play end"
                        onClick={(e) => handleEndClick(section._id, e)}
                        title="End session"
                        disabled={isLoading}
                      >
                        <FaStop />
                      </button>
                    </>
                  ) : (
                    <button
                      className="action-btn play start"
                      onClick={(e) => handlePlayClick(section._id, e)}
                      title="Quick Play - Review all questions"
                      disabled={isLoading}
                    >
                      <FaPlay />
                    </button>
                  )
                )}
                <button
                  className="action-btn view"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSectionClick(section._id);
                  }}
                  title="View Questions"
                >
                  <FaEye /> View
                </button>
                {!isVirtual && (
                  <>
                    <button
                      className="action-btn edit"
                      onClick={(e) => handleEditSection(section, e)}
                      title="Edit Section"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={(e) => handleDeleteClick(section._id, e)}
                      title="Delete Section"
                    >
                      <FaTrash />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SectionList;