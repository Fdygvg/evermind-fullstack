import SmartReviewService from '../services/smartReviewService.js';
import Question from '../models/Question.js';
import SectionProgress from '../models/SectionProgress.js';
import SMART_REVIEW_CONFIG from '../config/smartReviewConfig.js';

/**
 * @desc    Get today's smart review questions
 * @route   GET /api/smart-review/today
 * @access  Private
 * @location /api/smart-review/today
 */
const getTodaysQuestions = async (req, res) => {
    try {
        const userId = req.userId;
        const { sectionIds } = req.query;

        if (!sectionIds || sectionIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please select at least one section'
            });
        }

        // Convert comma-separated string to array if needed
        const sectionArray = Array.isArray(sectionIds)
            ? sectionIds
            : sectionIds.split(',');

        // Reset the alreadyAdvancedThisSession flag ONLY if it's a new calendar day
        const today = new Date().setHours(0, 0, 0, 0);
        await SectionProgress.updateMany(
            { 
                userId, 
                sectionId: { $in: sectionArray },
                $or: [
                    { lastSessionDate: { $lt: today } },
                    { lastSessionDate: null }
                ]
            },
            { 
                alreadyAdvancedThisSession: false,
                lastSessionDate: new Date()
            }
        );

        const result = await SmartReviewService.getTodaysQuestions(
            userId,
            sectionArray
        );

        res.status(200).json(result);

    } catch (error) {
        console.error('Error in getTodaysQuestions controller:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @desc    Record a rating for a question
 * @route   POST /api/smart-review/rate
 * @access  Private
 * @location /api/smart-review/rate
 */


const recordRating = async (req, res) => {
    try {
        const userId = req.userId;
        const { questionId, rating } = req.body;

        // Validation
        if (!questionId) {
            return res.status(400).json({
                success: false,
                message: 'Question ID is required'
            });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Get the question first to know which section it belongs to
        const question = await Question.findOne({
            _id: questionId,
            userId
        }).select('sectionId');

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        // 1. Record the rating (updates priority, dueDate, clears isPending, etc.)
        const ratingResult = await SmartReviewService.recordRating(
            userId,
            questionId,
            rating,
            question.sectionId  // Pass sectionId to get currentSessionDay
        );

        // 2. CHECK IF SECTION SHOULD ADVANCE (80% completion threshold)
        const sectionProgress = await SectionProgress.findOne({
            userId,
            sectionId: question.sectionId
        });

        let sectionAdvanced = false;
        let newSessionDay = null;
        let completionPercentage = 0;

        if (sectionProgress && !sectionProgress.alreadyAdvancedThisSession) {
            // Get current session day (virtual day number, not calendar date!)
            const currentSessionDay = sectionProgress.currentSessionDay;

            // Count total questions for this section's current session day (THREE TRACKS)
            // Use currentSessionDay (Number) to compare with dueDate (Number)
            const totalQuestions = await Question.countDocuments({
                userId,
                sectionId: question.sectionId,
                $or: [
                    { priority: 0 },                    // NEW - unlimited
                    { isPending: true },                // PENDING - unlimited
                    { 
                        dueDate: { $lte: currentSessionDay },  // REVIEW - due on or before this session day (Number comparison)
                        priority: { $gt: 0, $lte: 5 },
                        isPending: { $ne: true }
                    }
                ]
            });

            // Count questions rated in THIS SESSION
            // Use lastReviewed timestamp from section progress as reference point
            // Questions rated after the section's last advancement count toward this session
            const sessionStartTime = sectionProgress.lastReviewed || 
                                    sectionProgress.lastSessionDate || 
                                    new Date(Date.now() - 24 * 60 * 60 * 1000); // Fallback: last 24 hours
            
            const ratedInSession = await Question.countDocuments({
                userId,
                sectionId: question.sectionId,
                priority: { $gt: 0, $lte: 5 },  // Only count REVIEW questions (excludes NEW)
                isPending: false,                // Exclude PENDING
                // Questions that are due on or before current session day
                dueDate: { $lte: currentSessionDay },
                // Rated since the section's last advancement (or last 24h if no advancement yet)
                lastReviewedAt: { $gte: sessionStartTime }
            });

            // Calculate completion percentage
            // Only count REVIEW questions for advancement (NEW and PENDING don't count toward advancement)
            const reviewQuestions = await Question.countDocuments({
                userId,
                sectionId: question.sectionId,
                dueDate: { $lte: currentSessionDay },
                priority: { $gt: 0, $lte: 5 },
                isPending: { $ne: true }
            });

            completionPercentage = reviewQuestions > 0 
                ? Math.round((ratedInSession / reviewQuestions) * 100)
                : 0;

            // Advance if >= 80% complete
            if (completionPercentage >= (SMART_REVIEW_CONFIG.ADVANCEMENT_THRESHOLD * 100)) {
                sectionProgress.currentSessionDay += 1;
                sectionProgress.totalSessions += 1;
                sectionProgress.alreadyAdvancedThisSession = true;
                sectionProgress.lastReviewed = new Date();
                await sectionProgress.save();

                sectionAdvanced = true;
                newSessionDay = sectionProgress.currentSessionDay;
            }
        }

        res.status(200).json({
            ...ratingResult,
            sectionAdvanced: {
                sectionId: question.sectionId,
                advanced: sectionAdvanced,
                newSessionDay: newSessionDay,
                completionPercentage,
                message: sectionAdvanced
                    ? `Section advanced to Day ${newSessionDay} (${completionPercentage}% complete)`
                    : sectionProgress?.alreadyAdvancedThisSession
                        ? 'Already advanced this session'
                        : `${completionPercentage}% complete (need 80% to advance)`
            },
            message: getRatingMessage(rating)
        });

    } catch (error) {
        console.error('Error in recordRating controller:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
/**
 * @desc    Add more questions to today's session
 * @route   POST /api/smart-review/add-more
 * @access  Private
 */
const addMoreQuestions = async (req, res) => {
    try {
        const userId = req.userId;
        const { questionIds } = req.body;

        if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide question IDs to add'
            });
        }

        const result = await SmartReviewService.addMoreQuestions(
            userId,
            questionIds
        );

        res.status(200).json({
            ...result,
            message: `Added ${result.addedCount} more questions to today's review`
        });

    } catch (error) {
        console.error('Error in addMoreQuestions controller:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @desc    Get rolled-over questions (for "Add More" button)
 * @route   GET /api/smart-review/rolled-over
 * @access  Private
 */
const getRolledOverQuestions = async (req, res) => {
    try {
        const userId = req.userId;
        const { sectionIds } = req.query;

        if (!sectionIds) {
            return res.status(400).json({
                success: false,
                message: 'Section IDs are required'
            });
        }

        const sectionArray = Array.isArray(sectionIds)
            ? sectionIds
            : sectionIds.split(',');

        // Get questions that were rolled over
        // Note: dueDate is now a session day number, not a calendar date
        // So we just get all rolled over questions for these sections
        const rolledOverQuestions = await Question.find({
            userId,
            sectionId: { $in: sectionArray },
            wasRolledOver: true
        }).select('_id question answer priority');

        res.status(200).json({
            success: true,
            questions: rolledOverQuestions,
            count: rolledOverQuestions.length
        });

    } catch (error) {
        console.error('Error in getRolledOverQuestions controller:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @desc    Get smart review statistics
 * @route   GET /api/smart-review/stats
 * @access  Private
 */
const getReviewStats = async (req, res) => {
    try {
        const userId = req.userId;

        const [
            totalQuestions,
            newQuestions,
            overdueQuestions,
            todayReviewed,
            priorityDistribution
        ] = await Promise.all([
            // Total questions
            Question.countDocuments({ userId }),

            // New questions (never reviewed)
            Question.countDocuments({
                userId,
                priority: 0
            }),

            // Overdue questions (questions that are due in at least one section)
            // Note: In virtual session day system, "overdue" means dueDate <= currentSessionDay
            // Since we don't have section context here, we'll count questions with dueDate = 0 (due immediately)
            // For a more accurate count, we'd need to check each section's currentSessionDay
            Question.countDocuments({
                userId,
                dueDate: { $lte: 0 },  // Due immediately or overdue
                priority: { $gt: 0 }
            }),

            // Questions reviewed today
            Question.countDocuments({
                userId,
                lastReviewedAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0))
                }
            }),

            // Priority distribution
            Question.aggregate([
                { $match: { userId } },
                {
                    $group: {
                        _id: '$priority',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        // Calculate estimated daily limit
        const estimatedDailyLimit = Math.ceil(totalQuestions * 0.5) +
            Math.ceil(newQuestions * 0.5);

        res.status(200).json({
            success: true,
            stats: {
                totalQuestions,
                newQuestions,
                overdueQuestions,
                todayReviewed,
                estimatedDailyLimit,
                priorityDistribution: priorityDistribution.reduce((acc, curr) => {
                    acc[`priority${curr._id}`] = curr.count;
                    return acc;
                }, {})
            }
        });

    } catch (error) {
        console.error('Error in getReviewStats controller:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @desc    Update priorities for overdue questions (admin/cron)
 * @route   POST /api/smart-review/update-priorities
 * @access  Private
 */
const updatePriorities = async (req, res) => {
    try {
        const userId = req.userId;

        const result = await SmartReviewService.updateOverduePriorities(userId);

        res.status(200).json({
            ...result,
            message: `Updated priorities for ${result.updatedCount} questions`
        });

    } catch (error) {
        console.error('Error in updatePriorities controller:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @desc    Get question priority info
 * @route   GET /api/smart-review/question/:id
 * @access  Private
 */
const getQuestionPriority = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;

        const question = await Question.findOne({
            _id: id,
            userId
        }).select('priority lastRating dueDate timesReviewed lastReviewedAt sectionId');

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        // Get section's current session day to calculate sessions until review
        const sectionProgress = await SectionProgress.findOne({
            userId,
            sectionId: question.sectionId
        });
        const currentSessionDay = sectionProgress ? sectionProgress.currentSessionDay : 1;

        res.status(200).json({
            success: true,
            question: {
                id: question._id,
                priority: question.priority,
                lastRating: question.lastRating,
                dueDate: question.dueDate, // Now a number (session day)
                timesReviewed: question.timesReviewed,
                lastReviewed: question.lastReviewedAt,
                isDue: question.dueDate <= currentSessionDay, // Compare session days
                sessionsUntilReview: SmartReviewService.sessionsUntil(question.dueDate, currentSessionDay)
            }
        });

    } catch (error) {
        console.error('Error in getQuestionPriority controller:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @desc    Reset a question's priority (for testing/undo)
 * @route   POST /api/smart-review/reset/:id
 * @access  Private
 */
const resetQuestionPriority = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        const { priority = 0 } = req.body;

        const question = await Question.findOneAndUpdate(
            { _id: id, userId },
            {
                priority,
                lastRating: null,
                wasRolledOver: false,
                consecutiveMisses: 0,
                lastReviewedAt: null
            },
            { new: true }
        ).select('_id question priority');

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `Question priority reset to ${priority}`,
            question
        });

    } catch (error) {
        console.error('Error in resetQuestionPriority controller:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Helper function: Get friendly message for rating
 */
function getRatingMessage(rating) {
    const messages = {
        1: "Don't worry! This question will show up again soon.",
        2: "Getting there! Review this again tomorrow.",
        3: "Good job! See this again in a few days.",
        4: "Excellent! You'll see this in a week.",
        5: "Perfect! You know this well. Review in two weeks."
    };

    return messages[rating] || "Rating recorded.";
}

/**
 * @desc    Get section progress for selected sections
 * @route   GET /api/smart-review/progress
 * @access  Private
 */
const getSectionProgress = async (req, res) => {
    try {
        const userId = req.userId;
        const { sectionIds } = req.query;

        if (!sectionIds || sectionIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide section IDs'
            });
        }

        // Convert comma-separated string to array if needed
        const sectionArray = Array.isArray(sectionIds)
            ? sectionIds
            : sectionIds.split(',');

        // Get progress for all sections
        const progresses = await SectionProgress.find({
            userId,
            sectionId: { $in: sectionArray }
        });

        // Convert to object keyed by sectionId
        const progressMap = {};
        progresses.forEach(progress => {
            progressMap[progress.sectionId.toString()] = {
                currentSessionDay: progress.currentSessionDay,
                totalSessions: progress.totalSessions,
                lastReviewed: progress.lastReviewed,
                alreadyAdvancedThisSession: progress.alreadyAdvancedThisSession
            };
        });

        res.status(200).json({
            success: true,
            progresses: progressMap
        });

    } catch (error) {
        console.error('Error in getSectionProgress controller:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * @desc    Mark unrated questions as PENDING for next session
 * @route   POST /api/smart-review/mark-pending
 * @access  Private
 */
const markUnratedAsPending = async (req, res) => {
    try {
        const userId = req.userId;
        const { sectionIds, ratedQuestionIds } = req.body;

        if (!sectionIds || !Array.isArray(sectionIds) || sectionIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide section IDs'
            });
        }

        if (!ratedQuestionIds || !Array.isArray(ratedQuestionIds)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide rated question IDs'
            });
        }

        const result = await SmartReviewService.markUnratedAsPending(
            userId,
            sectionIds,
            ratedQuestionIds
        );

        res.status(200).json({
            ...result,
            message: `Marked ${result.markedCount} questions as pending for next session`
        });

    } catch (error) {
        console.error('Error in markUnratedAsPending controller:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export {
    getTodaysQuestions,
    recordRating,
    addMoreQuestions,
    getRolledOverQuestions,
    getReviewStats,
    updatePriorities,
    getQuestionPriority,
    resetQuestionPriority,
    getSectionProgress,
    markUnratedAsPending
};