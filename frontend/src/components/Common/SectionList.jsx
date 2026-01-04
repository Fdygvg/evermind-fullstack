import React from "react";
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
  FaInfoCircle
} from "react-icons/fa";
import "../../components/css/sectionList.css"; // Improved path to match actual location if needed, otherwise relative to component file

const SectionList = ({ sections, onDeleteSection, searchQuery }) => {
  const navigate = useNavigate();

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