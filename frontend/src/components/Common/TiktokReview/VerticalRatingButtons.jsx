import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './VerticalRatingButtons.css';

const VerticalRatingButtons = ({ onRate, disabled }) => {
  const [selected, setSelected] = useState(null);
  
  const buttons = [
    { id: 1, icon: '🔘', label: '1', color: 'var(--color-primary)' },    // Circle
    { id: 2, icon: '❤️', label: '2', color: 'var(--color-secondary)' },  // Heart
    { id: 3, icon: '💬', label: '3', color: 'var(--color-accent)' },     // Comment
    { id: 4, icon: '🔖', label: '4', color: 'var(--color-success)' },    // Bookmark
    { id: 5, icon: '➡️', label: '5', color: 'var(--color-border)' },     // Arrow
  ];

  const handleClick = async (id) => {
    if (disabled) return;
    
    setSelected(id);
    await onRate(id);
    
    // Reset selection after animation
    setTimeout(() => setSelected(null), 300);
  };

  return (
    <div className="vertical-rating-buttons">
      {buttons.map((btn) => (
        <motion.button
          key={btn.id}
          className={`rating-icon ${selected === btn.id ? 'selected' : ''}`}
          onClick={() => handleClick(btn.id)}
          disabled={disabled}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          style={{
            '--btn-color': btn.color,
          }}
        >
          <span className="icon">{btn.icon}</span>
          {selected === btn.id && (
            <motion.span 
              className="label"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {btn.label}
            </motion.span>
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default VerticalRatingButtons;