import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../hooks/useSession";
import { sessionService } from "../services/sessions";
import ProgressBar from "../components/Common/ProgressBar";

const ActiveSession = () => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(null);

  const { activeSession } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    loadNextQuestion();
  }, []);

  const loadNextQuestion = async () => {
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
  };

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
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${
                ((sessionProgress?.total - sessionProgress?.remaining) /
                  sessionProgress?.total) *
                100
              }%`,
            }}
          ></div>
        </div>
        <ProgressBar
          current={sessionProgress?.currentQuestionIndex + 1 || 0}
          total={activeSession?.allQuestions?.length || 0}
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

      {/* Question Card */}
      <div className="question-card">
        <div className="question-section">
          <h2>Question</h2>
          <p>{currentQuestion.question}</p>
        </div>

        {showAnswer ? (
          <div className="answer-section">
            <h2>Answer</h2>
            <p>{currentQuestion.answer}</p>
            <div className="answer-buttons">
              <button
                className="correct-btn"
                onClick={() => submitAnswer(true)}
                disabled={loading}
              >
                ✅ Correct
              </button>
              <button
                className="wrong-btn"
                onClick={() => submitAnswer(false)}
                disabled={loading}
              >
                ❌ Wrong
              </button>
            </div>
          </div>
        ) : (
          <button
            className="show-answer-btn"
            onClick={() => setShowAnswer(true)}
          >
            Show Answer
          </button>
        )}
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
