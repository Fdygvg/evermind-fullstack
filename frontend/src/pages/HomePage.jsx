// frontend/src/pages/HomePage.jsx
import React from 'react';
import Navbar from '../components/Layout/Navbar';
import Footer from '../components/Layout/Footer';
import HeroSection from '../components/Homepage/HeroSection';
import QuizPreview from '../components/Homepage/QuizPreview';


const HomePage = () => {
  return (
    <div className="homepage">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="homepage-section">
          <div className="bg-grid-pattern"></div>
          <HeroSection />
        </section>

        {/* Quiz Preview Section */}
        <section className="homepage-section bg-accent">
          <div className="section-container">
            <div className="section-header">
              <div className="section-badge">
                <span>Interactive Demo</span>
              </div>
              <h2 className="section-title">
                Try <span className="gradient-text">EVERMIND</span> Now
              </h2>
              <p className="section-description">
                Experience our spaced repetition system with this live quiz preview
              </p>
            </div>
            
            <div className="grid-2">
              <div className="homepage-card">
                <QuizPreview />
              </div>
              <div className="homepage-card">
                <h3 className="text-foreground mb-4">Why This Works</h3>
                <p className="text-muted mb-4">
                  This demo shows the core of EVERMIND's approach. 
                  In the full app, each question would be scheduled for optimal review.
                </p>
                <div className="grid-2 mt-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-blue-600 font-bold mb-1">Smart Rating</div>
                    <p className="text-sm">Rate 1-5 to control next review</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-purple-600 font-bold mb-1">4 Modes</div>
                    <p className="text-sm">Different ways to review content</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Motivation Section - Placeholder */}
        <section className="homepage-section">
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">
                Science-Backed <span className="gradient-text">Learning</span>
              </h2>
              <p className="section-description">
                Spaced repetition is proven to improve long-term memory retention by up to 200%
              </p>
            </div>
            
            <div className="grid-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="homepage-card">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <span className="text-xl">📚</span>
                  </div>
                  <h3 className="text-foreground mb-2">Research Proven</h3>
                  <p className="text-muted">
                    Based on Hermann Ebbinghaus's forgetting curve research from 1885
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="homepage-section bg-gradient-to-br from-primary/5 to-purple-500/5">
          <div className="section-container">
            <div className="section-header">
              <h2 className="section-title">
                Ready to <span className="gradient-text">Transform</span> Your Learning?
              </h2>
              <p className="section-description">
                Join thousands of learners who have discovered the power of intelligent spaced repetition
              </p>
            </div>
            
            <div className="text-center">
              <button className="btn btn-primary mr-4">
                Start Free Trial
              </button>
              <button className="btn btn-secondary">
                Learn More
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;