// frontend/src/pages/HomePage.jsx
import React from 'react';
import Navbar from '../components/Layout/Navbar';
import Footer from '../components/Layout/Footer';
import HeroSection from '../components/Homepage/HeroSection';
import QuizPreview from '../components/Homepage/QuizPreview';
import FeatureHighlights from '../components/Homepage/FeatureHighlights';
import ModeShowcase from '../components/Homepage/ModeShowcase';
import MotivationSection from '../components/Homepage/MotivationSection';
import SocialProof from '../components/Homepage/SocialProof';
import CTASection from '../components/Homepage/CTASection';


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
        <section className="homepage-section bg-accent">
          <FeatureHighlights />
        </section>

        <section className="homepage-section">
          <ModeShowcase />
        </section>

        <section className="homepage-section bg-accent">
          <SocialProof />
        </section>

        {/* Motivation Section */}
        <MotivationSection />

        {/* CTA Section */}
        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;