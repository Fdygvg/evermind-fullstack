import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/sectionList.css";

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

  // Calculate progress percentage (example: based on questions answered)
  const calculateProgress = (section) => {
    // You'll need to add this data to your section model
    const totalQuestions = section.questionCount || 0;
    const answeredQuestions = section.answeredCount || 0;
    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  };

  if (!sections || sections.length === 0) {
    return (
      <div className="empty-sections">
        {searchQuery ? (
          <>
            <div className="empty-icon">🔍</div>
            <h3>No sections found</h3>
            <p>No sections match "{searchQuery}"</p>
          </>
        ) : (
          <>
            <div className="empty-icon">📚</div>
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
        const progress = calculateProgress(section);

        return (
          <div
            key={section._id}
            className="section-card"
            onClick={() => handleSectionClick(section._id)}
            style={{ borderLeft: `4px solid ${section.color || "#667eea"}` }}
          >
            <div className="section-card-header">
              <div className="section-title-container">
                <h3 className="section-title">{section.name}</h3>
                <button
                  className="section-info-btn"
                  onClick={(e) => handleInfoClick(section._id, e)}
                  title="Section details"
                >
                  (i)
                </button>
              </div>

              {section.tags && section.tags.length > 0 && (
                <div className="section-tags">
                  {section.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="section-tag">
                      {tag}
                    </span>
                  ))}
                  {section.tags.length > 2 && (
                    <span className="section-tag-more">
                      +{section.tags.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>

            <p className="section-description">
              {section.description || "No description provided"}
            </p>

            {/* Progress Bar */}
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: section.color || "#667eea"
                  }}
                />
              </div>
              <span className="progress-text">{progress}% complete</span>
            </div>

            <div className="section-stats">
              <div className="stat-item">
                <span className="stat-icon">❓</span>
                <span className="stat-value">{section.questionCount || 0}</span>
                <span className="stat-label">Questions</span>
              </div>

              <div className="stat-item">
                <span className="stat-icon">✅</span>
                <span className="stat-value">{section.answeredCount || 0}</span>
                <span className="stat-label">Answered</span>
              </div>

              <div className="stat-item">
                <span className="stat-icon">📅</span>
                <span className="stat-value">
                  {section.createdAt ?
                    new Date(section.createdAt).toLocaleDateString('en-US', { month: 'short' })
                    : 'N/A'}
                </span>
                <span className="stat-label">Created</span>
              </div>
            </div>

            <div className="section-actions">
              <button
                className="btn btn-edit"
                onClick={(e) => handleEditSection(section, e)}
                title="Edit section"
              >
                ✏️ Edit
              </button>
              <button
                className="btn btn-delete"
                onClick={(e) => handleDeleteClick(section._id, e)}
                title="Delete section"
              >
                🗑️ Delete
              </button>
              <button
                className="btn btn-view"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSectionClick(section._id);
                }}
                title="View questions"
              >
                👁️ View
              </button>
            </div>

            {/* Last Updated */}
            {section.updatedAt && (
              <div className="section-footer">
                <span className="updated-text">
                  Updated {new Date(section.updatedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SectionList;