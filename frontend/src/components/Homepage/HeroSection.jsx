// frontend/src/components/homepage/HeroSection.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ArrowRight, Sparkles, TrendingUp, Brain } from 'lucide-react';
import QuizPreview from './QuizPreview';
import '../css/hero.css';

const HeroSection = () => {
  const { user } = useAuth();
  const [typedText, setTypedText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const texts = [
    'spaced repetition',
    'four review modes',
    'smart scheduling',
    'long-term retention'
  ];

  useEffect(() => {
    const currentText = texts[textIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // Typing forward
        if (typedText.length === currentText.length) {
          // Pause at the end
          setTimeout(() => setIsDeleting(true), 1500);
          return;
        }
        setTypedText(currentText.substring(0, typedText.length + 1));
      } else {
        // Deleting
        if (typedText.length === 0) {
          setIsDeleting(false);
          setTextIndex((prev) => (prev + 1) % texts.length);
          return;
        }
        setTypedText(currentText.substring(0, typedText.length - 1));
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [typedText, isDeleting, textIndex]);

  return (
    <section className="hero-section">
      {/* Background elements */}
      <div className="hero-background"></div>
      <div className="hero-blob hero-blob-1"></div>
      <div className="hero-blob hero-blob-2"></div>
      <div className="hero-blob hero-blob-3"></div>

      <div className="hero-content">
        {/* Left Column - Content */}
        <div className="hero-left">
          {/* Badge */}
          <div className="hero-badge">
            <Sparkles />
            <span>Master anything faster</span>
          </div>

          {/* Main Headline */}
          <h1 className="hero-headline">
            Learning powered by{' '}
            <span className="hero-gradient-text">
              {typedText}
              <span className="typing-cursor"></span>
            </span>
          </h1>

          {/* Subheadline */}
          <p className="hero-subheadline">
            EVERMIND transforms how you retain information. Our intelligent system 
            adapts to your memory, ensuring you review material at the perfect time 
            for long-term mastery.
          </p>

          {/* Key Benefits */}
          <div className="hero-benefits">
            <div className="hero-benefit">
              <div className="hero-benefit-icon">
                <Brain />
              </div>
              <span>Four unique review modes for every learning style</span>
            </div>
            <div className="hero-benefit">
              <div className="hero-benefit-icon">
                <TrendingUp />
              </div>
              <span>Smart scheduling based on cognitive science</span>
            </div>
            <div className="hero-benefit">
              <div className="hero-benefit-icon">
                <Sparkles />
              </div>
              <span>Visual progress tracking and insights</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="hero-cta-group">
            {user ? (
              <Link to="/dashboard" className="hero-cta-primary">
                Go to Dashboard
                <ArrowRight />
              </Link>
            ) : (
              <>
                <Link to="/register" className="hero-cta-primary">
                  Start Learning Free
                  <ArrowRight />
                </Link>
                <Link to="/login" className="hero-cta-secondary">
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="hero-trust">
            <p className="hero-trust-label">Join thousands of learners mastering:</p>
            <div className="hero-subjects">
              {['Programming', 'Languages', 'Science', 'History', 'Math'].map((subject) => (
                <div key={subject} className="hero-subject">
                  {subject}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Interactive Quiz Preview */}
        <div className="hero-right">
          <div className="quiz-preview-container">
            <div className="quiz-preview-badge">
              Try It Live
            </div>
            <QuizPreview />
          </div>

          {/* Floating Stats */}
          <div className="floating-stat">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="floating-stat-indicator"></div>
              <div>
                <div className="floating-stat-value">2,500+</div>
                <div className="floating-stat-label">Active learners</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
