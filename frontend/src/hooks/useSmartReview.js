// frontend/src/hooks/useSmartReview.js
import { useContext } from 'react';
import { SmartReviewContext } from '../context/SmartReviewContext';

export const useSmartReview = () => {
    const context = useContext(SmartReviewContext);

    if (!context) {
        throw new Error('useSmartReview must be used within a SmartReviewProvider');
    }

    return context;
};