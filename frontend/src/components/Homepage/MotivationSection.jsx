// frontend/src/components/homepage/MotivationSection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, TrendingUp, Brain, Zap, Target } from 'lucide-react';

const MotivationSection = () => {
  return (
    <section className="py-24 bg-slate-900 overflow-hidden relative">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium mb-6"
          >
            <LineChart className="w-4 h-4" />
            <span>Science-Backed Learning</span>
          </motion.div>
          <h2 className="text-4xl font-bold mb-4">
            Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Spaced Repetition</span> Works
          </h2>
          <p className="text-slate-400 text-lg">
            Traditional studying is inefficient. Our brain forgets quickly unless
            we review at scientifically-optimized intervals.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Chart Area */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8 relative"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-xl">Retention over time</h3>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500" /> EVERMIND</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-600" /> Traditional</div>
              </div>
            </div>

            {/* Simplified Chart Visual */}
            <div className="h-64 relative flex items-end gap-2">
              {[100, 85, 75, 70, 65].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end gap-2 group">
                  <div className="w-full bg-slate-700/30 rounded-t-lg relative group-hover:bg-slate-700/50 transition-colors" style={{ height: `${[100, 60, 25, 10, 5][i]}%` }}></div>
                  <div className="w-full bg-indigo-500/80 rounded-t-lg relative group-hover:bg-indigo-500 transition-colors" style={{ height: `${val}%` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {val}% Retention
                    </div>
                  </div>
                  <div className="text-center text-xs text-slate-500 mt-2">
                    {['Day 1', 'Day 2', 'Day 7', 'Day 30', 'Day 60'][i]}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Points */}
          <div className="space-y-6">
            {[
              { icon: Brain, title: "Based on Science", desc: "Leverages the psychological spacing effect to improve retention by 200%.", color: "text-blue-400", bg: "bg-blue-500/10" },
              { icon: Zap, title: "Efficient Learning", desc: "Review material just before you forget it. No more cramming.", color: "text-purple-400", bg: "bg-purple-500/10" },
              { icon: Target, title: "Personalized Schedule", desc: "Adapts to your performance. Harder cards appear more often.", color: "text-green-400", bg: "bg-green-500/10" },
              { icon: TrendingUp, title: "Long-Term Mastery", desc: "Retain knowledge for years, not just days.", color: "text-amber-400", bg: "bg-amber-500/10" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.bg} ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-white mb-1">{item.title}</h4>
                  <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MotivationSection;