import Question from '../models/Question.js';
import SectionProgress from '../models/SectionProgress.js';
import Section from '../models/Section.js';
import SMART_REVIEW_CONFIG from '../config/smartReviewConfig.js';

class SmartReviewService {

    /**
     * Get today's questions for a user based on selected sections
     * THREE-TRACK SYSTEM: NEW (unlimited) → PENDING (unlimited) → REVIEW (50% limit)
     * @param {string} userId - User ID
     * @param {Array} sectionIds - Array of section IDs
     * @returns {Object} - Today's questions, rolled over questions, and stats
     */
    static async getTodaysQuestions(userId, sectionIds) {
        try {
            // 0. SECURITY: Verify all sections belong to user
            const sections = await Section.find({
                _id: { $in: sectionIds },
                userId
            });

            if (sections.length !== sectionIds.length) {
                throw new Error('One or more sections not found or unauthorized');
            }

            // 1. GET OR CREATE SECTION PROGRESS (atomic upsert to prevent race conditions)
            const sectionProgresses = [];

            for (const sectionId of sectionIds) {
                const progress = await SectionProgress.findOneAndUpdate(
                    { userId, sectionId },
                    { 
                        $setOnInsert: { 
                            currentSessionDay: 1, 
                            totalSessions: 0,
                            lastSessionDate: new Date()
                        }
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                
                sectionProgresses.push(progress);
            }

            // 2. COLLECT QUESTIONS - THREE TRACKS PER SECTION
            const allQuestions = {
                new: [],      // Priority 0 - UNLIMITED
                pending: [],  // isPending=true - UNLIMITED  
                review: []    // Priority 1-5 - LIMITED to 50%
            };
            
            const sectionStats = {};
            const today = new Date();
            const rolledOverIds = [];

            for (const progress of sectionProgresses) {
                // currentSessionDay is the virtual "today" for this section (session day number)
                let currentDay = progress.currentSessionDay;

                console.log(`[DEBUG] Section ${progress.sectionId}: Loading questions for Session Day ${currentDay}`);

                // Get total questions count for debugging
                const totalQuestionsInSection = await Question.countDocuments({
                    userId,
                    sectionId: progress.sectionId
                });

                // AUTO-ADVANCE LOGIC: If no questions are due for current session day,
                // automatically advance to the next session day with questions
                let questions = [];
                let advancementsMade = 0;
                const MAX_AUTO_ADVANCEMENTS = 30; // Prevent infinite loops

                while (questions.length === 0 && advancementsMade < MAX_AUTO_ADVANCEMENTS) {
                    // Get questions for three tracks
                    // NEW questions (priority 0): Always show (unlimited)
                    // PENDING questions: Always show (unlimited)
                    // REVIEW questions: Show if dueDate <= currentSessionDay (as numbers)
                    questions = await Question.find({
                        userId,
                        sectionId: progress.sectionId,
                        $or: [
                            { priority: 0 },                    // NEW - always show (unlimited)
                            { priority: { $exists: false } },   // Legacy questions
                            { priority: null },                 // Legacy questions
                            { isPending: true },                // PENDING - always show (unlimited)
                            { 
                                dueDate: { $lte: currentDay },  // REVIEW - due on or before this session day
                                priority: { $gt: 0, $lte: 5 },
                                isPending: { $ne: true }        // Exclude pending from review track
                            }
                        ]
                    }).sort({ priority: 1, dueDate: 1 });

                    console.log(`[DEBUG] Session Day ${currentDay}: Found ${questions.length} questions`);

                    // If no questions found and there are questions in the section, auto-advance
                    if (questions.length === 0 && totalQuestionsInSection > 0) {
                        // IMPORTANT: Check if there are NEW (priority 0) or PENDING questions first
                        // If they exist, we shouldn't auto-advance - they should show instead
                        const newOrPendingQuestions = await Question.countDocuments({
                            userId,
                            sectionId: progress.sectionId,
                            $or: [
                                { priority: 0 },
                                { priority: { $exists: false } },
                                { priority: null },
                                { isPending: true }
                            ]
                        });

                        if (newOrPendingQuestions > 0) {
                            console.log(`[AUTO-ADVANCE] Found ${newOrPendingQuestions} NEW/PENDING questions - should show these instead of advancing`);
                            // Re-query to get NEW/PENDING questions
                            questions = await Question.find({
                                userId,
                                sectionId: progress.sectionId,
                                $or: [
                                    { priority: 0 },
                                    { priority: { $exists: false } },
                                    { priority: null },
                                    { isPending: true }
                                ]
                            }).sort({ priority: 1, dueDate: 1 });
                            break;
                        }

                        // Only auto-advance if there are no NEW or PENDING questions
                        // Check what's the earliest dueDate to know where to advance
                        const nextQuestion = await Question.findOne({
                            userId,
                            sectionId: progress.sectionId,
                            priority: { $gt: 0, $lte: 5 },
                            dueDate: { $gt: currentDay }
                        }).sort({ dueDate: 1 });

                        if (nextQuestion) {
                            const targetDay = nextQuestion.dueDate;
                            console.log(`[AUTO-ADVANCE] No questions for Session Day ${currentDay}. Advancing to Session Day ${targetDay} (next due date)`);
                            
                            // Update the progress document directly
                            await SectionProgress.findOneAndUpdate(
                                { userId, sectionId: progress.sectionId },
                                { 
                                    currentSessionDay: targetDay,
                                    totalSessions: progress.totalSessions + (targetDay - currentDay)
                                }
                            );
                            
                            currentDay = targetDay;
                            advancementsMade += (targetDay - progress.currentSessionDay);
                            progress.currentSessionDay = targetDay; // Update in-memory object
                        } else {
                            // No future questions found, break the loop
                            console.log(`[AUTO-ADVANCE] No future questions found for section ${progress.sectionId}`);
                            break;
                        }
                    } else {
                        // Questions found or no questions in section at all
                        break;
                    }
                }

                if (advancementsMade > 0) {
                    console.log(`[AUTO-ADVANCE] Advanced ${advancementsMade} session(s) to Session Day ${currentDay}`);
                }
                
                console.log(`[DEBUG] Section ${progress.sectionId}: Session Day ${currentDay}, Total questions: ${totalQuestionsInSection}, Found: ${questions.length}`);
                
                if (questions.length > 0) {
                    const sample = questions[0];
                    console.log(`[DEBUG] Sample question - priority: ${sample.priority}, dueDate: ${sample.dueDate}, isPending: ${sample.isPending}`);
                } else if (totalQuestionsInSection > 0) {
                    // Debug: show all questions if none matched
                    console.warn(`[WARNING] Section has ${totalQuestionsInSection} questions but none available after auto-advancement`);
                    const allQuestions = await Question.find({ userId, sectionId: progress.sectionId }).sort({ dueDate: 1 });
                    console.log(`[DEBUG] All questions in section (sorted by dueDate):`);
                    allQuestions.forEach((q, idx) => {
                        console.log(`  Q${idx + 1}: priority=${q.priority}, dueDate=${q.dueDate}, isPending=${q.isPending}`);
                    });
                }

                // Separate into three tracks
                const newQuestions = questions.filter(q => q.priority === 0);
                const pendingQuestions = questions.filter(q => q.isPending && q.priority > 0);
                const reviewQuestions = questions.filter(q => !q.isPending && q.priority > 0);

                // Apply 50% limit ONLY to review questions
                const reviewLimit = Math.ceil(reviewQuestions.length * SMART_REVIEW_CONFIG.REVIEW_LIMIT_PERCENTAGE);
                const includedReview = reviewQuestions.slice(0, reviewLimit);
                const rolledOverReview = reviewQuestions.slice(reviewLimit);

                // Collect rolled over IDs for bulk update
                rolledOverIds.push(...rolledOverReview.map(q => q._id));

                // Add to combined lists
                allQuestions.new.push(...newQuestions);
                allQuestions.pending.push(...pendingQuestions);
                allQuestions.review.push(...includedReview);

                // Store stats for this section
                sectionStats[progress.sectionId.toString()] = {
                    currentSessionDay: progress.currentSessionDay,
                    totalSessions: progress.totalSessions,
                    newCount: newQuestions.length,
                    pendingCount: pendingQuestions.length,
                    reviewCount: reviewQuestions.length,
                    reviewIncluded: includedReview.length,
                    reviewRolledOver: rolledOverReview.length
                };
            }

            // 3. BULK UPDATE: Mark rolled over questions (fix N+1 query problem)
            if (rolledOverIds.length > 0) {
                await Question.updateMany(
                    { _id: { $in: rolledOverIds } },
                    { wasRolledOver: true }
                );
            }

            // 4. COMBINE in priority order: NEW → PENDING → REVIEW
            const todaysQuestions = [
                ...allQuestions.new,
                ...allQuestions.pending,
                ...allQuestions.review
            ];

            // 5. Calculate totals
            const totalNew = allQuestions.new.length;
            const totalPending = allQuestions.pending.length;
            const totalReview = allQuestions.review.length;

            return {
                success: true,
                todaysQuestions,
                rolledOver: rolledOverIds,
                sectionStats,
                stats: {
                    totalSelected: todaysQuestions.length,
                    newCount: totalNew,
                    pendingCount: totalPending,
                    reviewCount: totalReview,
                    rolledOverCount: rolledOverIds.length,
                    // Track breakdown for UI
                    trackBreakdown: {
                        new: totalNew,
                        pending: totalPending,
                        review: totalReview
                    }
                }
            };

        } catch (error) {
            console.error('Error in getTodaysQuestions:', error);
            throw error;
        }
    }

    /**
     * Calculate daily review limit
     * @param {number} totalQuestions - Total questions selected
     * @param {number} newQuestions - Number of new (priority 0) questions
     * @param {number} missedDays - Days user missed reviews (for backlog)
     * @returns {Object} - Daily limit breakdown
     */
    static calculateDailyLimit(totalQuestions, newQuestions, missedDays = 0) {
        // Base: 50% of all selected questions
        const baseLimit = Math.ceil(totalQuestions * 0.5);

        // Bonus: 50% of new questions
        const bonusAllowance = Math.ceil(newQuestions * 0.5);

        // Backlog acceleration: +10% per missed day, max +50%
        const backlogMultiplier = 1 + Math.min(missedDays * 0.1, 0.5);

        const dailyLimit = Math.ceil((baseLimit + bonusAllowance) * backlogMultiplier);

        return {
            dailyLimit,
            baseLimit,
            bonusAllowance,
            backlogMultiplier: backlogMultiplier > 1 ? backlogMultiplier : null
        };
    }

    /**
     * Record a user's rating for a question
     * @param {string} userId - User ID
     * @param {string} questionId - Question ID
     * @param {number} rating - Rating (1-5)
     * @param {string} sectionId - Section ID (to get current session day)
     * @returns {Object} - Updated question info
     */
    static async recordRating(userId, questionId, rating, sectionId) {
        try {
            const question = await Question.findOne({
                _id: questionId,
                userId
            });

            if (!question) {
                throw new Error('Question not found');
            }

            // Get the section's current session day
            const progress = await SectionProgress.findOne({ userId, sectionId });
            if (!progress) {
                throw new Error('Section progress not found');
            }
            const currentSessionDay = progress.currentSessionDay;

            // Update question with new rating
            question.lastRating = rating;
            question.timesReviewed += 1;
            question.lastReviewedAt = new Date();
            question.wasRolledOver = false; // Reset if it was rolled over
            question.isPending = false; // Clear pending status when rated
            question.pendingSessionId = null;

            // SPECIAL HANDLING FOR RATING 1 (HARD):
            // Don't schedule it - keep it in current session, will reappear after 5 questions
            if (rating === 1) {
                // For hard questions, don't update priority or dueDate
                // Keep it available for reinsertion in current session
                // Priority stays the same, dueDate stays the same
                question.easeFactor = this.calculateNewEaseFactor(question, rating);
                
                await question.save();

                return {
                    success: true,
                    isHard: true, // Flag for frontend to handle reinsertion
                    question: {
                        id: question._id,
                        priority: question.priority,
                        dueDate: question.dueDate,
                        nextReviewIn: 0, // Will reappear in current session
                        message: 'Question marked as hard - will reappear after 5 questions'
                    }
                };
            }

            // For ratings 2-5: Update to new session day
            question.priority = rating; // Priority = last rating
            
            // Calculate new due SESSION DAY (not calendar date!)
            const newDueSessionDay = this.calculateNextDueDate(question, rating, currentSessionDay);
            question.dueDate = newDueSessionDay; // Store as NUMBER

            // Update ease factor for spaced repetition
            question.easeFactor = this.calculateNewEaseFactor(question, rating);

            await question.save();

            return {
                success: true,
                isHard: false,
                question: {
                    id: question._id,
                    priority: question.priority,
                    dueDate: question.dueDate,
                    nextReviewIn: newDueSessionDay - currentSessionDay // Sessions until review
                }
            };

        } catch (error) {
            console.error('Error in recordRating:', error);
            throw error;
        }
    }

    /**
     * Calculate next due SESSION DAY (not calendar date!)
     * Uses fixed intervals with random offset to prevent clumping
     * Virtual days = session count, not real calendar days
     * @param {Object} question - Question object
     * @param {number} rating - User rating (1-5)
     * @param {number} currentSessionDay - Current session day of the section
     * @returns {Number} - Session day when question should appear again
     */
    static calculateNextDueDate(question, rating, currentSessionDay) {
        // Get base sessions from config
        const baseSessions = SMART_REVIEW_CONFIG.RATING_INTERVALS[rating];

        // Add random offset to prevent clumping (±20%)
        const randomOffset = (Math.random() * 2 * SMART_REVIEW_CONFIG.RANDOM_OFFSET_PERCENTAGE) - SMART_REVIEW_CONFIG.RANDOM_OFFSET_PERCENTAGE;
        const actualSessions = Math.max(0, Math.round(baseSessions * (1 + randomOffset)));

        // Return the virtual session day number
        return currentSessionDay + actualSessions;
    }

    /**
     * Calculate new ease factor (SM-2 algorithm simplified)
     * Currently not used in fixed-interval algorithm, but kept for future v2
     */
    static calculateNewEaseFactor(question, rating) {
        let newEaseFactor = question.easeFactor || SMART_REVIEW_CONFIG.DEFAULT_EASE_FACTOR;

        // Adjust based on rating
        if (rating <= 2) {
            // Hard - decrease ease factor
            newEaseFactor = Math.max(
                SMART_REVIEW_CONFIG.MIN_EASE_FACTOR, 
                newEaseFactor - SMART_REVIEW_CONFIG.EASE_ADJUSTMENT
            );
        } else if (rating >= 4) {
            // Easy - increase ease factor
            newEaseFactor = Math.min(
                SMART_REVIEW_CONFIG.MAX_EASE_FACTOR,
                newEaseFactor + SMART_REVIEW_CONFIG.EASE_ADJUSTMENT
            );
        }
        // Rating 3 keeps same ease factor

        return newEaseFactor;
    }

    /**
     * Add more questions to today's session
     * @param {string} userId - User ID
     * @param {Array} questionIds - Question IDs to add
     * @returns {Object} - Added questions info
     */
    static async addMoreQuestions(userId, questionIds) {
        try {
            const questions = await Question.find({
                _id: { $in: questionIds },
                userId
            });

            // Mark questions as added (not rolled over anymore)
            for (const question of questions) {
                question.wasRolledOver = false;
                await question.save();
            }

            return {
                success: true,
                addedCount: questions.length,
                questions: questions.map(q => q._id)
            };

        } catch (error) {
            console.error('Error in addMoreQuestions:', error);
            throw error;
        }
    }

    /**
     * Calculate sessions until a due session day
     * @param {Number} dueSessionDay - Target session day
     * @param {Number} currentSessionDay - Current section day
     * @returns {Number} - Sessions remaining
     */
    static sessionsUntil(dueSessionDay, currentSessionDay) {
        return Math.max(0, dueSessionDay - currentSessionDay);
    }

    /**
     * Mark unrated questions as PENDING for next session
     * Called when user ends session with unfinished questions
     * @param {string} userId - User ID
     * @param {Array} sectionIds - Section IDs in the session
     * @param {Array} ratedQuestionIds - IDs of questions that were rated
     * @returns {Object} - Success status and counts
     */
    static async markUnratedAsPending(userId, sectionIds, ratedQuestionIds) {
        try {
            // Find questions that were loaded but not rated in this session
            // These should be from today's loaded questions
            const unratedQuestions = await Question.find({
                userId,
                sectionId: { $in: sectionIds },
                _id: { $nin: ratedQuestionIds },
                priority: { $gte: 0 },
                // Only mark questions that aren't already pending
                isPending: false
            });

            if (unratedQuestions.length === 0) {
                return {
                    success: true,
                    markedCount: 0,
                    message: 'No unrated questions to mark as pending'
                };
            }

            // Mark as pending for next session (bulk update)
            const result = await Question.updateMany(
                { _id: { $in: unratedQuestions.map(q => q._id) } },
                { 
                    isPending: true,
                    // Clear rolled over status since they're now pending
                    wasRolledOver: false
                }
            );

            return {
                success: true,
                markedCount: result.modifiedCount,
                questionIds: unratedQuestions.map(q => q._id)
            };

        } catch (error) {
            console.error('Error in markUnratedAsPending:', error);
            throw error;
        }
    }

    // updateOverduePriorities method removed - not applicable to virtual session days
    // Questions are automatically "overdue" if dueDate <= currentSessionDay
}

export default SmartReviewService;