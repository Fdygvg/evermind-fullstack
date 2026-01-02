import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sectionService } from "../../services/sections.js";
import { questionService } from "../../services/question";
import "../css/searchBar.css"

const SearchBar = ({ placeholder = "Search questions...", compact = false, onSearch }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const navigate = useNavigate();
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    // Fetch sections for filter dropdown
    fetchSections();

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Debounce search input
    if (query.trim().length >= 2) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        fetchSuggestions();
      }, 300);
    } else {
      setSuggestions([]);
    }
  }, [query, selectedSection]);

  const fetchSections = async () => {
    try {
      const response = await sectionService.getSections();
      setSections(response.data.data.sections);
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      setLoading(true);

      const searchParams = { query: query.trim() };
      if (selectedSection) {
        searchParams.sectionId = selectedSection;
      }

      const response = await questionService.searchQuestions(searchParams);
      setSuggestions(response.data.data.questions || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ query, sectionId: selectedSection });
    } else {
      // Navigate to search page with filters
      navigate('/search', {
        state: {
          query,
          sectionId: selectedSection
        }
      });
    }
    setShowDropdown(false);
  };

  const handleSuggestionClick = (question) => {
    navigate(`/questions/edit/${question._id}`, {
      state: { question }
    });
    setShowDropdown(false);
    setQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedSection('');
    setShowDropdown(false);
  };

  return (
    <div className={`search-bar-container ${compact ? 'compact' : ''}`} ref={searchRef}>
      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-input-group">
          {/* Search Icon */}
          <span className="search-icon">🔍</span>

          {/* Main Search Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
            placeholder={placeholder}
            className="search-input"
            autoComplete="off"
          />

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              className="clear-btn"
              onClick={clearSearch}
            >
              ✕
            </button>
          )}

          {/* Section Filter Dropdown */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="section-filter"
          >
            <option value="">All Sections</option>
            {sections.map(section => (
              <option key={section._id} value={section._id}>
                {section.name}
              </option>
            ))}
          </select>

          {/* Search Button */}
          <button
            type="submit"
            className="search-btn"
            disabled={!query.trim()}
          >
            Search
          </button>
        </div>

        {/* Search Suggestions Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            <div className="suggestions-header">
              <span className="results-count">
                {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                className="close-dropdown"
                onClick={() => setShowDropdown(false)}
              >
                ✕
              </button>
            </div>

            <div className="suggestions-list">
              {suggestions.map(question => (
                <div
                  key={question._id}
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(question)}
                >
                  <div className="suggestion-content">
                    <h4 className="suggestion-question">
                      {question.question.length > 80
                        ? `${question.question.substring(0, 80)}...`
                        : question.question}
                    </h4>
                    <p className="suggestion-section">
                      {question.sectionId?.name || 'Uncategorized'}
                    </p>
                    <div className="suggestion-stats">
                      <span className="correct-stat">✅ {question.totalCorrect || 0}</span>
                      <span className="wrong-stat">❌ {question.totalWrong || 0}</span>
                    </div>
                  </div>
                  <div className="suggestion-action">
                    <span className="action-arrow">→</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="suggestions-footer">
              <button
                className="view-all-btn"
                onClick={handleSearch}
              >
                View all results
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="search-loading">
            <div className="loading-spinner"></div>
          </div>
        )}

        {/* No Results */}
        {showDropdown && !loading && suggestions.length === 0 && query.length >= 2 && (
          <div className="no-results">
            <p>No questions found for "{query}"</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;