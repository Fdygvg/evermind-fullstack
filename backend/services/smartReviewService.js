import Question from '../models/Question.js';
import SectionProgress from '../models/SectionProgress.js';
import Section from '../models/Section.js';
import SMART_REVIEW_CONFIG from '../config/smartReviewConfig.js';

class SmartReviewService {

    /**
     * Get today's questions for a user based on selected sections
     * THREE-TRACK SYSTEM: 
     *   - NEW (Tier 1): UNLIMITED - all new questions are always included
     *   - PENDING/ROLLED-OVER (Tier 2): Subject to 50% limit
     *   - REVIEW (Tier 3): Subject to 50% limit
     * The 50% limit (maxPerSession) applies ONLY to Tier 2 + Tier 3 combined
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

            // 1b. CLEANUP: Clear stale isPending flags on questions that were already rated.
            // A timing bug in endSession() could mark the last rated question as pending
            // even though it was properly rated. Clear those before querying.
            const sectionIdList = sectionProgresses.map(p => p.sectionId);
            const cleanupResult = await Question.updateMany(
                {
                    userId,
                    sectionId: { $in: sectionIdList },
                    isPending: true,
                    // If a question has been rated (timesReviewed > 0 and priority > 0),
                    // it shouldn't be pending — it has a proper schedule via dueDate.
                    timesReviewed: { $gt: 0 },
                    priority: { $gt: 0 }
                },
                { isPending: false }
            );
            if (cleanupResult.modifiedCount > 0) {
                console.log(`[DEBUG] Cleaned up ${cleanupResult.modifiedCount} stale isPending flags`);
            }

            // 2. COLLECT QUESTIONS - THREE TRACKS PER SECTION
            const allQuestions = {
                new: [],      // Priority 0 - UNLIMITED
                pending: [],  // Rolled-over questions (wasRolledOver=true OR isPending=true) - LIMITED to 50%
                review: []    // Priority 1-5, due today - LIMITED to 50%
            };

            const sectionStats = {};
            const today = new Date();
            const rolledOverIds = [];

            for (const progress of sectionProgresses) {
                // currentSessionDay is the virtual "today" for this section (session day number)
                let currentDay = progress.currentSessionDay;

                console.log(`[DEBUG] Section ${progress.sectionId}: Loading questions for Session Day ${currentDay}`);

                // Get total questions count for dynamic maxPerSession calculation
                const totalQuestionsInSection = await Question.countDocuments({
                    userId,
                    sectionId: progress.sectionId
                });

                // Calculate dynamic maxPerSession: 50% of total questions in section
                // BUT set a minimum floor so small sections aren't artificially capped to a tiny number.
                // A floor of 10 means for sections with <= 20 questions, the limit is locked to 10.
                // The 50% limit only grows beyond 10 for larger sections (e.g., 50% of 30 = 15).
                const MIN_PER_SESSION = 10; // At least 10 review+rolled-over questions per session
                const maxPerSession = Math.max(
                    MIN_PER_SESSION,
                    Math.ceil(totalQuestionsInSection * SMART_REVIEW_CONFIG.REVIEW_LIMIT_PERCENTAGE)
                );
                console.log(`[DEBUG] Section ${progress.sectionId}: maxPerSession = ${maxPerSession} (50% of ${totalQuestionsInSection}, min ${MIN_PER_SESSION})`);

                // THREE-TIER PRIORITY QUEUE IMPLEMENTATION
                // Tier 1: New Questions (Priority 0, never reviewed)
                const tier1NewQuestions = await Question.find({
                    userId,
                    sectionId: progress.sectionId,
                    priority: 0,
                    timesReviewed: 0
                }).sort({ _id: 1 }); // Sort by ID for consistent ordering

                // Tier 2: Rolled-Over Questions (wasRolledOver: true OR isPending: true)
                const tier2RolledOver = await Question.find({
                    userId,
                    sectionId: progress.sectionId,
                    $or: [
                        { wasRolledOver: true },
                        { isPending: true }
                    ]
                }).sort({ wasRolledOver: -1, dueDate: 1 }); // wasRolledOver first, then by dueDate

                // AUTO-ADVANCE LOGIC (Moved to Pre-Query)
                // If no rolled-over/pending questions block progress, check if we need to advance to future review questions.
                // This ensures we catch up to future scheduled reviews even if new questions exist.
                if (tier2RolledOver.length === 0) {
                    const nextReviewQuestion = await Question.findOne({
                        userId,
                        sectionId: progress.sectionId,
                        priority: { $gt: 0, $lte: 5 },
                        isPending: { $ne: true },
                        wasRolledOver: { $ne: true }
                    }).sort({ dueDate: 1 });

                    if (nextReviewQuestion && nextReviewQuestion.dueDate > currentDay) {
                        const targetDay = nextReviewQuestion.dueDate;
                        console.log(`[AUTO-ADVANCE] Advancing Section ${progress.sectionId} from Day ${currentDay} to Day ${targetDay}`);

                        await SectionProgress.findOneAndUpdate(
                            { userId, sectionId: progress.sectionId },
                            {
                                currentSessionDay: targetDay,
                                totalSessions: progress.totalSessions + (targetDay - currentDay)
                            }
                        );
                        progress.currentSessionDay = targetDay;
                        currentDay = targetDay; // Update local variable for Tier 3 query
                    }
                }

                // Tier 3: Priority Review Questions (dueDate <= currentSessionDay, priority > 0)
                // Uses $lte so overdue questions from past sessions are also included
                const tier3Review = await Question.find({
                    userId,
                    sectionId: progress.sectionId,
                    dueDate: { $lte: currentDay }, // Include overdue + due today
                    priority: { $gt: 0, $lte: 5 },
                    isPending: { $ne: true },
                    wasRolledOver: { $ne: true }
                }).sort({ priority: 1, dueDate: 1 });

                console.log(`[DEBUG] Session Day ${currentDay}: Tier 1 (New)=${tier1NewQuestions.length}, Tier 2 (Rolled-Over)=${tier2RolledOver.length}, Tier 3 (Review)=${tier3Review.length}`);

                // NEW QUESTIONS ARE UNLIMITED - always include all of them
                // Only Tier 2 (rolled-over) and Tier 3 (review) are subject to the 50% limit
                const limitedQuestions = [...tier2RolledOver, ...tier3Review];

                // Apply maxPerSession limit ONLY to rolled-over and review questions
                let includedLimitedQuestions = [];
                let rolledOverQuestions = [];
                const questionsToRollOver = [];

                if (limitedQuestions.length > maxPerSession) {
                    // Take exactly maxPerSession from limited questions in priority order
                    includedLimitedQuestions = limitedQuestions.slice(0, maxPerSession);
                    rolledOverQuestions = limitedQuestions.slice(maxPerSession);

                    console.log(`[DEBUG] Session Day ${currentDay}: ${tier1NewQuestions.length} new (unlimited) + ${limitedQuestions.length} limited questions, taking ${maxPerSession} limited, rolling over ${rolledOverQuestions.length}`);

                    // Mark questions for rollover - update their dueDate to next session day
                    const nextSessionDay = currentDay + 1;
                    for (const question of rolledOverQuestions) {
                        questionsToRollOver.push({
                            questionId: question._id,
                            originalTier: question.priority === 0 ? 'new' :
                                (question.wasRolledOver || question.isPending) ? 'rolledOver' : 'review',
                            newDueDate: nextSessionDay
                        });
                    }
                } else {
                    // All limited questions within limit - include all of them
                    includedLimitedQuestions = limitedQuestions;
                    console.log(`[DEBUG] Session Day ${currentDay}: ${tier1NewQuestions.length} new (unlimited) + ${limitedQuestions.length} limited questions, all limited included (within limit of ${maxPerSession})`);
                }

                // Combine: ALL new questions (unlimited) + limited questions (capped at maxPerSession)
                const includedQuestions = [...tier1NewQuestions, ...includedLimitedQuestions];

                // Separate included questions into tracks for stats
                const includedNew = tier1NewQuestions; // All new questions are always included
                const includedRolledOver = includedLimitedQuestions.filter(q => q.wasRolledOver || q.isPending);
                const includedReview = includedLimitedQuestions.filter(q => !q.wasRolledOver && !q.isPending && q.priority > 0);

                // Separate rolled over questions by tier for proper handling
                // Note: New questions are never rolled over anymore since they're unlimited
                const rolledOverNew = 0; // New questions are never rolled over
                const rolledOverPending = rolledOverQuestions.filter(q => q.isPending);
                const rolledOverReview = rolledOverQuestions.filter(q => !q.isPending && q.priority > 0);

                // Collect all rolled over IDs for bulk update
                rolledOverIds.push(...rolledOverQuestions.map(q => q._id));

                // Bulk update rolled-over questions to next session day
                if (questionsToRollOver.length > 0) {
                    const updatePromises = questionsToRollOver.map(({ questionId, newDueDate, originalTier }) => {
                        const updateData = { dueDate: newDueDate };

                        // Set appropriate flags based on original tier
                        if (originalTier === 'rolledOver') {
                            // Rolled-over questions keep wasRolledOver flag
                            updateData.wasRolledOver = true;
                        } else {
                            // Review questions get wasRolledOver flag
                            updateData.wasRolledOver = true;
                        }

                        return Question.findByIdAndUpdate(questionId, updateData);
                    });

                    await Promise.all(updatePromises);
                    console.log(`[DEBUG] Updated ${questionsToRollOver.length} questions to Session Day ${currentDay + 1}`);
                }

                // Add to combined lists
                allQuestions.new.push(...includedNew);
                allQuestions.pending.push(...includedRolledOver); // Include ALL rolled-over questions (both isPending and wasRolledOver)
                allQuestions.review.push(...includedReview);

                // Store comprehensive stats for this section
                sectionStats[progress.sectionId.toString()] = {
                    currentSessionDay: currentDay,
                    totalSessions: progress.totalSessions,
                    maxPerSession: maxPerSession,
                    maxPerSessionAppliesTo: 'rolledOver + review only (new questions unlimited)',
                    // Tier counts (available)
                    tier1Available: tier1NewQuestions.length,
                    tier2Available: tier2RolledOver.length,
                    tier3Available: tier3Review.length,
                    // Included counts
                    newCount: includedNew.length,
                    rolledOverCount: includedRolledOver.length,
                    reviewCount: includedReview.length,
                    // Rolled over counts (only from Tier 2 and Tier 3)
                    newRolledOver: 0, // New questions are never rolled over
                    pendingRolledOver: rolledOverPending.length,
                    reviewRolledOver: rolledOverReview.length,
                    totalIncluded: includedQuestions.length,
                    totalRolledOver: rolledOverQuestions.length
                };

                // (Auto-advance logic has been moved before Tier 3 query)
            }

            // 3. BULK UPDATE: Mark rolled over questions (already handled in per-section loop above)
            // The rollover updates are done atomically per section to ensure proper dueDate assignment
            // This section is kept for any additional bulk operations if needed

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

            // Get (or create) the section's current session day
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
    static async markUnratedAsPending(userId, sectionIds, ratedQuestionIds, loadedQuestionIds) {
        try {
            // Build the query constraints
            const query = {
                userId,
                sectionId: { $in: sectionIds },
                _id: { $nin: ratedQuestionIds },
                priority: { $gte: 0 },
                isPending: false // Only mark questions that aren't already pending
            };

            // Only mark questions as pending if they were actually loaded in the session!
            if (loadedQuestionIds && Array.isArray(loadedQuestionIds) && loadedQuestionIds.length > 0) {
                query._id = { $in: loadedQuestionIds, $nin: ratedQuestionIds };
            }

            // Find questions that were loaded but not rated in this session
            const unratedQuestions = await Question.find(query);

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