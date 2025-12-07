import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { sectionService } from "../services/sections";
import SectionList from "../components/Common/SectionList";

const SectionListPage = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filteredSections, setFilteredSections] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("name");

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    let result = [...sections];

    // Apply search filter
    if (searchQuery.trim()) {
      result = result.filter(section =>
        section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case "name":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "questions-asc":
          return (a.questionCount || 0) - (b.questionCount || 0);
        case "questions-desc":
          return (b.questionCount || 0) - (a.questionCount || 0);
        case "date-recent":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "date-old":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        default:
          return 0;
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

  const handleDeleteSection = async (sectionId, e) => {
    e.stopPropagation();
    
    if (!window.confirm("Are you sure? This will delete all questions in this section too!")) {
      return;
    }

    try {
      await sectionService.deleteSection(sectionId);
      setSections(prev => prev.filter(s => s._id !== sectionId));
    } catch (error) {
      console.error("Failed to delete section:", error);
      setError("Failed to delete section.");
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

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };


  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading sections...</p>
      </div>
    );
  }

  return (
    <div className="section-list-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <h1>📚 My Study Sections</h1>
          <p className="subtitle">
            {sections.length} section{sections.length !== 1 ? 's' : ''} • 
            {sections.reduce((total, section) => total + (section.questionCount || 0), 0)} total questions
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
            <button 
              className="clear-search" 
              onClick={() => setSearchQuery("")}
            >
              ×
            </button>
          )}
        </div>

        <div className="sort-control">
          <label className="sort-label">Sort by:</label>
          <select
            value={sortOption}
            onChange={handleSortChange}
            className="sort-select"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="sections-grid">
        {filteredSections.length === 0 ? (
          <div className="empty-state">
            {searchQuery ? (
              <>
                <div className="empty-icon">🔍</div>
                <h3>No sections found</h3>
                <p>No sections match "{searchQuery}"</p>
                <button 
                  className="btn btn-outline" 
                  onClick={() => setSearchQuery("")}
                >
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
            sections={filteredSections} 
            onDeleteSection={handleDeleteSection} 
            searchQuery={searchQuery}
          />
        )}
      </div>

      {/* Stats Footer */}
      {sections.length > 0 && (
        <div className="stats-footer">
          <div className="stat-item">
            <span className="stat-value">{sections.length}</span>
            <span className="stat-label">Sections</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {sections.reduce((total, section) => total + (section.questionCount || 0), 0)}
            </span>
            <span className="stat-label">Total Questions</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {Math.round(sections.reduce((total, section) => total + (section.questionCount || 0), 0) / sections.length) || 0}
            </span>
            <span className="stat-label">Avg per Section</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionListPage;