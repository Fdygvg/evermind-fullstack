import { useMemo } from 'react';

/**
 * Custom hook to calculate and manage daily limits
 * @param {Object} params - Calculation parameters
 * @param {number} params.totalQuestions - Total questions selected
 * @param {number} params.newQuestions - Number of new questions (priority 0)
 * @param {number} params.missedDays - Days user missed reviews (for backlog)
 * @returns {Object} - Daily limit calculations and helpers
 */
export const useDailyLimit = ({
    totalQuestions = 0,
    newQuestions = 0,
    missedDays = 0
}) => {

    const calculations = useMemo(() => {
        // Base: 50% of all selected questions
        const baseLimit = Math.ceil(totalQuestions * 0.5);

        // Bonus: 50% of new questions
        const bonusAllowance = Math.ceil(newQuestions * 0.5);

        // Backlog acceleration: +10% per missed day, max +50%
        const backlogMultiplier = 1 + Math.min(missedDays * 0.1, 0.5);

        // Final daily limit
        const dailyLimit = Math.ceil((baseLimit + bonusAllowance) * backlogMultiplier);

        // Calculate rollover if any
        const estimatedTodayQuestions = Math.min(totalQuestions, dailyLimit);
        const estimatedRollover = Math.max(0, totalQuestions - dailyLimit);

        // Calculate percentages for UI
        const newQuestionsPercentage = newQuestions > 0
            ? Math.round((newQuestions / totalQuestions) * 100)
            : 0;

        const bonusPercentage = Math.round((bonusAllowance / dailyLimit) * 100);

        return {
            // Core values
            baseLimit,
            bonusAllowance,
            backlogMultiplier: backlogMultiplier > 1 ? backlogMultiplier : null,
            dailyLimit,

            // Derived values
            estimatedTodayQuestions,
            estimatedRollover,

            // Percentages for UI
            newQuestionsPercentage,
            bonusPercentage,

            // Status flags
            hasBonus: bonusAllowance > 0,
            hasBacklogBoost: backlogMultiplier > 1,
            willRollover: estimatedRollover > 0,

            // Recommendations
            recommendation: getRecommendation(dailyLimit, totalQuestions, newQuestions)
        };
    }, [totalQuestions, newQuestions, missedDays]);

    return calculations;
};

/**
 * Get user-friendly recommendation based on daily limit
 */
function getRecommendation(dailyLimit, totalQuestions, newQuestions) {
    if (totalQuestions === 0) {
        return { type: 'empty', message: 'No questions selected' };
    }

    if (dailyLimit >= 100) {
        return {
            type: 'high',
            message: 'Heavy review day. Consider breaking into multiple sessions.'
        };
    }

    if (dailyLimit >= 50) {
        return {
            type: 'medium',
            message: 'Moderate review load. Good pace for learning.'
        };
    }

    if (newQuestions > 0 && newQuestions >= dailyLimit * 0.5) {
        return {
            type: 'new-heavy',
            message: 'Focus day on new material. Good for learning concepts.'
        };
    }

    return {
        type: 'light',
        message: 'Light review day. Good for reinforcement.'
    };
}