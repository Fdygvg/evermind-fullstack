// Enhanced EliminationModePage with Smart Review Integration
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Filter, Home } from "lucide-react";
import { useSession } from "../hooks/useSession";
import { questionService } from "../services/question";
import { sectionService } from "../services/sections";
import EliminationQuestionCard from "../components/Elimination/EliminationQuestionCard";
import SmartReviewWrapper from "../components/SmartReview/SmartReviewWrapper";
import SectionProgressDisplay from "../components/SmartReview/SectionProgressDisplay";
import RecentRatingsQueue from "../components/SmartReview/RecentRatingsQueue";

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

  // Check if using Smart Review mode
  const isSmartReviewMode = location.state?.useSmartReview !== false; // Default to true
  const [sectionIds, setSectionIds] = useState(
    location.state?.sectionIds || []
  );

  // Load sections if none provided (for Smart Review mode)
  useEffect(() => {
    const loadSections = async () => {
      if (sectionIds.length === 0 && isSmartReviewMode) {
        try {
          const response = await sectionService.getSections();
          const sections = response.data?.data || response.data || [];
          const ids = sections.map((s) => s._id);
          console.log("[Elimination] Loaded sections for Smart Review:", ids);
          setSectionIds(ids);
        } catch (error) {
          console.error("[Elimination] Error loading sections:", error);
        }
      }
    };
    loadSections();
  }, [isSmartReviewMode, sectionIds.length]);

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
        } else if (
          location.state?.sectionIds &&
          location.state.sectionIds.length > 0
        ) {
          const response = await questionService.getQuestions({
            sectionId: location.state.sectionIds.join(","),
          });
          const questions =
            response.data.data?.questions || response.data.data || [];
          setQuestions(questions);
          setFilteredQuestions(questions);
        } else {
          const response = await questionService.getQuestions();
          const questions =
            response.data.data?.questions || response.data.data || [];
          setQuestions(questions);
          setFilteredQuestions(questions);
        }
      } catch (error) {
        console.error("Error loading questions:", error);
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
  const handleQuestionAction = useCallback(
    (questionId, action) => {
      const question = filteredQuestions.find((q) => q._id === questionId);
      if (!question) return;

      // Remove revealed state
      const newRevealed = { ...revealedAnswers };
      delete newRevealed[questionId];
      setRevealedAnswers(newRevealed);

      if (action === "know") {
        // Full elimination - I know it perfectly
        setEliminatedQuestions((prev) => [...prev, question]);
        setFilteredQuestions((prev) =>
          prev.filter((q) => q._id !== questionId)
        );
        setCorrectCount((prev) => prev + 1);
        setCurrentStreak((prev) => prev + 1);
      } else if (action === "kinda") {
        // Partial elimination - Kinda know it
        setPartialQuestions((prev) => [...prev, question]);
        setFilteredQuestions((prev) =>
          prev.filter((q) => q._id !== questionId)
        );
        setCorrectCount((prev) => prev + 1);
        setCurrentStreak((prev) => prev + 1);
      } else if (action === "dont-know") {
        // Don't know - keep reviewing, but mark as wrong
        setWrongCount((prev) => prev + 1);
        setCurrentStreak(0);

        // Fix: Reset revealed state so it closes when moved/recycled
        setRevealedAnswers((prev) => {
          const newState = { ...prev };
          delete newState[questionId];
          return newState;
        });
      }
    },
    [filteredQuestions, revealedAnswers]
  );

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
        mode="elimination"
        resumeData={
          location.state?.resumeSession
            ? location.state?.sessionData?.smartReviewState
            : null
        }
      >
        {({
          todaysQuestions,
          rateQuestion,
          isLoading,
          isSessionComplete,
          canUndo,
          undoLastRating,
          sectionProgress,
          ratingHistory,
          reviewedToday,
          initialQuestionCount,
          SwipeZoneContainer,
          updateQuestionInSession,
        }) => {
          console.log("[EliminationMode] SmartReviewWrapper props:", {
            todaysQuestions,
            todaysQuestionsLength: todaysQuestions?.length,
            isLoading,
            isSessionComplete,
            sectionProgress,
          });

          // Check completion first (before checking if questions array is empty)
          if (isSessionComplete) {
            // Calculate stats from rating history
            const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            (ratingHistory || []).forEach((r) => {
              if (ratingBreakdown[r.rating] !== undefined) {
                ratingBreakdown[r.rating]++;
              }
            });

            // Navigate to results page with stats
            navigate("/session/results", {
              state: {
                mode: "elimination",
                ratingBreakdown,
                totalQuestions: initialQuestionCount || reviewedToday,
                reviewedCount: reviewedToday,
                sessionTime: sessionTime,
                cardMode: "elimination",
                fromSession: true,
              },
            });
            return null;
          }

          // Show loading only during initial load
          if (isLoading && (!todaysQuestions || todaysQuestions.length === 0)) {
            return (
              <div className="loading">Loading Smart Review questions...</div>
            );
          }

          // If no questions and not loading, show message
          if (!todaysQuestions || todaysQuestions.length === 0) {
            console.log("[EliminationMode] No questions available!");
            return (
              <div className="no-questions">
                <p>No questions available for review.</p>
                <button onClick={() => navigate("/dashboard")}>
                  Back to Dashboard
                </button>
              </div>
            );
          }

          return (
            <div className="elimination-page smart-review-mode">
              <header className="page-header">
                <div className="header-left"></div>

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

              <RecentRatingsQueue ratingHistory={ratingHistory} />

              <div className="questions-container">
                <div className="questions-list">
                  {todaysQuestions.map((question, index) => {
                    const handleEliminationRate = (rating, qId) => {
                      console.log(`[Elimination] Rate on ${qId}: ${rating}`);

                      // DECAY LOGIC: User has mastered or found it easy. Wipe the annotation.
                      if (rating >= 4) {
                        localStorage.removeItem(`annotation_${qId}`);
                      }

                      rateQuestion(rating, qId);
                      // Close the card so it resets if recycled
                      setRevealedAnswers((prev) => {
                        const newState = { ...prev };
                        delete newState[qId];
                        return newState;
                      });
                    };

                    return (
                      <div
                        key={question._id}
                        className="elimination-card-wrapper"
                        style={{ marginBottom: "1rem" }}
                      >
                        {SwipeZoneContainer ? (
                          <SwipeZoneContainer
                            // Key is crucial for localized state
                            key={question._id}
                            onRate={(rating) => {
                              handleEliminationRate(rating, question._id);
                            }}
                            disabled={false} // Allow independent swiping
                            swipeThreshold={200}
                          >
                            <EliminationQuestionCard
                              question={question}
                              index={index}
                              isRevealed={
                                revealedAnswers[question._id] || false
                              }
                              onToggleAnswer={() => toggleAnswer(question._id)}
                              rateQuestion={(rating) =>
                                handleEliminationRate(rating, question._id)
                              }
                              disabled={false}
                              onQuestionUpdated={updateQuestionInSession}
                            />
                          </SwipeZoneContainer>
                        ) : (
                          <EliminationQuestionCard
                            question={question}
                            index={index}
                            isRevealed={revealedAnswers[question._id] || false}
                            onToggleAnswer={() => toggleAnswer(question._id)}
                            rateQuestion={(rating) =>
                              handleEliminationRate(rating, question._id)
                            }
                            disabled={false}
                            onQuestionUpdated={updateQuestionInSession}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
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
    </div>
  );
};

export default EliminationModePage;
