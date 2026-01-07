// frontend/src/components/homepage/SocialProof.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Clock, TrendingUp, Star, Quote, Award } from 'lucide-react';

const SocialProof = () => {
  const stats = [
    { icon: <Users />, value: '2,500+', label: 'Active Learners', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: <Target />, value: '94%', label: 'Retention Rate', color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: <Clock />, value: '2.3x', label: 'Faster Learning', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { icon: <TrendingUp />, value: '85%', label: 'Daily Stickiness', color: 'text-amber-400', bg: 'bg-amber-500/10' }
  ];

  const testimonials = [
    {
      name: 'Alex Johnson',
      role: 'Software Engineer',
      content: 'EVERMIND helped me learn React in 6 weeks. The spaced repetition actually works - I still remember concepts months later.',
      rating: 5
    },
    {
      name: 'Sam Rivera',
      role: 'Medical Student',
      content: 'The four review modes kept studying engaging. TikTok mode makes quick reviews actually fun.',
      rating: 5
    },
    {
      name: 'Taylor Chen',
      role: 'Polyglot',
      content: 'Smart rating system is genius. I can finally manage hundreds of vocabulary cards without feeling overwhelmed.',
      rating: 5
    },
    {
      name: 'Jordan Lee',
      role: 'Law Student',
      content: 'Elimination mode changed how I prep for exams. seeing the list shrink gives me huge motivation.',
      rating: 5
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-slate-900 border-t border-slate-800">
      <div className="container mx-auto px-4 relative z-10">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm text-center hover:bg-slate-800 transition-colors"
            >
              <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4 ${stat.bg} ${stat.color}`}>
                {React.cloneElement(stat.icon, { className: "w-6 h-6" })}
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials Marquee */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm font-medium mb-6"
          >
            <Star className="w-4 h-4" />
            <span>Loved by Learners</span>
          </motion.div>
          <h2 className="text-4xl font-bold mb-4">
            Don't just take our <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">word for it</span>
          </h2>
        </div>

        <div className="relative w-full overflow-hidden mask-image-linear-gradient">
          <div className="flex gap-6 animate-marquee">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[350px] p-8 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-md"
              >
                <div className="flex gap-1 text-amber-400 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-slate-300 text-lg mb-6 leading-relaxed">"{t.content}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white">{t.name}</div>
                    <div className="text-sm text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Gradient Fade Edges */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-900 to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-900 to-transparent z-10" />
        </div>

      </div>
    </section>
  );
};

export default SocialProof;