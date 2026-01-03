// src/components/action-button/utils/animations.js

/**
 * Animation timing presets
 */
export const TIMING = {
    fast: 150,
    normal: 300,
    slow: 500,
};

/**
 * Easing functions for animations
 */
export const EASING = {
    easeOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

/**
 * Create a staggered delay for a list of items
 * @param {number} index - Item index
 * @param {number} baseDelay - Base delay between items (ms)
 * @returns {number} - Delay in milliseconds
 */
export const getStaggerDelay = (index, baseDelay = 50) => {
    return index * baseDelay;
};

/**
 * Create CSS transition string
 * @param {string[]} properties - CSS properties to transition
 * @param {Object} options - Transition options
 * @returns {string} - CSS transition value
 */
export const createTransition = (properties, options = {}) => {
    const { duration = TIMING.normal, easing = EASING.easeOut, delay = 0 } = options;

    return properties
        .map(prop => `${prop} ${duration}ms ${easing} ${delay}ms`)
        .join(', ');
};

/**
 * Get animation style for FAB items
 * @param {number} index - Item index
 * @param {boolean} isOpen - Whether FAB is open
 * @returns {Object} - Style object
 */
export const getFabItemStyle = (index, isOpen) => {
    if (!isOpen) {
        return {
            opacity: 0,
            transform: 'translateY(20px) scale(0.8)',
            pointerEvents: 'none',
        };
    }

    return {
        opacity: 1,
        transform: 'translateY(0) scale(1)',
        pointerEvents: 'auto',
        transitionDelay: `${getStaggerDelay(index)}ms`,
    };
};

/**
 * Get animation style for modal
 * @param {boolean} isOpen - Whether modal is open
 * @returns {Object} - Style object
 */
export const getModalStyle = (isOpen) => {
    if (!isOpen) {
        return {
            opacity: 0,
            transform: 'translateY(20px)',
            visibility: 'hidden',
        };
    }

    return {
        opacity: 1,
        transform: 'translateY(0)',
        visibility: 'visible',
    };
};

/**
 * Create pulse animation keyframes
 * @param {string} color - Color for the pulse (RGB format)
 * @returns {string} - CSS keyframes
 */
export const createPulseKeyframes = (color = '255, 0, 0') => `
  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(${color}, 0.4);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(${color}, 0);
    }
  }
`;

/**
 * Helper to check if user prefers reduced motion
 * @returns {boolean}
 */
export const prefersReducedMotion = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get safe animation duration respecting reduced motion preference
 * @param {number} duration - Desired duration
 * @returns {number} - Safe duration (0 if reduced motion preferred)
 */
export const getSafeDuration = (duration) => {
    return prefersReducedMotion() ? 0 : duration;
};
