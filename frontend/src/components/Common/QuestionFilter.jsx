import React from "react";
import "../css/questionFilter.css";

const QuestionFilter = ({
  searchQuery,
  setSearchQuery,
  filterOption,
  setFilterOption,
  sortOption,
  setSortOption,
  difficultyFilter,
  setDifficultyFilter,
  difficultyOptions,
  onToggleAllReveal,
  allRevealed,
  selectedCount,
  totalCount,
  onSelectAll,
  isAllSelected,
  viewMode,
  setViewMode
}) => {
  // Filter options
  const filterOptions = [
    { value: "all", label: "All Questions", icon: "📚" },
    { value: "unanswered", label: "Unanswered", icon: "❓" },
    { value: "answered", label: "Answered", icon: "✅" },
    { value: "needs-review", label: "Needs Review", icon: "🔄" },
    { value: "knowit", label: "Know It", icon: "🎯" },
    { value: "kinda", label: "Kinda", icon: "🤔" },
    { value: "dontknow", label: "Don't Know", icon: "❌" }
  ];

  // Sort options
  const sortOptions = [
    { value: "date", label: "Recently Added", icon: "📅" },
    { value: "date-old", label: "Oldest First", icon: "📅" },
    { value: "difficulty-asc", label: "Difficulty (Easy → Hard)", icon: "📊" },
    { value: "difficulty-desc", label: "Difficulty (Hard → Easy)", icon: "📊" },
    { value: "alphabetical", label: "Alphabetical (A-Z)", icon: "🔤" },
    { value: "alphabetical-desc", label: "Alphabetical (Z-A)", icon: "🔤" },
    { value: "review-date", label: "Next Review Date", icon: "⏰" },
    { value: "answered", label: "Most Answered", icon: "💯" }
  ];

  // Handle search input clear
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // Handle clear all filters
  const handleClearAllFilters = () => {
    setSearchQuery("");
    setFilterOption({ value: "all", label: "All Questions" });
    setDifficultyFilter([]);
    setSortOption({ value: "date", label: "Recently Added" });
  };

  // Handle filter option change
  const handleFilterChange = (e) => {
    const selected = filterOptions.find(opt => opt.value === e.target.value);
    setFilterOption(selected || filterOptions[0]);
  };

  // Handle sort option change
  const handleSortChange = (e) => {
    const selected = sortOptions.find(opt => opt.value === e.target.value);
    setSortOption(selected || sortOptions[0]);
  };

  // Handle difficulty toggle
  const handleDifficultyToggle = (difficultyValue) => {
    setDifficultyFilter(prev => {
      const exists = prev.find(d => d.value === difficultyValue);
      if (exists) {
        return prev.filter(d => d.value !== difficultyValue);
      } else {
        const option = difficultyOptions.find(d => d.value === difficultyValue);
        return option ? [...prev, option] : prev;
      }
    });
  };

  // Format selected difficulties for display
  const getDifficultyDisplay = () => {
    if (difficultyFilter.length === 0) return "All difficulties";
    if (difficultyFilter.length === difficultyOptions.length) return "All difficulties";
    return difficultyFilter.map(d => d.label).join(", ");
  };

  // Check if any filter is active
  const isAnyFilterActive = 
    searchQuery.trim() !== "" ||
    (filterOption?.value || filterOption) !== "all" ||
    difficultyFilter.length > 0 ||
    (sortOption?.value || sortOption) !== "date";

  return (
    <div className="question-filters">
      {/* Top Row: Search & Bulk Actions */}
      <div className="filters-top-row">
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search questions or answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="clear-search-btn"
                onClick={handleClearSearch}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          
          <div className="search-stats">
            <span className="stats-text">
              {totalCount} question{totalCount !== 1 ? 's' : ''}
            </span>
            {selectedCount > 0 && (
              <span className="selected-stats">
                • {selectedCount} selected
              </span>
            )}
          </div>
        </div>

        <div className="bulk-actions-container">
          <div className="view-toggle">
            <span className="view-label">View:</span>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List View"
            >
              ≡ List
            </button>
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              ⏹️ Grid
            </button>
          </div>

          <div className="bulk-toggle">
            <button
              className={`reveal-all-btn ${allRevealed ? "active" : ""}`}
              onClick={onToggleAllReveal}
              title={allRevealed ? "Hide all answers" : "Reveal all answers"}
            >
              {allRevealed ? "👁️ Hide All" : "👁️ Reveal All"}
            </button>

            <div className="select-all-container">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onSelectAll}
                className="select-all-checkbox"
                id="select-all"
              />
              <label htmlFor="select-all" className="select-all-label">
                Select All
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Filter Controls */}
      <div className="filters-bottom-row">
        {/* Status Filter */}
        <div className="filter-group">
          <label className="filter-label">
            <span className="filter-icon">📋</span>
            Status
          </label>
          <select
            value={filterOption?.value || filterOption || "all"}
            onChange={handleFilterChange}
            className="filter-select"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="filter-group">
          <label className="filter-label">
            <span className="filter-icon">📊</span>
            Difficulty
          </label>
          <div className="difficulty-checkboxes">
            {difficultyOptions.map((option) => {
              const isSelected = difficultyFilter.some(d => d.value === option.value);
              return (
                <label key={option.value} className="difficulty-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleDifficultyToggle(option.value)}
                    className="difficulty-checkbox"
                  />
                  <span 
                    className="difficulty-dot"
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="option-label">{option.label}</span>
                </label>
              );
            })}
          </div>
          {difficultyFilter.length > 0 && (
            <div className="selected-difficulties">
              {getDifficultyDisplay()}
            </div>
          )}
        </div>

        {/* Sort Filter */}
        <div className="filter-group">
          <label className="filter-label">
            <span className="filter-icon">↕️</span>
            Sort by
          </label>
          <select
            value={sortOption?.value || sortOption || "date"}
            onChange={handleSortChange}
            className="filter-select"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className="filter-group filter-actions">
          {isAnyFilterActive && (
            <button
              className="clear-filters-btn"
              onClick={handleClearAllFilters}
              title="Clear all filters"
            >
              🗑️ Clear Filters
            </button>
          )}
          
          <div className="active-filters-count">
            {isAnyFilterActive ? (
              <span className="active-filters-badge">
                Filters Active
              </span>
            ) : (
              <span className="no-filters-text">
                No filters applied
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Summary (Mobile) */}
      <div className="active-filters-summary">
        {isAnyFilterActive && (
          <>
            <span className="summary-label">Active filters:</span>
            {searchQuery && (
              <span className="filter-tag">
                Search: "{searchQuery}"
                <button 
                  onClick={() => setSearchQuery("")}
                  className="filter-tag-remove"
                >
                  ✕
                </button>
              </span>
            )}
            {(filterOption?.value || filterOption) !== "all" && (
              <span className="filter-tag">
                {filterOption?.label || filterOptions.find(o => o.value === filterOption)?.label}
                <button 
                  onClick={() => setFilterOption(filterOptions[0])}
                  className="filter-tag-remove"
                >
                  ✕
                </button>
              </span>
            )}
            {difficultyFilter.length > 0 && (
              <span className="filter-tag">
                {getDifficultyDisplay()}
                <button 
                  onClick={() => setDifficultyFilter([])}
                  className="filter-tag-remove"
                >
                  ✕
                </button>
              </span>
            )}
            {(sortOption?.value || sortOption) !== "date" && (
              <span className="filter-tag">
                Sorted: {sortOption?.label || sortOptions.find(o => o.value === sortOption)?.label}
                <button 
                  onClick={() => setSortOption(sortOptions[0])}
                  className="filter-tag-remove"
                >
                  ✕
                </button>
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QuestionFilter;