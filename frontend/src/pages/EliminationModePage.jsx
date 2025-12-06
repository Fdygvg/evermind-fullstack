import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Filter, Home, Flame } from "lucide-react";
import { useSession } from "../hooks/useSession";
import { questionService } from "../services/question";
import EliminationQuestionCard from "../components/Elimination/EliminationQuestionCard";
import EliminatedList from "../components/Elimination/EliminatedList";

const EliminationModePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  useSession(); // Initialize session context
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [eliminatedQuestions, setEliminatedQuestions] = useState([]);
  const [partialQuestions, setPartialQuestions] = useState([]); // Questions marked as "Kinda"
  const [currentStreak, setCurrentStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [hideEliminated, setHideEliminated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sessionTime, setSessionTime] = useState(0);

  // Get questions from route state or fetch
  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);

      try {
        // Option 1: Questions passed via navigation state
        if (location.state?.questions) {
          setQuestions(location.state.questions);
          setFilteredQuestions(location.state.questions);
        }
        // Option 2: Fetch from selected sections
        else if (location.state?.sectionIds && location.state.sectionIds.length > 0) {
          const response = await questionService.getQuestions({
            sectionId: location.state.sectionIds.join(',')
          });
          const questions = response.data.data?.questions || response.data.data || [];
          setQuestions(questions);
          setFilteredQuestions(questions);
        }
        // Option 3: Get all user questions
        else {
          const response = await questionService.getQuestions();
          const questions = response.data.data?.questions || response.data.data || [];
          setQuestions(questions);
          setFilteredQuestions(questions);
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        // Handle error - could show error message to user
        setQuestions([]);
        setFilteredQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [location]);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle question elimination with different levels
  const handleQuestionAction = (questionId, action) => {
    const question = filteredQuestions.find((q) => q._id === questionId);
    if (!question) return;

    // Remove revealed state
    const newRevealed = { ...revealedAnswers };
    delete newRevealed[questionId];
    setRevealedAnswers(newRevealed);

    if (action === "know") {
      // Full elimination - I know it perfectly
      setEliminatedQuestions((prev) => [...prev, question]);
      setFilteredQuestions((prev) => prev.filter((q) => q._id !== questionId));
      setCorrectCount((prev) => prev + 1);
      setCurrentStreak((prev) => prev + 1);
    } else if (action === "kinda") {
      // Partial elimination - Kinda know it
      setPartialQuestions((prev) => [...prev, question]);
      setFilteredQuestions((prev) => prev.filter((q) => q._id !== questionId));
      setCorrectCount((prev) => prev + 1);
      setCurrentStreak((prev) => prev + 1);
    } else if (action === "dont-know") {
      // Don't know - keep reviewing, but mark as wrong
      setWrongCount((prev) => prev + 1);
      setCurrentStreak(0); // Break streak
    }
  };

  // Toggle answer visibility
  const toggleAnswer = (questionId) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Reset a question (bring back)
  const resetQuestion = (questionId) => {
    // Check if in eliminated list
    const eliminatedQuestion = eliminatedQuestions.find(
      (q) => q._id === questionId
    );
    if (eliminatedQuestion) {
      setEliminatedQuestions((prev) =>
        prev.filter((q) => q._id !== questionId)
      );
      setFilteredQuestions((prev) => [...prev, eliminatedQuestion]);
      setCorrectCount((prev) => Math.max(0, prev - 1));
      setCurrentStreak(0); // Break streak on reset
      return;
    }

    // Check if in partial list
    const partialQuestion = partialQuestions.find((q) => q._id === questionId);
    if (partialQuestion) {
      setPartialQuestions((prev) => prev.filter((q) => q._id !== questionId));
      setFilteredQuestions((prev) => [...prev, partialQuestion]);
      setCorrectCount((prev) => Math.max(0, prev - 1));
      setCurrentStreak(0); // Break streak on reset
    }
  };

  // End session
  const endSession = async () => {
    const sessionData = {
      mode: "elimination",
      questionsTotal: questions?.length ?? 0,
      questionsEliminated: eliminatedQuestions?.length ?? 0,
      questionsPartial: partialQuestions?.length ?? 0,
      correctCount,
      wrongCount,
      streak: currentStreak,
      timeSpent: sessionTime,
      endedAt: new Date(),
    };

    // Save session results
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionData),
    });

    navigate("/dashboard", {
      state: {
        showCelebration: true,
        eliminationResults: sessionData,
      },
    });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading questions for Elimination Mode...</p>
      </div>
    );
  }

  return (
    <div className="elimination-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-left">
          <button
            className="nav-btn"
            onClick={() => navigate("/dashboard")}
            title="Back to Dashboard"
          >
            <Home size={20} />
          </button>
          <h1>Elimination Mode</h1>
        </div>

        <div className="header-right">
          <button
            className={`filter-btn ${hideEliminated ? "active" : ""}`}
            onClick={() => setHideEliminated(!hideEliminated)}
            title={
              hideEliminated
                ? "Show eliminated questions"
                : "Hide eliminated questions"
            }
          >
            <Filter size={20} />
            <span>{hideEliminated ? "Showing" : "Hiding"} Eliminated</span>
          </button>
        </div>
      </header>

      {/* Questions List */}
      <div className="questions-container">
        {(filteredQuestions?.length ?? 0) === 0 &&
        (questions?.length ?? 0) > 0 ? (
          <div className="session-complete">
            <div className="celebration">
              <h2>🎉 ELIMINATION COMPLETE!</h2>
              <p>You eliminated all {questions?.length ?? 0} questions!</p>
              <div className="stats">
                <div className="stat-card">
                  <span className="stat-value">{questions?.length ?? 0}</span>
                  <span className="stat-label">Total Questions</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">
                    {Math.floor(sessionTime / 60)}:
                    {String(sessionTime % 60).padStart(2, "0")}
                  </span>
                  <span className="stat-label">Time</span>
                </div>
              </div>
              <button className="end-btn" onClick={endSession}>
                End Session
              </button>
            </div>
          </div>
        ) : (
          <div className="questions-list">
            {(filteredQuestions || []).map((question, index) => (
              <EliminationQuestionCard
                key={question._id}
                question={question}
                index={index}
                isRevealed={revealedAnswers[question._id] || false}
                onToggleAnswer={() => toggleAnswer(question._id)}
                onAction={(action) =>
                  handleQuestionAction(question._id, action)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Eliminated Questions (if not hidden) */}
      {!hideEliminated && (
        <EliminatedList
          eliminatedQuestions={eliminatedQuestions}
          partialQuestions={partialQuestions}
          onReset={resetQuestion}
        />
      )}

      {/* Session Controls */}
      <div className="session-controls">
        <button
          className="control-btn end-session-btn"
          onClick={endSession}
          disabled={(filteredQuestions?.length ?? 0) > 0}
        >
          End Session
        </button>
      </div>
    </div>
  );
};

export default EliminationModePage;
