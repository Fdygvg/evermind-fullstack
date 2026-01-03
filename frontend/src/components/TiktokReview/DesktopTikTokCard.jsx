import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeartAnimation from './HeartAnimation';
import '../../css/DesktopTikTokCard.css';

const DesktopTikTokCard = ({
  question,
  showAnswer,
  onDoubleTap,
  doubleTapPosition
}) => {
  const [lastClick, setLastClick] = useState(0);
  const cardRef = useRef(null);

  const handleDoubleClick = (e) => {
    const currentTime = new Date().getTime();
    const clickLength = currentTime - lastClick;

    if (clickLength < 300 && clickLength > 0) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      onDoubleTap({ x, y });
    }
    setLastClick(currentTime);
  };

  return (
    <motion.div
      ref={cardRef}
      className="desktop-tiktok-card"
      onDoubleClick={handleDoubleClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence>
        {doubleTapPosition && (
          <HeartAnimation position={doubleTapPosition} />
        )}
      </AnimatePresence>

      <div className="desktop-card-content">
        <motion.div
          className="desktop-question-text"
          animate={showAnswer ? { opacity: 0.5 } : { opacity: 1 }}
        >
          {question.question}
        </motion.div>

        <AnimatePresence>
          {showAnswer && (
            <motion.div
              className="desktop-answer-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1 }}
            >
              {question.answer}
              {question.isCode && (
                <pre className="desktop-code-block">
                  <code>{question.answer}</code>
                </pre>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!showAnswer && (
          <motion.div
            className="desktop-tap-hint"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Double-click to reveal answer
            <div className="keyboard-hint">
              (or press SPACE)
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default DesktopTikTokCard;