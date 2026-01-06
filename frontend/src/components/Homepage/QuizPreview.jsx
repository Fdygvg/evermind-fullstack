// frontend/src/components/homepage/QuizPreview.jsx
import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import '../css/quiz-preview.css';

const QuizPreview = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState('');

  // Fetch trivia question from OpenTDB API
  const fetchQuestion = async () => {
    setLoading(true);
    setSelected(null);
    setResult('');
    
    try {
      const res = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        const q = data.results[0];
        const formattedQuestion = decodeHTML(q.question);
        const allOptions = [...q.incorrect_answers, q.correct_answer]
          .map(decodeHTML)
          .sort(() => Math.random() - 0.5);
        
        setQuestion(formattedQuestion);
        setOptions(allOptions);
        setCorrectAnswer(decodeHTML(q.correct_answer));
      }
    } catch (error) {
      console.error('Failed to fetch trivia:', error);
      // Fallback questions
      setQuestion('What does "SRS" stand for in learning systems?');
      setOptions([
        'Spaced Repetition System',
        'Smart Review Schedule',
        'Sequential Recall Strategy',
        'Systematic Retention System'
      ]);
      setCorrectAnswer('Spaced Repetition System');
    } finally {
      setLoading(false);
    }
  };

  // HTML entity decoder
  const decodeHTML = (html) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  const checkAnswer = (answer) => {
    if (selected) return; // Prevent multiple selections
    
    setSelected(answer);
    setAttempts(prev => prev + 1);
    
    if (answer === correctAnswer) {
      setResult('Correct! 🎉');
      setScore(prev => prev + 1);
    } else {
      setResult(`Incorrect. The answer is: ${correctAnswer}`);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  const getOptionClass = (option) => {
    let className = 'quiz-option';
    
    if (selected) {
      if (option === correctAnswer) {
        className += ' quiz-option-correct';
      } else if (option === selected) {
        className += ' quiz-option-incorrect';
      } else {
        className += ' quiz-option-other-correct';
      }
      className += ' quiz-option-disabled';
    } else if (option === selected) {
      className += ' quiz-option-selected';
    }
    
    return className;
  };

  const getOptionIcon = (option) => {
    if (!selected) return null;
    
    if (option === correctAnswer) {
      return <CheckCircle className="quiz-option-icon quiz-option-icon-correct" />;
    }
    
    if (option === selected && option !== correctAnswer) {
      return <XCircle className="quiz-option-icon quiz-option-icon-incorrect" />;
    }
    
    return null;
  };

  return (
    <div className="quiz-preview">
      {/* Header */}
      <div>
        <div className="quiz-header">
          <div>
            <h3 className="quiz-title">Quick Quiz Demo</h3>
            <p className="quiz-subtitle">Experience how EVERMIND feels</p>
          </div>
          <div className="quiz-score">
            <Sparkles className="quiz-score-icon" />
            <span>{score}/{attempts} correct</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="quiz-question-area">
        {loading ? (
          <div className="quiz-loading">
            <div className="quiz-spinner"></div>
            <p className="quiz-loading-text">Loading question...</p>
          </div>
        ) : (
          <p className="quiz-question">{question}</p>
        )}
      </div>

      {/* Options */}
      <div className="quiz-options">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => checkAnswer(option)}
            disabled={!!selected}
            className={getOptionClass(option)}
          >
            <div className="quiz-option-content">
              <span>{option}</span>
              {getOptionIcon(option)}
            </div>
          </button>
        ))}
      </div>

      {/* Result & Controls */}
      <div>
        {result && (
          <div className={`quiz-result ${result.includes('Correct') ? 'quiz-result-correct' : 'quiz-result-incorrect'}`}>
            <div className="quiz-result-content">
              {result.includes('Correct') ? (
                <CheckCircle className="quiz-result-icon" />
              ) : (
                <XCircle className="quiz-result-icon" />
              )}
              <p className="quiz-result-text">{result}</p>
            </div>
          </div>
        )}

        <div className="quiz-controls">
          <button
            onClick={fetchQuestion}
            className="quiz-new-question"
          >
            <RefreshCw className="quiz-new-question-icon" />
            New Question
          </button>
          
          <p className="quiz-note">
            This is a preview. EVERMIND has 4 review modes and smart scheduling.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuizPreview;