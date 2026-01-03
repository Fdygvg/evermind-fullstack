// src/components/action-button/hooks/useFabAnimation.js
import { useMemo } from 'react';

const useFabAnimation = (isOpen) => {
  const getItemAnimationStyle = (index) => {
    if (!isOpen) {
      return {
        opacity: 0,
        transform: 'translateY(20px)',
        pointerEvents: 'none',
      };
    }

    // Staggered animation: each item appears with a delay
    const baseDelay = 0.05; // seconds between items
    const delay = index * baseDelay;
    
    return {
      opacity: 1,
      transform: 'translateY(0)',
      pointerEvents: 'auto',
      transitionDelay: `${delay}s`,
      bottom: `${(index + 1) * 60 + 16}px`, // Position above FAB
    };
  };

  return { getItemAnimationStyle };
};

export default useFabAnimation;