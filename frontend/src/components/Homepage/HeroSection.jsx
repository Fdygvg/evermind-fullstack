// frontend/src/components/homepage/HeroSection.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ArrowRight, Sparkles, TrendingUp, Brain, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuizPreview from './QuizPreview';

const HeroSection = () => {
  const { user } = useAuth();
  const [textIndex, setTextIndex] = useState(0);

  const texts = [
    'Spaced Repetition',
    'Cognitive Science',
    'Smart Scheduling',
    'Long-term Mastery'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % texts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen pt-20 flex items-center justify-center overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-sm text-indigo-300 text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            <span>Master anything faster</span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
            Learning powered by<br />
            <span className="block h-[1.2em] relative">
              <AnimatePresence mode="wait">
                <motion.span
                  key={textIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute left-0 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
                >
                  {texts[textIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-lg leading-relaxed">
            EVERMIND transforms how you retain information. Our intelligent system
            adapts to your memory, ensuring you review material at the perfect time
            for long-term mastery.
          </p>

          {/* Benefits Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Brain, text: "Adaptive Learning" },
              { icon: TrendingUp, text: "Smart Scheduling" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-indigo-400">
                  <item.icon className="w-5 h-5" />
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 pt-4">
            {user ? (
              <Link to="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow"
                >
                  Go to Dashboard <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow"
                  >
                    Start Learning Free <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 rounded-xl border border-slate-700 bg-slate-800/50 text-white font-medium hover:bg-slate-800 transition-colors backdrop-blur-sm"
                  >
                    Sign In
                  </motion.button>
                </Link>
              </>
            )}
          </div>

          {/* Social Proof Text */}
          <div className="pt-8 border-t border-slate-800/50">
            <p className="text-sm text-slate-500 mb-2">Join thousands learning:</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400 font-medium">
              {['Programming', 'Languages', 'Science', 'History'].map((subject) => (
                <span key={subject} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {subject}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Column - Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative hidden lg:block"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 to-purple-500/30 rounded-[2rem] blur-2xl -z-10 transform rotate-3" />
          <div className="relative bg-slate-900 border border-slate-700/50 rounded-[2rem] p-4 shadow-2xl backdrop-blur-xl">
            <div className="absolute -top-6 -right-6 bg-slate-800 border border-slate-700 p-4 rounded-2xl shadow-xl z-20 animate-bounce-slow">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <div className="text-xs text-slate-400">Active Learners</div>
                  <div className="font-bold text-white">2,500+</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-800">
              <QuizPreview />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
