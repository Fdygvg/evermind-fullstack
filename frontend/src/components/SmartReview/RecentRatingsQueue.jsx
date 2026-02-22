import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RATING_COLORS = {
    1: '#dc2626', // Hard - Red
    2: '#f59e0b', // Medium - Amber
    3: '#3b82f6', // Good - Blue
    4: '#10b981', // Easy - Green
    5: '#06b6d4'  // Perfect - Cyan
};

const RecentRatingsQueue = ({ ratingHistory, maxItems = 5 }) => {
    if (!ratingHistory || ratingHistory.length === 0) return null;

    // Get the last N items for the queue
    const recentRatings = ratingHistory.slice(-maxItems);

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '16px',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch', // Make children fill height
                    background: 'var(--color-surface, rgba(255, 255, 255, 0.05))',
                    borderRadius: '9999px',
                    width: '100%',
                    maxWidth: '300px',
                    height: '24px', // Taller, progress-bar style
                    overflow: 'hidden',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
                }}
            >
                <AnimatePresence initial={false}>
                    {recentRatings.map((item, index) => {
                        // Ensure a unique key that tied to the specific rating instance
                        const stableKey = `${item.questionId || 'q'}-${index}-${item.rating}`;
                        const isLast = index === recentRatings.length - 1;

                        return (
                            <motion.div
                                key={stableKey}
                                layout
                                initial={{ opacity: 0, flex: 0 }}
                                animate={{ opacity: 1, flex: 1 }}
                                exit={{ opacity: 0, flex: 0 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 30,
                                    mass: 0.8
                                }}
                                style={{
                                    height: '100%',
                                    backgroundColor: RATING_COLORS[item.rating] || '#8B5CF6',
                                    // Add subtle separator except for the last item
                                    borderRight: !isLast ? '1px solid rgba(255,255,255,0.15)' : 'none',
                                    position: 'relative'
                                }}
                                title={`Rating: ${item.rating}`}
                            >
                                {/* Optional: The exact user image had a tiny ring on the latest segment, 
                                    we can add an ultra-minimal indicator here if desired, 
                                    but pure color blocks is cleaner. Let's add a pulse to the newest one. */}
                                {isLast && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 0.5 }}
                                        style={{
                                            position: 'absolute',
                                            right: '6px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            border: '2px solid rgba(255,255,255,0.8)',
                                            backgroundColor: 'transparent'
                                        }}
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RecentRatingsQueue;
