import React, { useState, useEffect } from 'react';
import { statsService } from '../services/stats';
import { useNavigate } from 'react-router-dom';


const SessionHistoryPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const sessionsPerPage = 20;
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, [page]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await statsService.getSessionHistory({
        limit: sessionsPerPage,
        page: page
      });

      const newSessions = response.data.data.sessions || [];
      
      if (page === 1) {
        setSessions(newSessions);
      } else {
        setSessions(prev => [...prev, ...newSessions]);
      }
      
      setHasMore(newSessions.length === sessionsPerPage);
    } catch (error) {
      console.error('Session history error:', error);
      setError('Failed to load session history');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return '#10b981'; // Green
    if (accuracy >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="history-loading">
        <div className="loading-spinner"></div>
        <p>Loading your session history...</p>
      </div>
    );
  }

  return (
    <div className="session-history-container">
      <div className="history-header">
        <h1>📅 Session History</h1>
        <p>Review your past study sessions</p>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {sessions.length === 0 ? (
        <div className="no-sessions">
          <div className="empty-icon">📊</div>
          <h3>No sessions yet</h3>
          <p>Start your first review session to see history here</p>
          <button 
            className="start-session-btn"
            onClick={() => navigate('/session/start')}
          >
            Start Your First Session
          </button>
        </div>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="history-stats">
            <div className="summary-card">
              <h3>Total Sessions</h3>
              <p className="summary-value">{sessions.length}</p>
            </div>
            <div className="summary-card">
              <h3>Avg. Accuracy</h3>
              <p className="summary-value">
                {Math.round(sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length)}%
              </p>
            </div>
            <div className="summary-card">
              <h3>Total Questions</h3>
              <p className="summary-value">
                {sessions.reduce((sum, s) => sum + s.total, 0)}
              </p>
            </div>
            <div className="summary-card">
              <h3>Total Time</h3>
              <p className="summary-value">
                {formatDuration(sessions.reduce((sum, s) => sum + s.duration, 0))}
              </p>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="sessions-table-container">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Correct</th>
                  <th>Wrong</th>
                  <th>Accuracy</th>
                  <th>Duration</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session, index) => (
                  <tr key={index} className="session-row">
                    <td className="session-date">
                      {new Date(session.date).toLocaleDateString()}
                      <br />
                      <small>{new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </td>
                    <td>
                      <span className={`mode-badge ${session.mode}`}>
                        {session.mode === 'buffer' ? 'Buffer' : 'Random'}
                      </span>
                    </td>
                    <td className="correct-cell">
                      <span className="stat-icon">✅</span>
                      {session.correct}
                    </td>
                    <td className="wrong-cell">
                      <span className="stat-icon">❌</span>
                      {session.wrong}
                    </td>
                    <td>
                      <div className="accuracy-cell">
                        <div 
                          className="accuracy-bar"
                          style={{ 
                            width: `${session.accuracy}%`,
                            backgroundColor: getAccuracyColor(session.accuracy)
                          }}
                        ></div>
                        <span className="accuracy-text">{session.accuracy}%</span>
                      </div>
                    </td>
                    <td className="duration-cell">
                      <span className="duration-icon">⏱️</span>
                      {formatDuration(session.duration)}
                    </td>
                    <td>
                      <button 
                        className="review-session-btn"
                        onClick={() => {
                          // Could implement session replay here
                          alert('Session replay feature coming soon!');
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="load-more-container">
              <button 
                onClick={loadMore}
                className="load-more-btn"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More Sessions'}
              </button>
            </div>
          )}

          {/* Export Options */}
          <div className="export-section">
            <h3>Export History</h3>
            <div className="export-options">
              <button 
                className="export-btn"
                onClick={() => {
                  // Implement CSV export
                  const csvContent = [
                    ['Date', 'Mode', 'Correct', 'Wrong', 'Accuracy', 'Duration', 'Sections'],
                    ...sessions.map(s => [
                      new Date(s.date).toISOString(),
                      s.mode,
                      s.correct,
                      s.wrong,
                      `${s.accuracy}%`,
                      `${s.duration}m`,
                      s.sections?.map(sec => sec.name).join(', ') || 'N/A'
                    ])
                  ].map(row => row.join(',')).join('\n');

                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `evermind-session-history-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                }}
              >
                📥 Export as CSV
              </button>
              <button 
                className="export-btn"
                onClick={() => {
                  // Implement JSON export
                  const dataStr = JSON.stringify(sessions, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const a = document.createElement('a');
                  a.href = dataUri;
                  a.download = `evermind-session-history-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
              >
                📄 Export as JSON
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SessionHistoryPage;
