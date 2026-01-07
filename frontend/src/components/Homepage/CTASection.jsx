// frontend/src/components/homepage/CTASection.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle, Sparkles, Zap, Shield,
  Target, Award, Clock
} from 'lucide-react';

const CTASection = () => {
  const { user } = useAuth();

  const benefits = [
    { icon: <CheckCircle className="w-5 h-5 text-emerald-400" />, text: 'Start for free, no credit card required' },
    { icon: <Shield className="w-5 h-5 text-indigo-400" />, text: 'Secure & Private' },
    { icon: <Clock className="w-5 h-5 text-pink-400" />, text: 'Get started in under 2 minutes' }
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-indigo-950/20" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      {/* Floating Blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-75" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 text-indigo-300 font-medium mb-8"
        >
          <Sparkles className="w-4 h-4" />
          <span>Start Mastering Today</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl md:text-7xl font-bold mb-8 tracking-tight"
        >
          Transform How You <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Learn & Remember
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          Join thousands of learners who have discovered the power of
          intelligent spaced repetition. No more forgetting what you learn.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-8"
        >
          <div className="flex flex-wrap justify-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <button className="px-10 py-5 rounded-2xl bg-white text-indigo-900 font-bold text-xl hover:scale-105 transition-transform flex items-center gap-2 shadow-2xl shadow-indigo-500/20">
                  Go to Dashboard <ArrowRight className="w-6 h-6" />
                </button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <button className="px-10 py-5 rounded-2xl bg-white text-indigo-900 font-bold text-xl hover:scale-105 transition-transform flex items-center gap-2 shadow-2xl shadow-indigo-500/20">
                    Get Started Free <ArrowRight className="w-6 h-6" />
                  </button>
                </Link>
              </>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400 font-medium">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50">
                {benefit.icon}
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;