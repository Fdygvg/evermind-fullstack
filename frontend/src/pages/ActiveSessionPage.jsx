import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import { sessionService } from "../services/sessions";
import ProgressBar from "../components/Common/ProgressBar";
import QuestionCard from "../components/Common/QuestionCard";

const ActiveSession = () => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(null);
  const [loading, setLoading] = useState(false); // Track loading state for UI
  const [questionKey, setQuestionKey] = useState(0); // Force remount when question changes
  const [sessionTime, setSessionTime] = useState(0); // Track session time in seconds
  const [currentStreak, setCurrentStreak] = useState(0); // Track consecutive correct answers
  const submittingQuestionIdRef = useRef(null); // Track which question is being submitted
  const isLoadingQuestionRef = useRef(false); // Prevent multiple simultaneous loads
  const sessionStartTimeRef = useRef(null); // Track when session started

  const { activeSession } = useSession();
  const navigate = useNavigate();

  const loadNextQuestion = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (isLoadingQuestionRef.current) {
      console.log("[LOAD] Already loading question, skipping...");
      return;
    }

    isLoadingQuestionRef.current = true;
    setLoading(true); // Set loading state for UI
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

      // Update question immediately - clear loading first, then update question
      setLoading(false); // Clear loading state first for immediate UI update
      setCurrentQuestion(question);
      setSessionProgress(progress);
      setShowAnswer(false);
      setQuestionKey(prev => prev + 1); // Force remount by changing key
      
      console.log("[LOAD] Question state updated successfully");
    } catch (error) {
      console.error("[LOAD] Failed to load question:", error);
      console.error("[LOAD] Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setLoading(false); // Clear loading on error too
    } finally {
      isLoadingQuestionRef.current = false;
      console.log("[LOAD] Load operation completed");
    }
  }, [navigate]);

  // Load initial question on mount only
  useEffect(() => {
    console.log("[INIT] Component mounted, loading initial question");
    sessionStartTimeRef.current = Date.now();
    loadNextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

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

  // Reset submission flag when question changes (allows immediate interaction with new question)
  useEffect(() => {
    if (currentQuestion?._id) {
      console.log("[STATE] Question changed to:", currentQuestion._id);
      submittingQuestionIdRef.current = null;
      console.log("[STATE] Submission flag reset");
    }
  }, [currentQuestion?._id]);

  const submitAnswer = useCallback(async (isCorrect) => {
    console.log("[SUBMIT] submitAnswer called with:", isCorrect);
    
    if (!currentQuestion?._id || loading) {
      console.log("[SUBMIT] ERROR: No current question or already loading, cannot submit");
      return;
    }
    
    const questionId = currentQuestion._id;
    console.log("[SUBMIT] Current question ID:", questionId);
    
    // Prevent rapid duplicate submissions for the same question
    if (submittingQuestionIdRef.current === questionId) {
      console.log("[SUBMIT] BLOCKED: Already submitting for this question:", questionId);
      return;
    }
    
    // Mark this question as being submitted
    submittingQuestionIdRef.current = questionId;
    console.log("[SUBMIT] Marked question as submitting:", questionId);

    // Reset answer visibility immediately for instant feedback
    console.log("[SUBMIT] Hiding answer section");
    setShowAnswer(false);
    setLoading(true); // Show loading state immediately

    // Submit answer FIRST, then load next question
    try {
      console.log("[SUBMIT] Submitting answer to backend first...");
      await sessionService.submitAnswer({
        questionId,
        isCorrect,
      });
      console.log("[SUBMIT] Answer submitted successfully");
      
      // Update streak based on answer
      if (isCorrect) {
        setCurrentStreak(prev => prev + 1);
      } else {
        setCurrentStreak(0); // Reset streak on wrong answer
      }
      
      // NOW load the next question (backend knows we answered)
      console.log("[SUBMIT] Loading next question...");
      await loadNextQuestion();
    } catch (error) {
      console.error("[SUBMIT] Failed to submit answer:", error);
      console.error("[SUBMIT] Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // Reset ref on error so user can retry
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

  if (!currentQuestion) {
    return <div className="loading">Loading question...</div>;
  }

  return (
    <div className="active-session">
      {/* Progress Bar */}
      <div className="session-header">
        <ProgressBar
          currentStreak={currentStreak}
          sessionTime={sessionTime}
          currentCount={sessionProgress?.total - sessionProgress?.remaining || 0}
          totalCount={activeSession?.totalQuestions || sessionProgress?.total || 0}
          correctCount={sessionProgress?.correct || 0}
          wrongCount={sessionProgress?.wrong || 0}
          showAccuracy={true}
          showTimer={true}
          compact={false}
        />
        <div className="progress-stats">
          {sessionProgress?.remaining} questions remaining
        </div>
        <button className="end-session-btn" onClick={endSession}>
          End Session
        </button>
      </div>

      {/* Question Card with Swipe Overlay */}
      <div className="question-card-wrapper" style={{ position: "relative" }}>
        <QuestionCard
          key={`${currentQuestion._id}-${questionKey}`}
          currentQuestion={currentQuestion}
          showAnswer={showAnswer}
          setShowAnswer={setShowAnswer}
          submitAnswer={submitAnswer}
          loading={loading}
        />
      </div>

      {/* Session Info */}
      <div className="session-info">
        <div className="mode-badge">
          Mode: {activeSession?.mode === "buffer" ? "Buffer" : "Random"}
        </div>
        <div className="progress-numbers">
          Correct: {sessionProgress?.correct} | Wrong: {sessionProgress?.wrong}
        </div>
      </div>
    </div>
  );
};

export default ActiveSession;
