import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaPercentage,
  FaClock,
  FaRedo,
  FaHome,
  FaPlay,
  FaFire,
  FaSmile,
  FaMeh,
  FaFrown,
  FaDizzy
} from 'react-icons/fa';
import { sessionService } from '../services/sessions';
import '../css/sessionResults.css';

const SessionResultsPage = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Check for state passed from session pages
  const stateResults = location.state;

  useEffect(() => {
    // If we have state from navigation, use that directly
    if (stateResults?.fromSession) {
      setResults({
        mode: stateResults.mode || 'session',
        ratingBreakdown: stateResults.ratingBreakdown || {},
        totalQuestions: stateResults.totalQuestions || 0,
        reviewedCount: stateResults.reviewedCount || 0,
        sessionTime: stateResults.sessionTime || 0,
        cardMode: stateResults.cardMode || 'normal',
        date: new Date()
      });
      setLoading(false);
    } else {
      // Fallback: fetch from API
      fetchResults();
    }
  }, [stateResults]);

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

  // Format time from seconds
  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Get mode display name
  const getModeLabel = (mode) => {
    const labels = {
      'smart-review': 'Smart Review',
      'tiktok-review': 'TikTok Review',
      'elimination': 'Elimination Mode',
      'session': 'Review Session'
    };
    return labels[mode] || 'Session';
  };

  // Get rating icon and label
  const getRatingInfo = (rating) => {
    const info = {
      1: { icon: <FaDizzy />, label: 'Again (Hard)', color: 'var(--color-rating-1)' },
      2: { icon: <FaFrown />, label: 'Hard', color: 'var(--color-rating-2)' },
      3: { icon: <FaMeh />, label: 'Good', color: 'var(--color-rating-3)' },
      4: { icon: <FaSmile />, label: 'Easy', color: 'var(--color-rating-4)' },
      5: { icon: <FaFire />, label: 'Perfect', color: 'var(--color-rating-5)' }
    };
    return info[rating] || { icon: <FaSmile />, label: `Rating ${rating}`, color: 'var(--text-primary)' };
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your session results...</p>
      </div>
    );
  }

  // Calculate stats from rating breakdown
  const ratingBreakdown = results?.ratingBreakdown || {};
  const totalRated = Object.values(ratingBreakdown).reduce((sum, count) => sum + count, 0);
  const correctCount = (ratingBreakdown[3] || 0) + (ratingBreakdown[4] || 0) + (ratingBreakdown[5] || 0);
  const wrongCount = (ratingBreakdown[1] || 0) + (ratingBreakdown[2] || 0);
  const accuracy = totalRated > 0 ? Math.round((correctCount / totalRated) * 100) : 0;

  return (
    <div className="session-results-page">
      <div className="results-container animate-fade-in">
        <div className="results-header">
          <h1>Session Complete!</h1>
          <div className="mode-info">
            <span className="mode-badge">{getModeLabel(results.mode)}</span>
            {results.cardMode && results.cardMode !== 'normal' && (
              <span className="card-mode-badge">{results.cardMode}</span>
            )}
          </div>
        </div>

        {error && <div className="error-alert">{error}</div>}

        {results ? (
          <>
            {/* Main Stats */}
            <div className="stats-grid">
              <div className="stat-box correct animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="stat-icon"><FaCheckCircle /></div>
                <h3>{correctCount}</h3>
                <p>Correct</p>
              </div>
              <div className="stat-box wrong animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="stat-icon"><FaTimesCircle /></div>
                <h3>{wrongCount}</h3>
                <p>Need Review</p>
              </div>
              <div className="stat-box accuracy animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="stat-icon"><FaPercentage /></div>
                <h3>{accuracy}%</h3>
                <p>Accuracy</p>
              </div>
              <div className="stat-box duration animate-slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="stat-icon"><FaClock /></div>
                <h3>{formatTime(results.sessionTime)}</h3>
                <p>Time</p>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="rating-breakdown-section animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <h2>Rating Breakdown</h2>
              <div className="rating-breakdown-list">
                {[5, 4, 3, 2, 1].map((rating, index) => {
                  const count = ratingBreakdown[rating] || 0;
                  const percentage = totalRated > 0 ? Math.round((count / totalRated) * 100) : 0;
                  const { icon, label, color } = getRatingInfo(rating);

                  return (
                    <div key={rating} className={`rating-row rating-${rating}`} style={{ animationDelay: `${0.6 + (index * 0.1)}s` }}>
                      <div className="rating-label-group" style={{ color }}>
                        <span className="rating-icon">{icon}</span>
                        <span className="rating-text">{label}</span>
                      </div>
                      <div className="rating-bar-container">
                        <div
                          className="rating-bar-fill"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: color
                          }}
                        ></div>
                      </div>
                      <span className="rating-stats">
                        <span className="rating-count">{count}</span>
                        <span className="rating-percent">{percentage}%</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-section animate-slide-up" style={{ animationDelay: '0.8s' }}>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${accuracy}%` }}
                ></div>
              </div>
              <p className="progress-text">
                You reviewed <strong>{totalRated}</strong> out of <strong>{results.totalQuestions || totalRated}</strong> questions
              </p>
            </div>

            {/* Session Info */}
            <div className="session-info animate-fade-in" style={{ animationDelay: '0.9s' }}>
              {results.date && (
                <p><strong>Completed:</strong> {new Date(results.date).toLocaleString()}</p>
              )}
            </div>

            <div className="action-buttons animate-fade-in" style={{ animationDelay: '1s' }}>
              <button
                onClick={() => navigate('/session/review')}
                className="btn-primary"
              >
                <FaRedo /> Start New Session
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-secondary"
              >
                <FaHome /> Back to Dashboard
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
              <FaPlay /> Start Your First Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionResultsPage;