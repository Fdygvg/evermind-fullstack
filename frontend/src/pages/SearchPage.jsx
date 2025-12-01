import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sectionService } from "../services/sections";
import { questionService } from "../services/question";
import SearchBar from '../components/Common/SearchBar';

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initial filters from navigation state or URL params
  const [filters, setFilters] = useState({
    query: location.state?.query || '',
    sectionId: location.state?.sectionId || '',
    tag: '',
    sortBy: 'recent', // recent, correct, wrong, oldest
  });
  
  const [results, setResults] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const resultsPerPage = 20;

  useEffect(() => {
    fetchSections();
    if (filters.query || location.state) {
      fetchResults(true); // Reset to page 1
    }
  }, [filters]);

  const fetchSections = async () => {
    try {
      const response = await sectionService.getSections();
      setSections(response.data.data.sections);
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  };

  const fetchResults = async (reset = false) => {
    try {
      setLoading(true);
      
      const currentPage = reset ? 1 : page;
      const searchParams = {
        ...filters,
        page: currentPage,
        limit: resultsPerPage
      };

      const response = await questionService.searchQuestions(searchParams);
      const newResults = response.data.data.questions || [];
      const total = response.data.count || 0;
      
      if (reset) {
        setResults(newResults);
        setPage(1);
      } else {
        setResults(prev => [...prev, ...newResults]);
      }
      
      setTotalResults(total);
      setHasMore(newResults.length === resultsPerPage);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    // Reset page when filters change
    setPage(1);
  };

  const handleSearch = (searchData) => {
    setFilters(prev => ({
      ...prev,
      query: searchData.query,
      sectionId: searchData.sectionId
    }));
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchResults(false);
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      sectionId: '',
      tag: '',
      sortBy: 'recent'
    });
    setResults([]);
    setTotalResults(0);
  };

  const exportResults = () => {
    // Create CSV content
    const headers = ['Question', 'Answer', 'Section', 'Correct', 'Wrong', 'Last Reviewed'];
    const csvContent = [
      headers.join(','),
      ...results.map(q => [
        `"${q.question.replace(/"/g, '""')}"`,
        `"${q.answer.replace(/"/g, '""')}"`,
        `"${q.sectionId?.name || 'Uncategorized'}"`,
        q.totalCorrect || 0,
        q.totalWrong || 0,
        q.lastReviewed ? new Date(q.lastReviewed).toLocaleDateString() : 'Never'
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evermind-search-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getTagSuggestions = () => {
    // Extract unique tags from results
    const allTags = results.flatMap(q => q.tags || []);
    return [...new Set(allTags)].slice(0, 10);
  };

  return (
    <div className="search-page-container">
      <div className="search-page-header">
        <h1>🔍 Search Questions</h1>
        <p>Find questions across all your sections</p>
      </div>

      {/* Main Search Bar */}
      <div className="main-search-container">
        <SearchBar 
          placeholder="Search questions or answers..."
          onSearch={handleSearch}
          compact={false}
        />
      </div>

      {/* Filters Sidebar */}
      <div className="search-layout">
        <div className="filters-sidebar">
          <div className="filters-section">
            <h3>Filters</h3>
            
            {/* Section Filter */}
            <div className="filter-group">
              <label>Section</label>
              <select
                value={filters.sectionId}
                onChange={(e) => handleFilterChange('sectionId', e.target.value)}
                className="filter-select"
              >
                <option value="">All Sections</option>
                {sections.map(section => (
                  <option key={section._id} value={section._id}>
                    {section.name} ({section.questionCount || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div className="filter-group">
              <label>Tag</label>
              <input
                type="text"
                value={filters.tag}
                onChange={(e) => handleFilterChange('tag', e.target.value)}
                placeholder="Enter a tag..."
                className="filter-input"
                list="tag-suggestions"
              />
              <datalist id="tag-suggestions">
                {getTagSuggestions().map(tag => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
            </div>

            {/* Sort Options */}
            <div className="filter-group">
              <label>Sort by</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="filter-select"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="correct">Most Correct</option>
                <option value="wrong">Most Wrong</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="filter-actions">
              <button 
                onClick={clearFilters}
                className="clear-filters-btn"
              >
                Clear Filters
              </button>
              <button 
                onClick={() => fetchResults(true)}
                className="apply-filters-btn"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Apply Filters'}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          {totalResults > 0 && (
            <div className="search-stats">
              <h3>Search Stats</h3>
              <div className="stat-item">
                <span className="stat-label">Total Results:</span>
                <span className="stat-value">{totalResults}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Current Page:</span>
                <span className="stat-value">{page}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Results per page:</span>
                <span className="stat-value">{resultsPerPage}</span>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="results-panel">
          {/* Results Header */}
          <div className="results-header">
            <h2>
              {totalResults === 0 ? 'No results' : `${totalResults} result${totalResults !== 1 ? 's' : ''} found`}
            </h2>
            {totalResults > 0 && (
              <button 
                onClick={exportResults}
                className="export-btn"
              >
                📥 Export Results
              </button>
            )}
          </div>

          {/* Results Grid */}
          {results.length === 0 && !loading ? (
            <div className="no-results-message">
              <div className="empty-state-icon">🔍</div>
              <h3>No questions found</h3>
              <p>Try changing your search terms or filters</p>
              <button 
                onClick={() => navigate('/questions/add')}
                className="add-question-btn"
              >
                ➕ Add New Question
              </button>
            </div>
          ) : (
            <>
              <div className="results-grid">
                {results.map(question => (
                  <div key={question._id} className="question-result-card">
                    <div className="question-header">
                      <span className="section-badge" style={{ 
                        backgroundColor: question.sectionId?.color || '#6b7280' 
                      }}>
                        {question.sectionId?.name || 'Uncategorized'}
                      </span>
                      <div className="question-actions">
                        <button 
                          onClick={() => navigate(`/questions/edit/${question._id}`, { 
                            state: { question } 
                          })}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => navigate('/sessions/start', {
                            state: { 
                              sectionId: question.sectionId?._id,
                              autoStart: true 
                            }
                          })}
                          className="review-btn"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                    
                    <div className="question-content">
                      <h4 className="question-text">{question.question}</h4>
                      <p className="answer-text">{question.answer}</p>
                      
                      {question.tags && question.tags.length > 0 && (
                        <div className="tags-container">
                          {question.tags.map(tag => (
                            <span 
                              key={tag} 
                              className="tag"
                              onClick={() => handleFilterChange('tag', tag)}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="question-stats">
                        <span className="stat correct-stat" title="Correct answers">
                          ✅ {question.totalCorrect || 0}
                        </span>
                        <span className="stat wrong-stat" title="Wrong answers">
                          ❌ {question.totalWrong || 0}
                        </span>
                        <span className="stat last-reviewed" title="Last reviewed">
                          📅 {question.lastReviewed 
                            ? new Date(question.lastReviewed).toLocaleDateString() 
                            : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="load-more-container">
                  <button 
                    onClick={loadMore}
                    className="load-more-btn"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More Questions'}
                  </button>
                </div>
              )}

              {/* End of Results */}
              {!hasMore && results.length > 0 && (
                <div className="end-of-results">
                  <p>🎉 You've reached the end! No more questions to show.</p>
                </div>
              )}
            </>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Searching your questions...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;