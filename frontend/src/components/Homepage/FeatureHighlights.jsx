// frontend/src/components/homepage/FeatureHighlights.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Target, Zap, Calendar, BarChart3, Clock,
  TrendingUp, Shield, CheckCircle, ChevronRight, Sparkles
} from 'lucide-react';

const FeatureHighlights = () => {
  const [activeFeature, setActiveFeature] = useState('smart-rating');

  const features = [
    {
      id: 'smart-rating',
      name: 'Smart Rating System',
      icon: <Star className="w-6 h-6" />,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      description: 'Rate 1-5 to control when you see questions again',
      details: '1: See again in 5 cards, 2: 1 day, 3: 3 days, 4: 7 days, 5: 14 days',
    },
    {
      id: 'priority',
      name: 'Priority Scheduling',
      icon: <Target className="w-6 h-6" />,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      description: 'Harder questions appear more frequently until mastered',
      details: 'Questions you struggle with get prioritized in your review queue',
    },
    {
      id: 'limits',
      name: 'Smart Daily Limits',
      icon: <Zap className="w-6 h-6" />,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      description: 'Maximum 50% of questions per section daily',
      details: 'Prevents burnout and ensures sustainable learning pace',
    },
    {
      id: 'skip',
      name: 'Skip Logic',
      icon: <ChevronRight className="w-6 h-6" />,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      description: 'Swipe or skip questions quickly in all modes',
      details: 'Except TikTok mode - designed for continuous flow',
    },
    {
      id: 'analytics',
      name: 'Learning Analytics',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      description: 'Track progress, streaks, and mastery levels',
      details: 'Visual dashboards showing your learning journey',
    },
    {
      id: 'scheduling',
      name: 'Intelligent Scheduling',
      icon: <Calendar className="w-6 h-6" />,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      description: 'Optimal review times calculated automatically',
      details: 'Based on your performance and cognitive science principles',
    }
  ];

  const activeFeatureData = features.find(f => f.id === activeFeature);

  return (
    <section className="py-24 relative overflow-hidden bg-slate-900/50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium mb-6"
          >
            <Zap className="w-4 h-4" />
            <span>Intelligent Features</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold mb-4"
          >
            Beyond Basic <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Flashcards</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg"
          >
            EVERMIND includes sophisticated features that make learning more
            effective, sustainable, and personalized to your needs.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Features Column */}
          <div className="lg:col-span-12 xl:col-span-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, idx) => (
              <motion.button
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setActiveFeature(feature.id)}
                className={`relative p-6 rounded-2xl border text-left bg-slate-800/40 backdrop-blur-sm transition-all duration-300 group ${activeFeature === feature.id
                    ? `border-purple-500/50 shadow-lg shadow-purple-500/10 ${feature.bg}`
                    : 'border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/60'
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${feature.bg} ${feature.color} border ${feature.border}`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className={`font-semibold text-lg mb-1 group-hover:text-white transition-colors ${activeFeature === feature.id ? 'text-white' : 'text-slate-200'}`}>
                      {feature.name}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Highlight Verification / Stats Below */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Retention Rate", value: "94%", color: "text-emerald-400" },
            { label: "Faster Learning", value: "2.3x", color: "text-indigo-400" },
            { label: "Study Time", value: "-67%", color: "text-pink-400" },
            { label: "User Rating", value: "4.8/5", color: "text-amber-400" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className="bg-slate-800/30 border border-slate-700/30 p-6 rounded-2xl text-center"
            >
              <div className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureHighlights;