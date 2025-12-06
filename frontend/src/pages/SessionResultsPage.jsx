import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionService } from '../services/sessions';


const SessionResultsPage = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await sessionService.getLastResults();
      
      if (response.data.success && response.data.data) {
        setResults(response.data.data);
      } else {
        setError('No completed sessions found');
      }
    } catch (err) {
      console.error('Fetch results error:', err);
      setError('Could not load session results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your session results...</p>
      </div>
    );
  }

  return (
    <div className="session-results-page">
      <div className="results-container">
        <h1>📊 Session Results</h1>
        
        {error && <div className="error-alert">{error}</div>}
        
        {results ? (
          <>
            <div className="stats-grid">
              <div className="stat-box correct">
                <h3>{results.correct}</h3>
                <p>Correct</p>
              </div>
              <div className="stat-box wrong">
                <h3>{results.wrong}</h3>
                <p>Wrong</p>
              </div>
              <div className="stat-box accuracy">
                <h3>{results.accuracy}%</h3>
                <p>Accuracy</p>
              </div>
              <div className="stat-box duration">
                <h3>{results.duration}m</h3>
                <p>Duration</p>
              </div>
            </div>

            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${results.accuracy}%` }}
                ></div>
              </div>
              <p className="progress-text">
                You answered {results.correct} out of {results.total} questions correctly
              </p>
            </div>

            <div className="session-info">
              <p><strong>Card Style:</strong> {results.cardMode === 'flashcard' ? 'Flashcard' : 'Normal'}</p>
              {results.date && (
                <p><strong>Completed:</strong> {new Date(results.date).toLocaleString()}</p>
              )}
            </div>

            <div className="action-buttons">
              <button 
                onClick={() => navigate('/session/review')}
                className="btn-primary"
              >
                Start New Session
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
              >
                Back to Dashboard
              </button>
            </div>
          </>
        ) : (
          <div className="no-results">
            <p>No session results available.</p>
            <button 
              onClick={() => navigate('/session/start')}
              className="btn-primary"
            >
              Start Your First Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionResultsPage;