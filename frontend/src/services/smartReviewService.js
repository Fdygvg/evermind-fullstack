// frontend/src/services/smartReviewService.js
import API from './api';

export const smartReviewService = {
    /**
     * Get today's questions for smart review
     */
    getTodaysQuestions: (sectionIds) => {
        const sectionParam = Array.isArray(sectionIds)
            ? sectionIds.join(',')
            : sectionIds;

        return API.get('/smart-review/today', {
            params: { sectionIds: sectionParam }
        });
    },

    /**
     * Rate a question (1-5)
     */
    recordRating: (questionId, rating) => {
        return API.post('/smart-review/rate', {
            questionId,
            rating
        });
    },

    /**
     * Get rolled-over questions
     */
    getRolledOverQuestions: (sectionIds) => {
        const sectionParam = Array.isArray(sectionIds)
            ? sectionIds.join(',')
            : sectionIds;

        return API.get('/smart-review/rolled-over', {
            params: { sectionIds: sectionParam }
        });
    },

    /**
     * Add more questions to today's session
     */
    addMoreQuestions: (questionIds) => {
        return API.post('/smart-review/add-more', {
            questionIds
        });
    },

    /**
     * Get smart review statistics
     */
    getReviewStats: () => {
        return API.get('/smart-review/stats');
    },

    /**
     * Reset a question's priority (for undo)
     */
    resetQuestionPriority: (questionId, priority = 0) => {
        return API.post(`/smart-review/reset/${questionId}`, {
            priority
        });
    },

    /**
     * Get question priority info
     */
    getQuestionPriority: (questionId) => {
        return API.get(`/smart-review/question/${questionId}`);
    },

    /**
     * Update priorities for overdue questions
     */
    updatePriorities: () => {
        return API.post('/smart-review/update-priorities');
    },

    /**
     * Get priority label and color for display
     */
    getPriorityInfo: (priority) => {
        const priorityMap = {
            0: { label: 'New', color: '#8b5cf6', emoji: '🆕' },
            1: { label: 'Urgent', color: '#ef4444', emoji: '🔥' },
            2: { label: 'High', color: '#f97316', emoji: '⏰' },
            3: { label: 'Medium', color: '#eab308', emoji: '📅' },
            4: { label: 'Low', color: '#22c55e', emoji: '🌱' },
            5: { label: 'Mastered', color: '#3b82f6', emoji: '⭐' }
        };

        return priorityMap[priority] || {
            label: 'Unknown',
            color: '#6b7280',
            emoji: '❓'
        };
    },

    /**
     * Get rating info for display
     */
    getRatingInfo: (rating) => {
        const ratingMap = {
            1: { label: 'Hard', color: '#ef4444', emoji: '😫', interval: 'Today' },
            2: { label: 'Medium', color: '#f97316', emoji: '😕', interval: '1 day' },
            3: { label: 'Good', color: '#eab308', emoji: '😐', interval: '3 days' },
            4: { label: 'Easy', color: '#22c55e', emoji: '🙂', interval: '7 days' },
            5: { label: 'Perfect', color: '#3b82f6', emoji: '😄', interval: '14 days' }
        };

        return ratingMap[rating] || {
            label: 'Unknown',
            color: '#6b7280',
            emoji: '❓',
            interval: 'Unknown'
        };
    },

    /**
     * Calculate progress percentage
     */
    calculateProgress: (current, total) => {
        if (total === 0) return { percentage: 0, status: 'empty' };

        const percentage = Math.round((current / total) * 100);

        let status;
        if (percentage >= 100) status = 'complete';
        else if (percentage >= 75) status = 'high';
        else if (percentage >= 50) status = 'medium';
        else if (percentage >= 25) status = 'low';
        else status = 'very-low';

        return { percentage, status };
    },

    /**
     * Get section progress
     */
    getSectionProgress: (sectionIds) => {
        const sectionParam = Array.isArray(sectionIds)
            ? sectionIds.join(',')
            : sectionIds;

        return API.get('/smart-review/progress', {
            params: { sectionIds: sectionParam }
        });
    },

    /**
     * Mark unrated questions as PENDING for next session
     */
    markUnratedAsPending: (sectionIds, ratedQuestionIds) => {
        return API.post('/smart-review/mark-pending', {
            sectionIds,
            ratedQuestionIds
        });
    }
};