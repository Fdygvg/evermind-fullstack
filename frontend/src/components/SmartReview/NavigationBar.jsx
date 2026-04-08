import React from 'react';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaRotateLeft } from 'react-icons/fa6';

const NavigationBar = ({ onLeft, onRight, onReturn, canLeft, canRight }) => {
  const btnBase = {
    border: 'none',
    borderRadius: '12px',
    padding: '10px 20px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
  };

  const navBtn = (enabled) => ({
    ...btnBase,
    background: enabled
      ? 'rgba(255, 255, 255, 0.98)'
      : 'rgba(255, 255, 255, 0.05)',
    color: enabled
      ? 'var(--color-primary, #8B5CF6)'
      : 'rgba(255, 255, 255, 0.2)',
    opacity: enabled ? 1 : 0.3,
    cursor: enabled ? 'pointer' : 'not-allowed',
    border: `1px solid ${enabled ? 'var(--color-primary, #8B5CF6)' : 'transparent'}`,
  });

  const returnBtn = {
    ...btnBase,
    background: '#fff',
    color: 'var(--color-primary, #8B5CF6)',
    border: '3px solid var(--color-primary, #8B5CF6)',
    boxShadow: '0 0 25px rgba(139, 92, 246, 0.4)',
    padding: '10px 32px',
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      marginTop: '16px',
      background: 'rgba(30, 41, 59, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '24px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
    }}>
      {/* Left */}
      <motion.button
        onClick={canLeft ? onLeft : undefined}
        whileHover={canLeft ? { scale: 1.05 } : {}}
        whileTap={canLeft ? { scale: 0.95 } : {}}
        style={navBtn(canLeft)}
        disabled={!canLeft}
        title="Previous question"
      >
        <FaChevronLeft size={14} /> Prev
      </motion.button>

      {/* Return */}
      <motion.button
        onClick={onReturn}
        whileHover={{ scale: 1.1, backgroundColor: '#fdfaff' }}
        whileTap={{ scale: 0.9 }}
        style={returnBtn}
        title="Return to current question"
      >
        <FaRotateLeft size={20} style={{ strokeWidth: '3.5' }} />
      </motion.button>

      {/* Right */}
      <motion.button
        onClick={canRight ? onRight : undefined}
        whileHover={canRight ? { scale: 1.05 } : {}}
        whileTap={canRight ? { scale: 0.95 } : {}}
        style={navBtn(canRight)}
        disabled={!canRight}
        title="Next question"
      >
        Next <FaChevronRight size={14} />
      </motion.button>
    </div>
  );
};

export default NavigationBar;
