import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const HomePage = () => {
  const { user, loading } = useAuth();

  // If user is logged in, redirect to dashboard
  if (loading) {
    return (
      <div className="loading-screen">
        Loading...
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="homepage-container">
      {/* Animated Background */}
      <div className="background-animation">
        <div className="floating-brain">🧠</div>
        <div className="floating-question">❓</div>
        <div className="floating-check">✅</div>
        <div className="floating-star">⭐</div>
      </div>

      {/* Hero Section */}
      <header className="hero-section">
        <nav className="home-nav">
          <div className="logo">
            <span className="logo-icon">🧠</span>
            <span className="logo-text">EVERMIND</span>
          </div>
          <div className="nav-links">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-btn">Get Started →</Link>
          </div>
        </nav>

        <div className="hero-content">
          <h1 className="hero-title">
            Master Anything with <span className="gradient-text">Spaced Repetition</span>
          </h1>
          <p className="hero-subtitle">
            EVERMIND helps you remember everything you learn using proven memory science. 
            Study smarter, not harder.
          </p>
          
          <div className="hero-cta">
            <Link to="/register" className="cta-primary">
              Start Learning Free
            </Link>
            <Link to="/login" className="cta-secondary">
              Already have an account? Sign in
            </Link>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">10x</span>
              <span className="stat-label">Better Retention</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">∞</span>
              <span className="stat-label">Customizable Decks</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">Your Control</span>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why EVERMIND Works</h2>
        <p className="section-subtitle">Built on proven cognitive science principles</p>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⏰</div>
            <h3>Spaced Repetition</h3>
            <p>Review material at optimal intervals to move knowledge from short-term to long-term memory.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Smart Algorithms</h3>
            <p>Our system learns from your performance and adjusts review schedules automatically.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Progress Tracking</h3>
            <p>See detailed analytics of your learning journey with streaks, accuracy, and time spent.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Buffer & Random Modes</h3>
            <p>Choose between systematic review (Buffer) or mixed challenge (Random) based on your preference.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Create Your Questions</h3>
              <p>Add questions and answers about anything you want to learn. Organize them into sections.</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Review Daily</h3>
              <p>Spend just 10-15 minutes daily reviewing questions. Mark them correct or wrong.</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Watch Your Memory Grow</h3>
              <p>See your accuracy improve over time as the system optimizes your review schedule.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials (Placeholder) */}
      <section className="testimonials">
        <h2 className="section-title">Trusted by Learners</h2>
        
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <p className="testimonial-text">
              "I used to forget everything I studied. Now with EVERMIND, I actually remember!"
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">👩‍💻</div>
              <div className="author-info">
                <h4>Sarah, Medical Student</h4>
                <p>128 day streak</p>
              </div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <p className="testimonial-text">
              "The buffer mode is genius. Wrong questions come back at the perfect time."
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">👨‍💼</div>
              <div className="author-info">
                <h4>Alex, Software Engineer</h4>
                <p>92% accuracy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <h2>Ready to Upgrade Your Memory?</h2>
        <p>Join thousands of learners who are mastering their subjects with EVERMIND.</p>
        
        <div className="cta-buttons">
          <Link to="/register" className="cta-primary large">
            Start Learning Free
          </Link>
          <Link to="/login" className="cta-secondary">
            Sign In
          </Link>
        </div>
        
        <div className="trust-badges">
          <div className="badge">No credit card required</div>
          <div className="badge">Free forever plan</div>
          <div className="badge">Privacy first</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <span className="logo-icon">🧠</span>
            <span className="logo-text">EVERMIND</span>
          </div>
          <p className="footer-tagline">Master your memory. Master anything.</p>
          
          <div className="footer-links">
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
          
          <p className="footer-copyright">
            © {new Date().getFullYear()} EVERMIND. Built with ❤️ for learners everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;