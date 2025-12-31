// Enhanced EliminationModePage with Smart Review Integration
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Filter, Home } from "lucide-react";
import { useSession } from "../hooks/useSession";
import { questionService } from "../services/question";
import { sectionService } from "../services/sections";
import EliminationQuestionCard from "../components/Elimination/EliminationQuestionCard";
import EliminatedList from "../components/Elimination/EliminatedList";
import SmartReviewWrapper from "../components/SmartReview/SmartReviewWrapper";
import RatingButtons from "../components/SmartReview/RatingButtons";
import SectionProgressDisplay from "../components/SmartReview/SectionProgressDisplay";

const EliminationModePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  useSession();

  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [eliminatedQuestions, setEliminatedQuestions] = useState([]);
  const [partialQuestions, setPartialQuestions] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [revealedAnswers, setRevealedAnswers] = useState({});
  const [hideEliminated, setHideEliminated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentQuestionForRating, setCurrentQuestionForRating] = useState(null);

  // Check if using Smart Review mode
  const isSmartReviewMode = location.state?.useSmartReview !== false; // Default to true
  const [sectionIds, setSectionIds] = useState(location.state?.sectionIds || []);

  // Load sections if none provided (for Smart Review mode)
  useEffect(() => {
    const loadSections = async () => {
      if (sectionIds.length === 0 && isSmartReviewMode) {
        try {
          const response = await sectionService.getSections();
          const sections = response.data?.data || response.data || [];
          const ids = sections.map(s => s._id);
          console.log('[Elimination] Loaded sections for Smart Review:', ids);
          setSectionIds(ids);
        } catch (error) {
          console.error('[Elimination] Error loading sections:', error);
        }
      }
    };
    loadSections();
  }, [isSmartReviewMode]);

  // Get questions from route state or fetch
  useEffect(() => {
    const loadQuestions = async () => {
      // If Smart Review mode, questions will be loaded by SmartReviewWrapper
      if (isSmartReviewMode) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        if (location.state?.questions) {
          setQuestions(location.state.questions);
          setFilteredQuestions(location.state.questions);
        }
        else if (location.state?.sectionIds && location.state.sectionIds.length > 0) {
          const response = await questionService.getQuestions({
            sectionId: location.state.sectionIds.join(',')
          });
          const questions = response.data.data?.questions || response.data.data || [];
          setQuestions(questions);
          setFilteredQuestions(questions);
        }
        else {
          const response = await questionService.getQuestions();
          const questions = response.data.data?.questions || response.data.data || [];
          setQuestions(questions);
          setFilteredQuestions(questions);
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        setQuestions([]);
        setFilteredQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [location, isSmartReviewMode]);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle question elimination with different levels
  const handleQuestionAction = useCallback((questionId, action) => {
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

      // If Smart Review, show rating buttons
      if (isSmartReviewMode) {
        setCurrentQuestionForRating(question);
      }
    } else if (action === "kinda") {
      // Partial elimination - Kinda know it
      setPartialQuestions((prev) => [...prev, question]);
      setFilteredQuestions((prev) => prev.filter((q) => q._id !== questionId));
      setCorrectCount((prev) => prev + 1);
      setCurrentStreak((prev) => prev + 1);

      // If Smart Review, show rating buttons
      if (isSmartReviewMode) {
        setCurrentQuestionForRating(question);
      }
    } else if (action === "dont-know") {
      // Don't know - keep reviewing, but mark as wrong
      setWrongCount((prev) => prev + 1);
      setCurrentStreak(0);
    }
  }, [filteredQuestions, revealedAnswers, isSmartReviewMode]);

  // Toggle answer visibility
  const toggleAnswer = (questionId) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Reset a question (bring back)
  const resetQuestion = (questionId) => {
    const eliminatedQuestion = eliminatedQuestions.find(
      (q) => q._id === questionId
    );
    if (eliminatedQuestion) {
      setEliminatedQuestions((prev) =>
        prev.filter((q) => q._id !== questionId)
      );
      setFilteredQuestions((prev) => [...prev, eliminatedQuestion]);
      setCorrectCount((prev) => Math.max(0, prev - 1));
      setCurrentStreak(0);
      return;
    }

    const partialQuestion = partialQuestions.find((q) => q._id === questionId);
    if (partialQuestion) {
      setPartialQuestions((prev) => prev.filter((q) => q._id !== questionId));
      setFilteredQuestions((prev) => [...prev, partialQuestion]);
      setCorrectCount((prev) => Math.max(0, prev - 1));
      setCurrentStreak(0);
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

  // Smart Review Mode Rendering
  if (isSmartReviewMode) {
    return (
      <SmartReviewWrapper
        sectionIds={sectionIds}
        enableSmartReview={true}
        showDailyCounter={true}
        showAddMore={true}
      >
        {({ currentQuestion, rateQuestion, isLoading, isSessionComplete, canUndo, undoLastRating, reviewedToday, dailyLimit, sectionProgress }) => {
          if (isSessionComplete) {
            return (
              <div className="session-complete">
                <h2>🎉 Smart Review Complete!</h2>
                <p>Great job completing today's elimination review!</p>
                <button onClick={endSession}>End Session</button>
              </div>
            );
          }

          if (!currentQuestion) {
            return <div className="loading">Loading Smart Review questions...</div>;
          }

          return (
            <div className="elimination-page smart-review-mode">
              <header className="page-header">
                <div className="header-left">
                  <button
                    className="nav-btn"
                    onClick={() => navigate("/dashboard")}
                    title="Back to Dashboard"
                  >
                    <Home size={20} />
                  </button>
                  <h1>🧠 Smart Review • Elimination Mode</h1>
                </div>

                <div className="header-right">
                  {canUndo && (
                    <button className="undo-btn" onClick={undoLastRating}>
                      ↶ Undo
                    </button>
                  )}
                </div>
              </header>

              {/* Section Progress Display */}
              <SectionProgressDisplay sectionProgress={sectionProgress} />

              <div className="questions-container">
                <EliminationQuestionCard
                  question={currentQuestion}
                  index={0}
                  isRevealed={revealedAnswers[currentQuestion._id] || false}
                  onToggleAnswer={() => toggleAnswer(currentQuestion._id)}
                  rateQuestion={rateQuestion}
                  isLoading={isLoading}
                  disabled={isLoading}
                />
                {/* Show rating buttons after elimination action */}
                {currentQuestionForRating && currentQuestionForRating._id === currentQuestion._id && (
                  <div className="elimination-rating-section">
                    <h3>How well do you know this?</h3>
                    <RatingButtons
                      onRate={async (rating) => {
                        await rateQuestion(rating);
                        setCurrentQuestionForRating(null);
                      }}
                      disabled={isLoading}
                      compact={false}
                    />
                  </div>
                )}
              </div>

              <div className="session-controls">
                <button
                  className="control-btn end-session-btn"
                  onClick={endSession}
                >
                  End Session
                </button>
              </div>
            </div>
          );
        }}
      </SmartReviewWrapper>
    );
  }

  // Legacy Elimination Mode (no Smart Review)
  return (
    <div className="elimination-page">
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

      {!hideEliminated && (
        <EliminatedList
          eliminatedQuestions={eliminatedQuestions}
          partialQuestions={partialQuestions}
          onReset={resetQuestion}
        />
      )}

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
