// frontend/src/components/homepage/ModeShowcase.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FlipHorizontal, ListChecks, Smartphone, MousePointerClick,
  ChevronRight, Play, Zap, Check
} from 'lucide-react';

const ModeShowcase = () => {
  const [activeMode, setActiveMode] = useState('normal');

  const modes = [
    {
      id: 'normal',
      name: 'Normal Mode',
      icon: <MousePointerClick className="w-5 h-5" />,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      description: 'Simple, focused review sessions.',
      features: ['Click to reveal answer', 'Rate 1-5 for scheduling', 'Clean interface']
    },
    {
      id: 'flashcard',
      name: 'Flashcard Mode',
      icon: <FlipHorizontal className="w-5 h-5" />,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      description: 'Cards flip with smooth animations.',
      features: ['3D flip animations', 'Swipe or click to flip', 'Visual learning']
    },
    {
      id: 'elimination',
      name: 'Elimination Mode',
      icon: <ListChecks className="w-5 h-5" />,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      description: 'Mark questions off until none remain.',
      features: ['See all questions', 'Mark as you master', 'Progress bar']
    },
    {
      id: 'tiktok',
      name: 'TikTok Mode',
      icon: <Smartphone className="w-5 h-5" />,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10',
      description: 'Swipe through questions fast.',
      features: ['Swipe gestures', 'Quick reviews', 'Mobile-optimized']
    }
  ];

  const activeModeData = modes.find(mode => mode.id === activeMode);

  return (
    <section className="py-24 relative bg-slate-900 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium mb-6"
          >
            <Play className="w-4 h-4" />
            <span>Four Ways to Learn</span>
          </motion.div>
          <h2 className="text-4xl font-bold mb-4">
            Review Modes for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Every Style</span>
          </h2>
          <p className="text-slate-400 text-lg">
            Choose how you want to review. Each mode is designed for different
            contexts, moods, and learning preferences.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left: Menu */}
          <div className="space-y-4">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 group ${activeMode === mode.id
                    ? 'bg-slate-800 border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-transparent border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
              >
                <div className={`p-3 rounded-lg ${mode.bg} ${mode.color} transition-colors`}>
                  {mode.icon}
                </div>
                <div className="flex-1">
                  <div className={`font-semibold text-lg ${activeMode === mode.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {mode.name}
                  </div>
                  <div className="text-sm text-slate-500">{mode.description}</div>
                </div>
                <ChevronRight className={`w-5 h-5 text-slate-600 transition-transform ${activeMode === mode.id ? 'rotate-90 text-blue-400' : ''}`} />
              </button>
            ))}
          </div>

          {/* Right: Demo */}
          <div className="relative aspect-video lg:aspect-square max-h-[500px] w-full bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

            {/* Dynamic Content based on Mode */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMode}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-sm px-6"
              >
                {activeMode === 'normal' && (
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center shadow-xl">
                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-4">Question</div>
                    <div className="text-xl font-bold text-white mb-8">What is Spaced Repetition?</div>
                    <button className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors">
                      Show Answer
                    </button>
                  </div>
                )}

                {activeMode === 'flashcard' && (
                  <div className="perspective-1000">
                    <motion.div
                      animate={{ rotateY: [0, 180, 180, 0] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                      className="relative h-64 w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-xl flex items-center justify-center transform-style-3d"
                    >
                      <div className="text-xl font-bold text-white">Front Side</div>
                    </motion.div>
                  </div>
                )}

                {activeMode === 'elimination' && (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ x: 0, opacity: 1 }}
                        animate={i === 1 ? { x: 50, opacity: 0 } : {}}
                        transition={{ duration: 0.5, delay: 1, repeat: Infinity, repeatDelay: 2 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-900 border border-slate-700"
                      >
                        <div className="w-5 h-5 rounded border border-slate-600 flex items-center justify-center">
                          {i === 1 && <Check className="w-3 h-3 text-green-400" />}
                        </div>
                        <div className="h-2 bg-slate-700 rounded w-3/4" />
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeMode === 'tiktok' && (
                  <motion.div
                    animate={{ x: [0, -200, 0], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    className="bg-slate-900 border border-slate-700 rounded-2xl h-[400px] flex flex-col justify-between p-6 shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-0" />
                    <div className="relative z-10 text-white font-bold text-xl mt-12">React Hooks?</div>
                    <div className="relative z-10 flex flex-col gap-4 items-end">
                      <div className="w-10 h-10 rounded-full bg-slate-800/80" />
                      <div className="w-10 h-10 rounded-full bg-slate-800/80" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Badge */}
            <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400 font-mono">
              {activeModeData?.name}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ModeShowcase;