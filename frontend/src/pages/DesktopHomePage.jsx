import logo from "../assets/logo.png";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import {
  FaCode,
  FaTerminal,
  FaMicrochip,
  FaBolt,
  FaCodeBranch,
  FaBrain,
  FaStar,
  FaLaptopCode,
  FaSave,
  FaChartLine,
} from "react-icons/fa";
import CodeRain from "../components/Effects/CodeRain";
import TerminalEffect from "../components/Effects/TerminalEffect";

const IconFallback = ({ type }) => {
  const icons = {
    code: <FaCode />,
    terminal: <FaTerminal />,
    cpu: <FaMicrochip />,
    zap: <FaBolt />,
    git: <FaCodeBranch />,
    brain: <FaBrain />,
    sparkles: <FaStar />,
  };

  return icons[type] || <FaStar />;
};
const DesktopHomePage = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("react");
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);
  // Interactive mouse effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    if (loading) {
      return (
        <div className="loading-screen dev-loading">
          <IconFallback type="terminal" />
          <span className="blinking-cursor">_</span>
        </div>
      );
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const codeExamples = {
    react: `// React Hook Flashcard
import { useState, useEffect } from 'react';

function useEvermindFlashcard(question, answer) {
  const [interval, setInterval] = useState(1);
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    // Spaced repetition algorithm
    const nextReview = calculateNextReview(confidence);
    setInterval(nextReview);
  }, [confidence]);

  return { interval, setConfidence };
}`,
    python: `# Python Decorator Flashcard
def spaced_repetition(fn):
    """Decorator for tracking memory strength"""
    memory = {}
    
    def wrapper(concept, confidence):
        if concept not in memory:
            memory[concept] = 1
        else:
            # Calculate next review based on SM-2 algorithm
            memory[concept] *= confidence * 2.5
        
        return fn(concept, memory[concept])
    return wrapper`,
    javascript: `// JavaScript Closure Flashcard
function createFlashcardSystem() {
  let deck = new Map();
  
  return {
    addCard: (question, answer) => {
      deck.set(question, {
        answer,
        interval: 1,
        ease: 2.5,
        reviews: 0
      });
    },
    
    getNextCard: () => {
      // Implement Leitner system
      return Array.from(deck.entries())
        .sort((a, b) => a[1].interval - b[1].interval)[0];
    }
  };
}`,
  };

  return (
    <div className="dev-homepage">
      {/* Code rain background effect */}
      <CodeRain />

      {/* Animated cursor trail */}
      <div
        className="cursor-trail"
        style={{
          left: `${cursorPosition.x * 100}%`,
          top: `${cursorPosition.y * 100}%`,
          background: `radial-gradient(circle at center, 
            var(--color-primary) 0%,
            transparent 70%)`,
        }}
      />

      {/* Hero Section - Developer Focused */}
      <header className="dev-hero" ref={heroRef}>
        <nav className="dev-nav">
          <div className="dev-logo">
            <img src={logo} alt="Evermind Logo" className="logo-icon-img" />
            <span className="logo-text">
              <span className="logo-accent">EVER</span>MIND
              <span className="dev-badge">DEV</span>
            </span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">
              <IconFallback type="code" />
              Features
            </a>
            <a href="#tech" className="nav-link">
              <IconFallback type="cpu" />
              Tech
            </a>
            <a href="#community" className="nav-link">
              <IconFallback type="git" />
              Community
            </a>
            {user ? (
              <Link to="/dashboard" className="dev-nav-btn">
                <IconFallback type="terminal" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="nav-link">
                  <IconFallback type="zap" />
                  Login
                </Link>
                <Link to="/register" className="dev-nav-btn">
                  <IconFallback type="terminal" />
                  Get Started
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-left">
            <div className="tech-stack-badges">
              <span className="tech-badge">React</span>
              <span className="tech-badge">TypeScript</span>
              <span className="tech-badge">Node.js</span>
              <span className="tech-badge">Python</span>
            </div>

            <h1 className="hero-title">
              <span className="hero-line">Finally, </span>
              <span className="hero-line gradient-text">
                Spaced Repetition
                <IconFallback type="sparkles" />
              </span>
              <span className="hero-line">That Doesn't Suck for Code</span>
            </h1>

            <p className="hero-subtitle">
              EVERMIND is built <strong>by developers, for developers</strong>.
              Master algorithms, frameworks, and system design with
              syntax-highlighted flashcards, GitHub integration, and dev-focused
              spaced repetition.
            </p>

            <div className="hero-cta">
              <Link to="/register" className="cta-primary dev">
                <IconFallback type="terminal" />
                Start Coding for Free
                <span className="keyboard-shortcut">⌘K</span>
              </Link>
              <Link to="/demo" className="cta-secondary dev">
                <IconFallback type="code" />
                Try Interactive Demo
              </Link>
            </div>

            {/* Terminal Preview */}
            <div className="terminal-preview">
              <TerminalEffect />
            </div>
          </div>

          <div className="hero-right">
            {/* Interactive Code Editor */}
            <div className="code-editor">
              <div className="editor-tabs">
                {Object.keys(codeExamples).map((lang) => (
                  <button
                    key={lang}
                    className={`editor-tab ${activeTab === lang ? "active" : ""
                      }`}
                    onClick={() => setActiveTab(lang)}
                  >
                    {lang}.js
                  </button>
                ))}
              </div>
              <div className="editor-content">
                <pre className="code-block">
                  <code className={`language-${activeTab}`}>
                    {codeExamples[activeTab]}
                  </code>
                </pre>
                <div className="editor-comment">
                  <IconFallback type="brain" />
                  <span>This code becomes a flashcard automatically</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <div className="scroll-text">import evermind</div>
          <div className="scroll-line"></div>
        </div>
      </header>

      {/* Features - Developer Focused */}
      <section className="dev-features" id="features">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-hash">#</span>
            Built for How Developers Actually Learn
          </h2>
          <p className="section-subtitle">
            No more copy-pasting & code. EVERMIND understands developer
            workflows.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card dev">
            <div className="feature-icon">
              <IconFallback type="code" />
            </div>
            <h3>Syntax Highlighted Cards</h3>
            <p>
              Code flashcards with proper syntax highlighting for 50+ languages.
              Readable code is memorable code.
            </p>
            <div className="feature-badges">
              <span className="feature-badge">JS/TS</span>
              <span className="feature-badge">Python</span>
              <span className="feature-badge">Go</span>
              <span className="feature-badge">Rust</span>
            </div>
          </div>

          <div className="feature-card dev">
            <div className="feature-icon">
              <IconFallback type="git" />
            </div>
            <h3>GitHub Integration</h3>
            <p>
              Import code directly from gists, repos, or PRs. Turn your actual
              code into learning material.
            </p>
            <div className="github-example">
              <code>$ evermind import github:username/repo</code>
            </div>
          </div>

          <div className="feature-card dev">
            <div className="feature-icon">
              <IconFallback type="cpu" />
            </div>
            <h3>Tech Stack Decks</h3>
            <p>
              Pre-built decks for React, Node.js, System Design, DSA, DevOps.
              Curated by senior engineers.
            </p>
            <div className="deck-stats">
              <span>500+ React Questions</span>
              <span>300+ System Design</span>
            </div>
          </div>

          <div className="feature-card dev">
            <div className="feature-icon">
              <IconFallback type="zap" />
            </div>
            <h3>CLI & VS Code Extension</h3>
            <p>
              Review flashcards from terminal or right in your editor. No
              context switching.
            </p>
            <div className="cli-preview">
              <code>$ evermind review --today</code>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="interactive-demo">
        <div className="demo-container">
          <h2 className="demo-title">Try It Live</h2>
          <p className="demo-subtitle">
            Experience the developer-focused spaced repetition
          </p>

          <div className="demo-editor">
            <TerminalEffect />
          </div>
        </div>
      </section>

      {/* Community & Stats */}
      <section className="dev-community" id="community">
        <div className="community-stats">
          <div className="stat-card">
            <div className="stat-number">10,000+</div>
            <div className="stat-label">Devs Learning</div>
            <div className="stat-icon">
              <FaLaptopCode />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-number">50,000+</div>
            <div className="stat-label">Code Flashcards</div>
            <div className="stat-icon">
              <FaSave />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-number">95%</div>
            <div className="stat-label">Retention Rate</div>
            <div className="stat-icon">
              <FaChartLine />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-number">24/7</div>
            <div className="stat-label">API Uptime</div>
            <div className="stat-icon">
              <FaBolt />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta dev">
        <div className="cta-content">
          <h2>
            Join thousands of developers who've upgraded their learning system.
          </h2>

          <div className="cta-buttons">
            <Link to="/register" className="cta-primary large dev">
              <IconFallback type="terminal" />
              Start Free for Developers
              <span className="beta-badge">BETA</span>
            </Link>
            <a
              href="https://github.com/evermind"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-secondary dev github"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="currentColor"
                  d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                />
              </svg>
              Star on GitHub
            </a>
          </div>

          <div className="dev-testimonials">
            <div className="dev-testimonials">
              <div className="testimonial">
                <div className="testimonial-content">
                  "Finally, a spaced repetition system that actually respects my
                  code formatting. I've learned more full-stack patterns in 2
                  weeks than 6 months of tutorials."
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">U9</div>
                  <div className="author-info">
                    <div className="author-name">
                      usern9ne, Full-Stack Developer
                    </div>
                    <div className="author-company">@Evermind</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Footer */}
      <footer className="dev-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <img src={logo} alt="Evermind Logo" className="logo-icon-img" />
            <span className="logo-text">
              <span className="logo-accent">EVER</span>MIND
              <span className="dev-tag">.DEV</span>
            </span>
            <div className="footer-tagline">Built by devs, for devs.</div>
          </div>

          <div className="footer-links">
            <div className="link-group">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#api">API</a>
              <a href="#cli">CLI</a>
            </div>
            <div className="link-group">
              <h4>Developers</h4>
              <a href="https://docs.evermind.dev">Documentation</a>
              <a href="https://github.com/evermind">GitHub</a>
              <a href="#contribute">Contribute</a>
              <a href="#status">Status</a>
            </div>
            <div className="link-group">
              <h4>Community</h4>
              <a href="https://discord.gg/evermind">Discord</a>
              <a href="https://twitter.com/everminddev">Twitter</a>
              <a href="https://reddit.com/r/evermind">Reddit</a>
              <a href="#blog">Blog</a>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="tech-used">
              <span>Built with: React • Express.js • Node.js • MongoDB</span>
            </div>
            <div className="copyright">
              © {new Date().getFullYear()} EVERMIND. Code with ❤️ for developers
              everywhere.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DesktopHomePage;
