import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const HeartAnimation = ({ position }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Auto-remove after animation
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="heart-animation"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
      initial={{ scale: 0, opacity: 1 }}
      animate={{ 
        scale: [0, 1.2, 1],
        opacity: [1, 1, 0],
        y: [0, -50, -100]
      }}
      transition={{
        duration: 1,
        times: [0, 0.3, 1],
        ease: "easeOut"
      }}
    >
      ❤️
    </motion.div>
  );
};

export default HeartAnimation;