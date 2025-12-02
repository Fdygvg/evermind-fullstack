import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import { sessionService } from "../services/sessions";
import ProgressBar from "../components/Common/ProgressBar";
import QuestionCard from "../components/Common/QuestionCard";

const ActiveSession = () => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(null);

  const { activeSession } = useSession();
  const navigate = useNavigate();

  const loadNextQuestion = useCallback(async () => {
    try {
      const response = await sessionService.getNextQuestion();
      const { question, progress, completed } = response.data.data;

      if (completed) {
        // Session finished - go to results
        navigate("/session/results");
        return;
      }

      setCurrentQuestion(question);
      setSessionProgress(progress);
      setShowAnswer(false);
    } catch (error) {
      console.error("Failed to load question:", error);
    }
  }, [navigate]);

  useEffect(() => {
    loadNextQuestion();
  }, [loadNextQuestion]);

  const submitAnswer = async (isCorrect) => {
    setLoading(true);
    try {
      await sessionService.submitAnswer({
        questionId: currentQuestion._id,
        isCorrect,
      });

      // Load next question
      await loadNextQuestion();
    } catch (error) {
      console.error("Failed to submit answer:", error);
    } finally {
      setLoading(false);
    }
  };

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
          current={sessionProgress?.total - sessionProgress?.remaining + 1 || 0}
          total={activeSession?.totalQuestions || sessionProgress?.total || 0}
          correct={sessionProgress?.correct || 0}
          wrong={sessionProgress?.wrong || 0}
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
