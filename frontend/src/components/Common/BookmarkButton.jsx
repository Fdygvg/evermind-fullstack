import React, { useState } from 'react';
import { FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { questionService } from '../../services/question';
import { useSound } from '../../hooks/useSound';

const BookmarkButton = ({ questionId, initialIsBookmarked, onToggle }) => {
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);
    const [isLoading, setIsLoading] = useState(false);
    const { playSound } = useSound();

    const handleToggle = async (e) => {
        e.stopPropagation();
        if (isLoading) return;

        setIsLoading(true);
        // Optimistic update
        const newValue = !isBookmarked;
        setIsBookmarked(newValue);

        if (newValue) {
            playSound('ding'); // Or a generic 'click' sound if available
        }

        try {
            await questionService.toggleBookmark(questionId);
            if (onToggle) onToggle(newValue);
        } catch (error) {
            console.error("Failed to toggle bookmark:", error);
            // Revert if failed
            setIsBookmarked(!newValue);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.button
            className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
            onClick={handleToggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            disabled={isLoading}
            style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                outline: 'none',
                color: isBookmarked ? 'var(--color-accent, #F59E0B)' : 'var(--color-text-secondary, #6B7280)', // Use theme color or default gold/gray
            }}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark Question"}
        >
            <AnimatePresence mode="wait">
                {isBookmarked ? (
                    <motion.div
                        key="filled"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                        {/* Shining animation effect wrapper could go here if CSS keyframes are used, 
                         but motion usually handles entry. 
                         For "shining", we can add a glow filter or specific animation.
                     */}
                        <FaBookmark size={20} style={{ filter: 'drop-shadow(0 0 2px currentColor)' }} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="outline"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                    >
                        <FaRegBookmark size={20} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Shine Effect (CSS driven usually, or motion) */}
            {isBookmarked && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 1, 0], scale: 1.5, rotate: 45 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        x: '-50%',
                        y: '-50%',
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
                        pointerEvents: 'none',
                        zIndex: -1
                    }}
                />
            )}
        </motion.button>
    );
};

export default BookmarkButton;
