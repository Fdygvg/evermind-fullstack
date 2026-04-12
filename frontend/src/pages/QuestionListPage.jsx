import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import QuestionCard from "../components/Common/QuestionList";
import QuestionFilter from "../components/Common/QuestionFilter";
import { questionService } from "../services/question";
import { sectionService } from "../services/sections";

const QuestionListPage = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();

  // State
  const [section, setSection] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allRevealed, setAllRevealed] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // "list" or "grid"
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);
  const [allSections, setAllSections] = useState([]);
  const [moveLoading, setMoveLoading] = useState(false);

  // Filter states
  const [filterOption, setFilterOption] = useState({ value: "all", label: "All Questions" });
  const [sortOption, setSortOption] = useState({ value: "date", label: "Recently Added" });
  const [difficultyFilter, setDifficultyFilter] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch data on mount
  useEffect(() => {
    if (sectionId) {
      fetchSectionAndQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    let result = [...questions];

    // Apply search filter
    if (searchQuery.trim()) {
      result = result.filter(q =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply difficulty filter
    if (difficultyFilter.length > 0) {
      result = result.filter(q =>
        difficultyFilter.some(diff => diff.value === (q.difficulty || "medium"))
      );
    }

    // Apply status filter
    switch (filterOption.value) {
      case "unanswered":
        result = result.filter(q => (q.totalCorrect || 0) + (q.totalWrong || 0) === 0);
        break;
      case "answered":
        result = result.filter(q => (q.totalCorrect || 0) + (q.totalWrong || 0) > 0);
        break;
      case "needs-review":
        // Questions that were marked as "Don't know" or need review
        result = result.filter(q =>
          q.lastSessionStatus === "dontknow" ||
          (q.nextReviewDate && new Date(q.nextReviewDate) <= new Date())
        );
        break;
      case "know-it":
        result = result.filter(q => q.lastSessionStatus === "knowit");
        break;
      case "kinda":
        result = result.filter(q => q.lastSessionStatus === "kinda");
        break;
      case "bookmarked":
        result = result.filter(q => q.isBookmarked);
        break;
      // "all" - no filter
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOption.value) {
        case "difficulty-asc": {
          const difficultyOrder = { "easy": 1, "medium": 2, "hard": 3 };
          return (difficultyOrder[a.difficulty] || 2) - (difficultyOrder[b.difficulty] || 2);
        }
        case "difficulty-desc": {
          const difficultyOrderDesc = { "easy": 1, "medium": 2, "hard": 3 };
          return (difficultyOrderDesc[b.difficulty] || 2) - (difficultyOrderDesc[a.difficulty] || 2);
        }
        case "alphabetical": {
          return a.question.localeCompare(b.question);
        }
        case "review-date": {
          const dateA = a.nextReviewDate ? new Date(a.nextReviewDate) : new Date(0);
          const dateB = b.nextReviewDate ? new Date(b.nextReviewDate) : new Date(0);
          return dateA - dateB;
        }
        case "answered": {
          const answeredA = (a.totalCorrect || 0) + (a.totalWrong || 0);
          const answeredB = (b.totalCorrect || 0) + (b.totalWrong || 0);
          return answeredB - answeredA;
        }
        default: // "date"
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    setFilteredQuestions(result);
  }, [questions, searchQuery, filterOption, sortOption, difficultyFilter]);

  const fetchSectionAndQuestions = async () => {
    try {
      setLoading(true);

      // Handle special "Bookmarked" virtual section
      if (sectionId === "bookmarked") {
        setSection({
          _id: "bookmarked",
          name: "Bookmarked Questions",
          color: "#F59E0B",
          description: "Your personal collection of bookmarked questions."
        });

        // Fetch all questions and filter for bookmarks
        // Ideally backend should support ?isBookmarked=true but this works for now
        const questionsResponse = await questionService.getQuestions({});
        const allQuestions = questionsResponse.data.data.questions || [];
        const bookmarkedQuestions = allQuestions.filter(q => q.isBookmarked);

        setQuestions(bookmarkedQuestions);
        setFilteredQuestions(bookmarkedQuestions);
        setLoading(false);
        return;
      }

      // Fetch all sections and find the one we need (backend doesn't have GET /sections/:id endpoint)
      const sectionsResponse = await sectionService.getSections();
      const allSections = sectionsResponse.data.data.sections || sectionsResponse.data.data || [];
      const section = allSections.find(s => s._id === sectionId);

      if (!section) {
        setError("Section not found.");
        setLoading(false);
        return;
      }

      setSection(section);

      // Fetch questions for this section
      const questionsResponse = await questionService.getQuestions({ sectionId });
      setQuestions(questionsResponse.data.data.questions || []);
      setFilteredQuestions(questionsResponse.data.data.questions || []);

    } catch (error) {
      console.error("Failed to load data:", error);
      setError("Failed to load questions. Please try again.");
    } finally {
      if (sectionId !== "bookmarked") {
        setLoading(false);
      }
    }
  };

  const handleQuestionClick = (
    // questionId
  ) => {
    // Click on question reveals answer (handled by QuestionCard)
  };

  const handleInfoClick = (
    // questionId

  ) => {
    // Click on (i) button flips card (handled by QuestionCard)
  };

  const handleEditQuestion = (questionId, e) => {
    e.stopPropagation();
    navigate(`/questions/edit/${questionId}`);
  };

  const handleDeleteQuestion = async (questionId, e) => {
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this question?")) return;

    try {
      await questionService.deleteQuestion(questionId);
      setQuestions(prev => prev.filter(q => q._id !== questionId));
      setSelectedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    } catch (error) {
      console.error("Failed to delete question:", error);
      setError("Failed to delete question.");
    }
  };

  const toggleAllReveal = () => {
    setAllRevealed(!allRevealed);
  };

  const toggleQuestionSelect = (questionId) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const selectAllQuestions = () => {
    if (selectedQuestions.size === filteredQuestions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(filteredQuestions.map(q => q._id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.size === 0) return;

    if (!window.confirm(`Delete ${selectedQuestions.size} selected question(s)?`)) return;

    try {
      // Bulk delete API call (you might need to implement this)
      await Promise.all(
        Array.from(selectedQuestions).map(id =>
          questionService.deleteQuestion(id)
        )
      );

      // Remove deleted questions from state
      setQuestions(prev => prev.filter(q => !selectedQuestions.has(q._id)));
      setSelectedQuestions(new Set());

    } catch (error) {
      console.error("Failed to delete questions:", error);
      setError("Failed to delete some questions.");
    }
  };

  // Fetch all sections for the move dropdown
  const fetchAllSections = async () => {
    try {
      const response = await sectionService.getSections();
      const sections = response.data.data.sections || response.data.data || [];
      // Exclude current section from the list
      setAllSections(sections.filter(s => s._id !== sectionId));
    } catch (error) {
      console.error("Failed to fetch sections:", error);
    }
  };

  const handleBulkMove = async (targetSectionId) => {
    if (selectedQuestions.size === 0) return;

    const targetSection = allSections.find(s => s._id === targetSectionId);
    if (!targetSection) return;

    if (!window.confirm(
      `Move ${selectedQuestions.size} question(s) to "${targetSection.name}"?\n\n⚠️ All progress will be reset — these questions will be treated as new in the target section.`
    )) return;

    setMoveLoading(true);
    try {
      const response = await questionService.bulkMove(
        Array.from(selectedQuestions),
        targetSectionId
      );

      if (response.data.success) {
        // Remove moved questions from current list
        setQuestions(prev => prev.filter(q => !selectedQuestions.has(q._id)));
        setSelectedQuestions(new Set());
        setShowMoveDropdown(false);
        alert(`✅ ${response.data.data.movedCount} question(s) moved to "${targetSection.name}"`);
      }
    } catch (error) {
      console.error("Failed to move questions:", error);
      setError("Failed to move questions: " + (error.response?.data?.message || "Unknown error"));
    } finally {
      setMoveLoading(false);
    }
  };

  const difficultyOptions = [
    { value: "easy", label: "Easy", color: "#10B981" },
    { value: "medium", label: "Medium", color: "#F59E0B" },
    { value: "hard", label: "Hard", color: "#EF4444" }
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading questions...</p>
      </div>
    );
  }
  const handleBookmarkToggle = async (questionId) => {
    try {
      // Optimistic update
      setQuestions(prev => prev.map(q =>
        q._id === questionId ? { ...q, isBookmarked: !q.isBookmarked } : q
      ));

      // Use the specific toggle endpoint
      await questionService.toggleBookmark(questionId);

    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
      // Revert on error
      setQuestions(prev => prev.map(q =>
        q._id === questionId ? { ...q, isBookmarked: !q.isBookmarked } : q
      ));
      setError("Failed to update bookmark.");
    }
  };


  return (
    <div className="question-list-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <div className="breadcrumb">
            <Link to="/sections" className="breadcrumb-link">
              ← Back to Sections
            </Link>
          </div>

          <div className="section-header">
            <h1>
              <span
                className="section-color-indicator"
                style={{ backgroundColor: section?.color || "#667eea" }}
              />
              {section?.name || "Questions"}
            </h1>
            <p className="section-description">
              {section?.description || ""}
            </p>
          </div>

          <div className="section-stats-summary">
            <div className="summary-item">
              <span className="summary-value">{questions.length}</span>
              <span className="summary-label">Total Questions</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">
                {questions.filter(q => (q.totalCorrect || 0) + (q.totalWrong || 0) > 0).length}
              </span>
              <span className="summary-label">Answered</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">
                {questions.filter(q => q.difficulty === "hard").length}
              </span>
              <span className="summary-label">Hard</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <Link
            to={`/questions/add?sectionId=${sectionId}`}
            className="btn btn-primary"
          >
            <span className="btn-icon">+</span> Add Question
          </Link>

          <Link
            to={`/questions/bulk-import?sectionId=${sectionId}`}
            className="btn btn-secondary"
          >
            <span className="btn-icon">📥</span> Bulk Import
          </Link>

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              ≡
            </button>
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              ⏹️
            </button>
          </div>
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

      {/* Bulk Actions Bar */}
      {selectedQuestions.size > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-selection-info">
            <span className="selected-count">{selectedQuestions.size}</span>
            <span className="selected-label">question(s) selected</span>
          </div>

          <div className="bulk-actions">
            <button
              className="bulk-btn bulk-reveal"
              onClick={toggleAllReveal}
            >
              {allRevealed ? "👁️‍🗨️ Hide All" : "👁️ Reveal All"}
            </button>

            <div className="bulk-move-container" style={{ position: 'relative' }}>
              <button
                className="bulk-btn bulk-move"
                onClick={() => {
                  if (!showMoveDropdown) fetchAllSections();
                  setShowMoveDropdown(!showMoveDropdown);
                }}
                disabled={moveLoading}
                style={{
                  background: 'var(--color-primary)',
                  color: 'var(--text-inverse)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
              >
                📦 {moveLoading ? 'Moving...' : 'Move to Section'}
              </button>

              {showMoveDropdown && (
                <div
                  className="move-dropdown"
                  style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    background: 'var(--bg-primary, #1a1a2e)',
                    border: '1px solid var(--border-color, #333)',
                    borderRadius: '12px',
                    padding: '0.5rem',
                    minWidth: '220px',
                    maxHeight: '280px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                  }}
                >
                  <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', color: '#ffffff', opacity: 0.7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Select target section
                  </div>
                  {allSections.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: '#ffffff', opacity: 0.6, fontSize: '0.85rem' }}>
                      No other sections available.
                      <br />
                      <span style={{ fontSize: '0.75rem' }}>Create a new section first.</span>
                    </div>
                  ) : (
                    allSections.map(s => (
                      <button
                        key={s._id}
                        onClick={() => handleBulkMove(s._id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          width: '100%',
                          padding: '0.6rem 0.8rem',
                          border: 'none',
                          borderRadius: '8px',
                          background: 'transparent',
                          color: '#ffffff', // Explicitly white text
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          textAlign: 'left',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover, rgba(255,255,255,0.1))'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: s.color || '#667eea',
                          flexShrink: 0
                        }} />
                        {s.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              className="bulk-btn bulk-export"
              onClick={() => {/* Export logic */ }}
            >
              📤 Export Selected
            </button>

            <button
              className="bulk-btn bulk-delete"
              onClick={handleBulkDelete}
            >
              🗑️ Delete Selected
            </button>

            <button
              className="bulk-btn bulk-clear"
              onClick={() => { setSelectedQuestions(new Set()); setShowMoveDropdown(false); }}
            >
              ✕ Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      <QuestionFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterOption={filterOption}
        setFilterOption={setFilterOption}
        sortOption={sortOption}
        setSortOption={setSortOption}
        difficultyFilter={difficultyFilter}
        setDifficultyFilter={setDifficultyFilter}
        difficultyOptions={difficultyOptions}
        onToggleAllReveal={toggleAllReveal}
        allRevealed={allRevealed}
        selectedCount={selectedQuestions.size}
        totalCount={filteredQuestions.length}
        onSelectAll={selectAllQuestions}
        isAllSelected={selectedQuestions.size === filteredQuestions.length && filteredQuestions.length > 0}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isSelectMode={isSelectMode}
        onToggleSelectMode={() => setIsSelectMode(!isSelectMode)}
      />

      {/* Questions List/Grid */}
      <div className={`questions-container ${viewMode}-view`}>
        {filteredQuestions.length === 0 ? (
          <div className="empty-state">
            {searchQuery || difficultyFilter.length > 0 || filterOption.value !== "all" ? (
              <>
                <div className="empty-icon">🔍</div>
                <h3>No questions found</h3>
                <p>Try adjusting your filters or search</p>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setSearchQuery("");
                    setDifficultyFilter([]);
                    setFilterOption({ value: "all", label: "All Questions" });
                  }}
                >
                  Clear all filters
                </button>
              </>
            ) : (
              <>
                <div className="empty-icon">❓</div>
                <h3>No questions in this section yet</h3>
                <p>Start by adding your first question</p>
                <Link
                  to={`/questions/add?sectionId=${sectionId}`}
                  className="btn btn-primary"
                >
                  Add First Question
                </Link>
              </>
            )}
          </div>
        ) : (
          filteredQuestions.map((question) => (
            <QuestionCard
              key={question._id}
              question={question}
              isRevealed={allRevealed}
              onReveal={() => handleQuestionClick(question._id)}
              onInfoClick={() => handleInfoClick(question._id)}
              onEdit={(e) => handleEditQuestion(question._id, e)}
              onDelete={(e) => handleDeleteQuestion(question._id, e)}
              onBookmark={() => handleBookmarkToggle(question._id)}
              isSelected={selectedQuestions.has(question._id)}
              onSelect={() => toggleQuestionSelect(question._id)}
              viewMode={viewMode}
              sectionColor={section?.color}
              isSelectMode={isSelectMode}
            />
          ))
        )}
      </div>

      {/* Quick Stats */}
      {filteredQuestions.length > 0 && (
        <div className="quick-stats">
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">Showing</span>
              <span className="stat-value">{filteredQuestions.length}</span>
              <span className="stat-label">of {questions.length} questions</span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Easy</span>
              <span className="stat-value easy">
                {filteredQuestions.filter(q => q.difficulty === "easy").length}
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Medium</span>
              <span className="stat-value medium">
                {filteredQuestions.filter(q => q.difficulty === "medium").length}
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Hard</span>
              <span className="stat-value hard">
                {filteredQuestions.filter(q => q.difficulty === "hard").length}
              </span>
            </div>

            <div className="stat-item">
              <span className="stat-label">Avg. Correct</span>
              <span className="stat-value">
                {filteredQuestions.length > 0
                  ? Math.round(
                    filteredQuestions.reduce((sum, q) => sum + (q.totalCorrect || 0), 0) /
                    filteredQuestions.filter(q => (q.totalCorrect || 0) > 0).length || 0
                  )
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Selection Indicator */}
      {(isSelectMode || selectedQuestions.size > 0) && (
        <div className="select-mode-sticky-banner">
          <div className="banner-content">
            <span className={`banner-pulse ${isSelectMode ? 'active' : ''}`}></span>
            <span className="banner-text">
              {isSelectMode ? (
                <>  <span style={{ whiteSpace: 'pre' }}> Active    </span><strong>{selectedQuestions.size}</strong> Selected</>
              ) : (
                <><strong>{selectedQuestions.size}</strong> {selectedQuestions.size === 1 ? 'Question' : 'Questions'} Selected</>
              )}
            </span>
          </div>
          {selectedQuestions.size > 0 && (
            <button
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '20px' }}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Go to Actions
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionListPage;