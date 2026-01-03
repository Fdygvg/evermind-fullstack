import React, { useState, useEffect } from 'react';
import { statsService } from '../services/stats';
import { sectionService } from '../services/sections.js';
import '../css/analyticsPage.css';

import { FaChartLine, FaFire, FaBookOpen, FaBullseye, FaClock, FaCheckCircle, FaTimesCircle, FaChartBar } from 'react-icons/fa';

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('30'); // days
  const [analytics, setAnalytics] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch detailed analytics
      const analyticsRes = await statsService.getAnalytics({ days: timeRange });
      const sectionsRes = await sectionService.getSections();

      setAnalytics(analyticsRes.data.data);
      setCategoryStats(sectionsRes.data.data.sections);

    } catch (error) {
      console.error('Analytics error:', error);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateStreakProgress = () => {
    if (!analytics?.sessionStats?.currentStreak) return 0;
    const streak = analytics.sessionStats.currentStreak;
    const longest = analytics.sessionStats.longestStreak || streak;
    return longest > 0 ? (streak / longest) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Crunching your numbers...</p>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1><FaChartBar /> Learning Analytics</h1>
        <p>Track your progress and performance</p>

        <div className="time-range-selector">
          <label>Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="range-select"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-icon"><FaFire /></div>
          <div className="stat-content">
            <h3>{analytics?.sessionStats?.currentStreak || 0}</h3>
            <p>Current Streak</p>
            <div className="streak-progress">
              <div
                className="progress-bar"
                style={{ width: `${calculateStreakProgress()}%` }}
              ></div>
            </div>
            <small>Best: {analytics?.sessionStats?.longestStreak || 0} days</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><FaBookOpen /></div>
          <div className="stat-content">
            <h3>{analytics?.sessionStats?.totalQuestions || 0}</h3>
            <p>Questions Reviewed</p>
            <small>{analytics?.sessionStats?.totalSessions || 0} sessions</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><FaBullseye /></div>
          <div className="stat-content">
            <h3>{analytics?.sessionStats?.accuracyFormatted || '0%'}</h3>
            <p>Average Accuracy</p>
            <small>{analytics?.sessionStats?.totalCorrect || 0} correct, {analytics?.sessionStats?.totalWrong || 0} wrong</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><FaClock /></div>
          <div className="stat-content">
            <h3>{analytics?.sessionStats?.totalTimeFormatted || '0 min'}</h3>
            <p>Total Time</p>
            <small>{analytics?.sessionStats?.avgTimePerSession || 0} min/session</small>
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="category-performance">
        <h2>Category Performance</h2>
        <div className="categories-grid">
          {categoryStats.map(category => {
            const catAnalytics = analytics?.categoryStats?.find(c => c._id === category._id);
            return (
              <div key={category._id} className="category-card">
                <div
                  className="category-color"
                  style={{ backgroundColor: category.color }}
                ></div>
                <div className="category-info">
                  <h4>{category.name}</h4>
                  <p>{category.questionCount || 0} questions</p>
                  {catAnalytics && (
                    <div className="category-stats">
                      <span className="accuracy">
                        Accuracy: {catAnalytics.accuracy ? `${Math.round(catAnalytics.accuracy)}%` : 'N/A'}
                      </span>
                      <div className="breakdown">
                        <span className="correct"><FaCheckCircle /> {catAnalytics.totalCorrect || 0}</span>
                        <span className="wrong"><FaTimesCircle /> {catAnalytics.totalWrong || 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="activity-timeline">
        <h2>Recent Activity</h2>
        <div className="timeline">
          {analytics?.recentSessions?.length > 0 ? (
            analytics.recentSessions.map((session, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-date">
                  {new Date(session.date).toLocaleDateString()}
                </div>
                <div className="timeline-content">
                  <div className="session-mode">{session.cardMode === 'flashcard' ? 'Flashcard' : 'Normal'} Style</div>
                  <div className="session-stats">
                    <span className="correct"><FaCheckCircle /> {session.correct}</span>
                    <span className="wrong"><FaTimesCircle /> {session.wrong}</span>
                    <span className="duration"><FaClock /> {session.duration}m</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-activity">No recent activity</p>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="insights-section">
        <h2><FaChartLine /> Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Best Performing Category</h4>
            {analytics?.categoryStats?.length > 0 ? (
              (() => {
                const bestCat = [...analytics.categoryStats]
                  .filter(c => c.accuracy)
                  .sort((a, b) => b.accuracy - a.accuracy)[0];
                const category = categoryStats.find(c => c._id === bestCat?._id);
                return category ? (
                  <>
                    <p className="insight-value">{category.name}</p>
                    <p className="insight-sub">{Math.round(bestCat.accuracy)}% accuracy</p>
                  </>
                ) : <p className="no-data">No data</p>;
              })()
            ) : <p className="no-data">No category data</p>}
          </div>

          <div className="insight-card">
            <h4>Average Session Duration</h4>
            <p className="insight-value">
              {analytics?.sessionStats?.avgTimePerSession || 0} minutes
            </p>
            <p className="insight-sub">Per review session</p>
          </div>

          <div className="insight-card">
            <h4>Consistency Score</h4>
            <p className="insight-value">
              {analytics?.sessionStats?.totalSessions > 0
                ? Math.min(100, Math.round((analytics.sessionStats.totalSessions / parseInt(timeRange)) * 100))
                : 0}%
            </p>
            <p className="insight-sub">Sessions per day</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;