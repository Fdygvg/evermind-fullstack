import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/auth";
import { statsService } from "../services/stats";
import { sectionService } from "../services/sections";
import { sessionService } from "../services/sessions";
import SearchBar from "../components/Common/SearchBar";

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user);
  const [stats, setStats] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [profileResponse, statsResponse, sectionResponse] =
          await Promise.all([
            authService.getProfile(),
            statsService.getOverview(),
            sectionService.getSections(),
          ]);

        setProfile(profileResponse.data.data.user);
        setStats(statsResponse.data.data.stats);
        setSections(sectionResponse.data.data.sections || []);

        try {
          const sessionResponse = await sessionService.getCurrentSession();
          setActiveSession(sessionResponse.data.data.session);
        } catch (sessionError) {
          if (sessionError.response?.status !== 404) {
            console.error(sessionError);
          }
          setActiveSession(null);
        }
      } catch (dashboardError) {
        console.error("Dashboard load error:", dashboardError);
        setError(
          "We could not load your dashboard. Please refresh to try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">Synchronizing your EVERMIND data...</div>
    );
  }

  const highlightSections = sections.slice(0, 4);
  const completedQuestions = activeSession
    ? activeSession.progress.total - activeSession.progress.remaining
    : 0;
  const progressMax = activeSession
    ? Math.max(activeSession.progress.total, 1)
    : 1;
  const progressPercent =
    activeSession && activeSession.progress.total > 0
      ? Math.round((completedQuestions / activeSession.progress.total) * 100)
      : 0;

  return (
    <div className="dashboard-page">
      {error && <div className="dashboard-error">{error}</div>}
      <section>
        <SearchBar />
      </section>
      <section className="dashboard-hero">
        <span>Good to see you, {profile?.username || profile?.email} 👋</span>
        <h1>Your spaced repetition HQ</h1>
        <p>
          EVERMIND keeps every section, every review mode, and every streak
          aligned so you can retain more with less stress. Dive back into your
          session or explore a fresh focus area.
        </p>
        <div className="dashboard-cta-group">
          <button
            type="button"
            className="dashboard-button primary"
            onClick={() => navigate("/session/review")}
          >
            Resume learning
          </button>

          <button
            type="button"
            className="dashboard-button secondary"
            onClick={() => navigate("/sections")}
          >
            Manage sections
          </button>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="stat-card">
          <span>Current streak</span>
          <strong>{stats?.currentStreak || 0} days</strong>
          <div className="stat-trend">
            Longest streak: {stats?.longestStreak || 0} days
          </div>
        </div>
        <div className="stat-card">
          <span>Sessions completed</span>
          <strong>{stats?.totalSessions || 0}</strong>
          <div className="stat-trend">
            {stats?.totalQuestionsReviewed || 0} questions reviewed
          </div>
        </div>
        <div className="stat-card">
          <span>Accuracy</span>
          <strong>{stats?.accuracy || 0}%</strong>
          <div className="stat-trend">
            {stats?.totalCorrectAnswers || 0} correct answers all-time
          </div>
        </div>
        <div className="stat-card">
          <span>Time invested</span>
          <strong>{stats?.totalTimeSpent || 0} mins</strong>
          <div className="stat-trend">
            ~{stats?.averageTimePerSession || 0} mins per session
          </div>
        </div>
      </section>
      <section>
        <div className="nav-buttons-container">
          <button
            className={`nav-btn ${
              location.pathname === "/questions/add" ? "active" : ""
            }`}
            onClick={() => navigate("/questions/add")}
          >
            + Add Question
          </button>
          <button
            className={`nav-btn ${
              location.pathname === "/analytics" ? "active" : ""
            }`}
            onClick={() => navigate("/analytics")}
          >
            📊 Analytics
          </button>

          <button
            className={`nav-btn ${
              location.pathname === "/history" ? "active" : ""
            }`}
            onClick={() => navigate("/history")}
          >
            📅 Session History
          </button>
        </div>
      </section>
      <section className="dashboard-section">
        <header>
          <h2>
            {activeSession
              ? "Active review session"
              : "Create a new review session"}
          </h2>
          <button type="button" className="dashboard-button secondary">
            View history
          </button>
        </header>
        <div className="session-card">
          {activeSession ? (
            <>
              <div className="session-meta">
                <span>Mode: {activeSession.mode}</span>
                <span>
                  Questions: {completedQuestions}/{activeSession.progress.total}
                </span>
                <span>Correct: {activeSession.progress.correct}</span>
                <span>Wrong: {activeSession.progress.wrong}</span>
              </div>
              <div className="progress-row">
                <progress
                  className="progress-meter"
                  max={progressMax}
                  value={completedQuestions}
                />
                <span>{progressPercent}% complete</span>
              </div>
            </>
          ) : (
            <p>
              You do not have an active review session. Pick a couple of
              sections and start a new run to keep the momentum going.
            </p>
          )}
        </div>
      </section>

      <section className="dashboard-section">
        <header>
          <h2>Your sections</h2>
          <button type="button" className="dashboard-button secondary">
            Create section
          </button>
        </header>
        {highlightSections.length > 0 ? (
          <div className="section-list">
            {highlightSections.map((section) => (
              <article key={section._id} className="section-card">
                <div>
                  <h3>{section.name}</h3>
                  <p>{section.description || "No description yet"}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>
            You have not created any sections yet. Start by defining a topic you
            want to master.
          </p>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
