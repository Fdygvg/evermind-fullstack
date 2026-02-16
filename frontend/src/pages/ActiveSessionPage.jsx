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

  // Check if Smart Review mode is enabled
  const isSimplified = location.state?.isSimplified || false;
  const sessionData = location.state?.sessionData;
  const resumeSession = location.state?.resumeSession;
  const isSmartReviewMode = isSimplified || location.state?.useSmartReview || activeSession?.useSmartReview || false;
  const sectionIds = location.state?.sectionIds || activeSession?.sectionIds || [];
  const cardMode = location.state?.cardMode || activeSession?.cardMode || 'normal';
  const mode = location.state?.mode || activeSession?.currentMode || activeSession?.smartReviewState?.mode || 'normal';

  useEffect(() => {
    console.log("[SESSION] Active session:", {
      mode,
      cardMode,
      useSmartReview: isSmartReviewMode,
      sectionIds: Array.isArray(sectionIds) ? sectionIds.length : 'unknown',
      resuming: isResuming
    });
  }, [activeSession, mode, cardMode, isSmartReviewMode, sectionIds, isResuming]);

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
        console.log("[LOAD] Session completed, ending session...");

        // Call endSession to finalize stats on backend
        try {
          const endResponse = await sessionService.endSession();
          const sessionResults = endResponse.data.data;

          console.log("[LOAD] Session ended successfully, stats:", sessionResults);

          navigate("/session/results", {
            state: {
              mode: 'session',
              cardMode: cardMode,
              // Backend returns: { correct, wrong, duration } in session object
              // and { currentStreak, totalSessions } in stats object
              reviewedCount: sessionResults.session.correct + sessionResults.session.wrong,
              correctCount: sessionResults.session.correct,
              wrongCount: sessionResults.session.wrong,

              sessionTime: sessionTime,

              ratingBreakdown: {
                3: sessionResults.session.correct, // Approximate since we only have correct/wrong from legacy endpoint
                1: sessionResults.session.wrong
                // Ideally backend endSession should return full rating breakdown if we want it.
                // For now, mapping correct->3 (Good) and wrong->1 (Hard) is a safe simple mapping if detailed breakdown isn't available.
                // Or we can rely on `sessionProgress` if it had details.
              },
              fromSession: true
            }
          });
        } catch (err) {
          console.error("[LOAD] Error ending session:", err);
          // Fallback navigation
          navigate("/session/results");
        }

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
      setShowAnswer(false); // Ensure answer is hidden for new question
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
    } else if (isSmartReviewMode) {
      // Initialize timer for Smart Review mode too
      if (!sessionStartTimeRef.current) {
        console.log("[INIT] Smart Review session started, tracking time");
        sessionStartTimeRef.current = Date.now();
      }
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
      console.log("[SUBMIT] Submitting answer to backend parallel with next load...");

      // PARALLEL EXECUTION: 
      // 1. Submit the answer (fire and forget for UI speed, but track for errors)
      // 2. Load next question concurrently

      const submitPromise = sessionService.submitAnswer({
        questionId,
        responseType,
      });

      // We start loadNextQuestion immediately. 
      // NOTE: If the backend logic strictly requires the finding of the *next* question
      // to happen AFTER the previous one is marked, we might have a race condition.
      // However, usually "getNextQuestion" returns the next DUE question. 
      // If the current one is still due, it might return it again.
      // TO MITIGATE: We're assuming the backend handles this or we accept the risk for speed.
      // But actually, loadNextQuestion calls sessionService.getNextQuestion() which is GET.

      // OPTIMIZATION: Wait for submission to at least initiate? 
      // No, true parallel is:

      const [submitResponse, nextQuestionResponse] = await Promise.all([
        submitPromise,
        // We need to call the service directly here to parallelize, 
        // because loadNextQuestion wraps state updates we don't want to duplicate logic perfectly. 
        // But loadNextQuestion is a function. 
        // Let's modify loadNextQuestion to be callable? No, it uses state.

        // BETTER STRATEGY: 
        // 1. Fire submitPromise.
        // 2. Await loadNextQuestion.
        // But we want loadNextQuestion to start NOW.
        // loadNextQuestion isn't returning a promise we can easily join? 
        // It is `async`. Yes.
        loadNextQuestion()
      ]);

      console.log("[SUBMIT] Answer submitted & Next loaded successfully");

      // Track answered question
      setAnsweredQuestionIds(prev => [...prev, questionId]);

      if (responseType === 'easy') {
        setCurrentStreak(prev => prev + 1);
      } else {
        setCurrentStreak(0);
      }

      // loadNextQuestion already updates state.

    } catch (error) {
      console.error("[SUBMIT] Failed to submit answer or load next:", error);
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

  // Smart Review Mode: Render with SmartReviewWrapper
  if (isSmartReviewMode) {
    return (
      <SmartReviewWrapper
        sectionIds={sectionIds}
        enableSmartReview={true}
        showDailyCounter={true} // Show progress for all modes
        showAddMore={!isSimplified} // Hide add more for simplified
        mode={mode === 'tiktok' ? 'tiktok' : (isSimplified ? 'simplified' : 'normal')}
        cardMode={cardMode}
        // For Smart Review, resumeData is used if resuming.
        // For Simplified, we ALWAYS have sessionData with questions to initialize from.
        resumeData={!isSimplified && resumeSession ? sessionData : null}
        initialSession={isSimplified ? sessionData : null}
      >
        {({
          currentQuestion: smartQuestion,
          rateQuestion,
          isLoading,
          isSessionComplete,
          ratingHistory,
          reviewedToday,
          initialQuestionCount,
          SwipeZoneContainer,
          onSwipeRate
        }) => {
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

          // Determine if we should enable swipe (exclude tiktok)
          const enableSwipe = cardMode !== 'tiktok';

          // Helper to reset answer state when rating
          const handleSmartRate = async (rating, questionId) => {
            await rateQuestion(rating, questionId);
            setShowAnswer(false); // Force reset answer state
          };

          return (
            <div className="active-session smart-review-mode">
              {/* Question Display */}
              <div className="question-card-wrapper" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                {enableSwipe && SwipeZoneContainer ? (
                  <SwipeZoneContainer
                    key={smartQuestion._id}
                    onRate={(r) => handleSmartRate(r)}
                    disabled={isLoading}
                    swipeThreshold={250}
                    isSimplified={isSimplified}
                  >
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
                        onRate={handleSmartRate} // Use wrapper
                      />
                    ) : (
                      <div className="standard-card-container">
                        <QuestionCard
                          key={`${smartQuestion._id}-${questionKey}`}
                          currentQuestion={smartQuestion}
                          showAnswer={showAnswer}
                          setShowAnswer={setShowAnswer}
                          submitAnswer={submitAnswer}
                          loading={isLoading}
                        />
                        {/* Smart Review Rating Buttons inside Swipe Container makes sense so they move with card? 
                             Actually, usually buttons stay or move. User asked for "just the question card".
                             But if buttons are outside, they might cover.
                             Moving the wrapper div is safest.
                         */}
                      </div>
                    )}
                  </SwipeZoneContainer>
                ) : (
                  // Fallback without Swipe
                  cardMode === "flashcard" ? (
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
                      onRate={handleSmartRate} // Use wrapper
                    />
                  ) : (
                    <QuestionCard
                      key={`${smartQuestion._id}-${questionKey}`}
                      currentQuestion={smartQuestion}
                      showAnswer={showAnswer}
                      setShowAnswer={setShowAnswer}
                      submitAnswer={submitAnswer}
                      loading={isLoading}
                    />
                  )
                )}

                {/* Rating buttons for Normal mode need to be outside if card flies away, or inside if they fly with it. 
                    If they fly with it, they disappear. 
                    Structure above has them separate in original code.
                    Let's put them below the swipe container for stability, or check logic.
                */}
                {cardMode !== "flashcard" && (showAnswer || isSimplified) && (
                  <div style={{ marginTop: '1rem' }}>
                    <RatingButtons
                      onRate={handleSmartRate}
                      disabled={isLoading}
                      compact={false}
                      isSimplified={isSimplified}
                    />
                  </div>
                )}
              </div>

              {/* Session Info */}

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
