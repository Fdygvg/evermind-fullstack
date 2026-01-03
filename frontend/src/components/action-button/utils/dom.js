// src/components/action-button/utils/dom.js

/**
 * Check if an element is visible in the viewport
 * @param {HTMLElement} element - Element to check
 * @param {number} threshold - Percentage of element that must be visible (0-1)
 * @returns {boolean}
 */
export const isElementVisible = (element, threshold = 0) => {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    const verticalVisible = rect.top < windowHeight && rect.bottom > 0;
    const horizontalVisible = rect.left < windowWidth && rect.right > 0;

    if (!verticalVisible || !horizontalVisible) return false;

    if (threshold > 0) {
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
        const visibleArea = visibleHeight * visibleWidth;
        const totalArea = rect.height * rect.width;

        return visibleArea / totalArea >= threshold;
    }

    return true;
};

/**
 * Scroll an element into view smoothly
 * @param {HTMLElement} element - Element to scroll to
 * @param {Object} options - Scroll options
 */
export const scrollIntoView = (element, options = {}) => {
    if (!element) return;

    const { behavior = 'smooth', block = 'center', inline = 'nearest' } = options;

    element.scrollIntoView({ behavior, block, inline });
};

/**
 * Focus an element with optional scroll prevention
 * @param {HTMLElement} element - Element to focus
 * @param {Object} options - Focus options
 */
export const focusElement = (element, options = {}) => {
    if (!element) return;

    const { preventScroll = false } = options;

    element.focus({ preventScroll });
};

/**
 * Trap focus within a container (for modals)
 * @param {HTMLElement} container - Container element
 * @returns {Function} - Cleanup function
 */
export const trapFocus = (container) => {
    if (!container) return () => { };

    const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement?.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement?.focus();
            }
        }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
        container.removeEventListener('keydown', handleKeyDown);
    };
};

/**
 * Get all focusable elements within a container
 * @param {HTMLElement} container - Container element
 * @returns {HTMLElement[]} - Array of focusable elements
 */
export const getFocusableElements = (container) => {
    if (!container) return [];

    return Array.from(container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    ));
};

/**
 * Check if element is within another element
 * @param {HTMLElement} child - Child element
 * @param {HTMLElement} parent - Parent element
 * @returns {boolean}
 */
export const isDescendant = (child, parent) => {
    if (!child || !parent) return false;

    let node = child.parentNode;
    while (node !== null) {
        if (node === parent) return true;
        node = node.parentNode;
    }
    return false;
};

/**
 * Get the position of an element relative to the viewport
 * @param {HTMLElement} element - Element to get position of
 * @returns {Object} - Position object with top, left, right, bottom, width, height
 */
export const getElementPosition = (element) => {
    if (!element) return null;

    const rect = element.getBoundingClientRect();

    return {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
    };
};
