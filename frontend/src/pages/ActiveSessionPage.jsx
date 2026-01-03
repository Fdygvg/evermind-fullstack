// Enhanced ActiveSessionPage with Smart Review Integration and Session Resumption
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import { sessionService } from "../services/sessions";
import QuestionCard from "../components/Common/QuestionCard";
import FlashCard from "../components/Common/FlashCard";
import CodeBlock from "../components/Common/CodeBlock";
import SmartReviewWrapper from "../components/SmartReview/SmartReviewWrapper";
import RatingButtons from "../components/SmartReview/RatingButtons";

const ActiveSession = () => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState([]);
  const [isResuming, setIsResuming] = useState(false);
  const submittingQuestionIdRef = useRef(null);
  const isLoadingQuestionRef = useRef(false);
  const sessionStartTimeRef = useRef(null);
  const autoSaveIntervalRef = useRef(null);

  const { activeSession } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if Smart Review mode is enabled - read from location state first, then active session
  const isSmartReviewMode = location.state?.useSmartReview || activeSession?.useSmartReview || false;
  const sectionIds = location.state?.sectionIds || activeSession?.sectionIds || [];
  const cardMode = location.state?.cardMode || activeSession?.cardMode || 'normal';

  useEffect(() => {
    console.log("[SESSION] Active session:", {
      cardMode: activeSession?.cardMode,
      useSmartReview: activeSession?.useSmartReview,
      sectionIds: activeSession?.sectionIds
    });
  }, [activeSession]);

  const loadNextQuestion = useCallback(async () => {
    if (isLoadingQuestionRef.current) {
      console.log("[LOAD] Already loading question, skipping...");
      return;
    }

    isLoadingQuestionRef.current = true;
    setLoading(true);
    console.log("[LOAD] Starting to load next question...");

    try {
      console.log("[LOAD] Calling API: getNextQuestion()");
      const response = await sessionService.getNextQuestion();
      console.log("[LOAD] API Response received:", response);

      const { question, progress, completed } = response.data.data;

      if (completed) {
        console.log("[LOAD] Session completed, navigating to results");
        navigate("/session/results");
        isLoadingQuestionRef.current = false;
        setLoading(false);
        return;
      }

      console.log("[LOAD] New question received:", {
        id: question?._id,
        questionText: question?.question?.substring(0, 50) + "..."
      });
      console.log("[LOAD] Progress:", progress);

      setLoading(false);
      setCurrentQuestion(question);
      setSessionProgress(progress);
      setShowAnswer(false);
      setQuestionKey(prev => prev + 1);

      console.log("[LOAD] Question state updated successfully");
    } catch (error) {
      console.error("[LOAD] Failed to load question:", error);
      console.error("[LOAD] Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setLoading(false);
    } finally {
      isLoadingQuestionRef.current = false;
      console.log("[LOAD] Load operation completed");
    }
  }, [navigate]);

  // Check for session resumption
  useEffect(() => {
    const checkResume = () => {
      if (location.state?.resumeSession && location.state?.sessionData) {
        console.log('[RESUME] Resuming session from saved state');
        setIsResuming(true);
        const sessionData = location.state.sessionData;

        // Restore answered question IDs
        if (sessionData.progress?.answeredQuestionIds) {
          setAnsweredQuestionIds(sessionData.progress.answeredQuestionIds);
        }

        // Set session progress
        if (sessionData.progress) {
          setSessionProgress(sessionData.progress);
        }
      }
    };

    checkResume();
  }, [location.state]);

  // Load initial question on mount (only for non-Smart Review sessions)
  useEffect(() => {
    if (!isSmartReviewMode && !isResuming) {
      console.log("[INIT] Component mounted, loading initial question");
      sessionStartTimeRef.current = Date.now();
      loadNextQuestion();
    } else if (!isSmartReviewMode && isResuming) {
      console.log("[INIT] Resuming session, loading next question");
      sessionStartTimeRef.current = Date.now();
      loadNextQuestion();
      setIsResuming(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResuming]);

  // Timer: Update session time every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (sessionStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
        setSessionTime(elapsed);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-save progress every 30 seconds and on unmount
  useEffect(() => {
    const saveProgress = async () => {
      if (!isSmartReviewMode && sessionProgress && activeSession) {
        try {
          console.log('[AUTO-SAVE] Saving progress...');
          await sessionService.updateProgress({
            currentIndex: sessionProgress.currentQuestionIndex || 0,
            answeredQuestionIds: answeredQuestionIds,
            status: 'active'
          });
          console.log('[AUTO-SAVE] Progress saved successfully');
        } catch (error) {
          console.error('[AUTO-SAVE] Failed to save progress:', error);
        }
      }
    };

    // Set up auto-save interval (every 30 seconds)
    autoSaveIntervalRef.current = setInterval(saveProgress, 30000);

    // Save on unmount (auto-pause)
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }

      // Auto-pause on unmount
      if (!isSmartReviewMode && sessionProgress && activeSession) {
        sessionService.pauseSession().catch(err => {
          console.error('[AUTO-PAUSE] Failed to pause session:', err);
        });
      }
    };
  }, [isSmartReviewMode, sessionProgress, answeredQuestionIds, activeSession]);

  // Reset submission flag when question changes
  useEffect(() => {
    if (currentQuestion?._id) {
      console.log("[STATE] Question changed to:", currentQuestion._id);
      submittingQuestionIdRef.current = null;
      console.log("[STATE] Submission flag reset");
    }
  }, [currentQuestion?._id]);

  const submitAnswer = useCallback(async (responseType) => {
    console.log("[SUBMIT] submitAnswer called with:", responseType);

    if (!currentQuestion?._id || loading) {
      console.log("[SUBMIT] ERROR: No current question or already loading, cannot submit");
      return;
    }

    const questionId = currentQuestion._id;
    console.log("[SUBMIT] Current question ID:", questionId);

    if (submittingQuestionIdRef.current === questionId) {
      console.log("[SUBMIT] BLOCKED: Already submitting for this question:", questionId);
      return;
    }

    submittingQuestionIdRef.current = questionId;
    console.log("[SUBMIT] Marked question as submitting:", questionId);

    console.log("[SUBMIT] Hiding answer section");
    setShowAnswer(false);
    setLoading(true);

    try {
      console.log("[SUBMIT] Submitting answer to backend first...");
      await sessionService.submitAnswer({
        questionId,
        responseType,
      });
      console.log("[SUBMIT] Answer submitted successfully");

      // Track answered question
      setAnsweredQuestionIds(prev => [...prev, questionId]);

      if (responseType === 'easy') {
        setCurrentStreak(prev => prev + 1);
      } else {
        setCurrentStreak(0);
      }

      console.log("[SUBMIT] Loading next question...");
      await loadNextQuestion();
    } catch (error) {
      console.error("[SUBMIT] Failed to submit answer:", error);
      console.error("[SUBMIT] Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      submittingQuestionIdRef.current = null;
      setLoading(false);
      console.log("[SUBMIT] Reset submission flag after error");
    }
  }, [currentQuestion, loadNextQuestion, loading]);



  const endSession = async () => {
    if (window.confirm("Are you sure you want to end this session?")) {
      try {
        await sessionService.endSession();
        navigate("/dashboard");
      } catch (error) {
        console.error("Failed to end session:", error);
      }
    }
  };

  // Smart Review Mode: Render with SmartReviewWrapper
  if (isSmartReviewMode) {
    return (
      <SmartReviewWrapper
        sectionIds={sectionIds}
        enableSmartReview={true}
        showDailyCounter={true}
        showAddMore={true}
      >
        {({ currentQuestion: smartQuestion, rateQuestion, isLoading, isSessionComplete, canUndo, undoLastRating, ratingHistory, reviewedToday, initialQuestionCount }) => {
          if (isSessionComplete) {
            // Calculate stats from rating history
            const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            (ratingHistory || []).forEach(r => {
              if (ratingBreakdown[r.rating] !== undefined) {
                ratingBreakdown[r.rating]++;
              }
            });

            // Navigate to results page with stats
            navigate("/session/results", {
              state: {
                mode: 'smart-review',
                ratingBreakdown,
                totalQuestions: initialQuestionCount || reviewedToday,
                reviewedCount: reviewedToday,
                sessionTime: sessionTime,
                cardMode: cardMode,
                fromSession: true
              }
            });
            return null;
          }

          if (!smartQuestion) {
            return <div className="loading">Loading Smart Review questions...</div>;
          }

          return (
            <div className="active-session smart-review-mode">
              {/* Progress Bar */}
              <div className="session-header">

                <div className="session-controls-header">
                  {canUndo && (
                    <button className="undo-btn" onClick={undoLastRating}>
                      ↶ Undo Last Rating
                    </button>
                  )}
                  <button className="pause-session-btn">
                    ⏸ Pause
                  </button>
                  <button className="end-session-btn" onClick={endSession}>
                    End Session
                  </button>
                </div>
              </div>

              {/* Question Display */}
              <div className="question-card-wrapper">
                {cardMode === "flashcard" ? (
                  <FlashCard
                    key={`${smartQuestion._id}-${questionKey}`}
                    question={smartQuestion.question}
                    answer={smartQuestion.answer}
                    questionNumber={1}
                    totalQuestions={100}
                    onAnswer={submitAnswer}
                    isCode={smartQuestion.isCode}
                    CodeBlock={CodeBlock}
                    disabled={isLoading}
                    showHint={true}
                    compact={false}
                    useSmartReview={true}
                    onRate={rateQuestion}
                  />
                ) : (
                  <>
                    <QuestionCard
                      key={`${smartQuestion._id}-${questionKey}`}
                      currentQuestion={smartQuestion}
                      showAnswer={showAnswer}
                      setShowAnswer={setShowAnswer}
                      submitAnswer={submitAnswer}
                      loading={isLoading}
                    />

                    {/* Smart Review Rating Buttons */}
                    {showAnswer && (
                      <RatingButtons
                        onRate={rateQuestion}
                        disabled={isLoading}
                        compact={false}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Session Info */}
              <div className="session-info">
                <div className="mode-badge smart-review-badge">
                  🧠 Smart Review Mode
                  {cardMode === "flashcard" && " • Flashcard"}
                </div>
              </div>


            </div>
          );
        }}
      </SmartReviewWrapper>
    );
  }

  // Legacy Mode: Original session behavior
  if (!currentQuestion) {
    return <div className="loading">Loading question...</div>;
  }

  return (
    <div className="active-session">

      {/* Question Card with Swipe Overlay or FlashCard */}
      <div className="question-card-wrapper" style={{ position: "relative" }}>
        {cardMode === "flashcard" ? (
          <FlashCard
            key={`${currentQuestion._id}-${questionKey}`}
            question={currentQuestion.question}
            answer={currentQuestion.answer}
            questionNumber={sessionProgress?.total - sessionProgress?.remaining + 1 || 1}
            totalQuestions={activeSession?.totalQuestions || sessionProgress?.total || 0}
            onAnswer={submitAnswer}
            isCode={currentQuestion.isCode}
            CodeBlock={CodeBlock}
            disabled={loading}
            showHint={true}
            compact={false}
            useSmartReview={false}
          />
        ) : (
          <QuestionCard
            key={`${currentQuestion._id}-${questionKey}`}
            currentQuestion={currentQuestion}
            showAnswer={showAnswer}
            setShowAnswer={setShowAnswer}
            submitAnswer={submitAnswer}
            loading={loading}
          />
        )}
      </div>

      {/* Session Info */}
      <div className="session-info">
        <div className="mode-badge">
          Card Style: {cardMode === "flashcard" ? "Flashcard" : "Normal"}
        </div>
        <div className="progress-numbers">
          Correct: {sessionProgress?.correct} | Wrong: {sessionProgress?.wrong}
        </div>
      </div>


    </div>
  );
};

export default ActiveSession;
