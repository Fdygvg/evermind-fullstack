// controllers/sessionController.js
import ReviewSession from '../models/ReviewSession.js';
import Question from '../models/Question.js';
import UserStats from '../models/UserStats.js';

export const startSession = async (req, res) => {
  try {
    const { sectionIds, cardMode, isSimplified } = req.body;

    // Validate sectionIds
    if (!sectionIds || !Array.isArray(sectionIds) || sectionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'sectionIds is required and must be a non-empty array'
      });
    }

    // End any existing active session (only simplified sessions for same sections if isSimplified)
    if (isSimplified) {
      await ReviewSession.updateMany(
        { userId: req.userId, isActive: true, isSimplified: true, sectionIds: { $in: sectionIds } },
        { isActive: false, status: 'completed', endTime: new Date() }
      );
    } else {
      await ReviewSession.findOneAndUpdate(
        { userId: req.userId, isActive: true },
        { isActive: false, status: 'completed', endTime: new Date() }
      );
    }

    // Get questions from selected sections
    // For normal/flashcard modes, we include ALL active questions (scheduling is handled by Smart Review separately)
    const questions = await Question.find({
      userId: req.userId,
      sectionId: { $in: sectionIds },
      isActive: { $ne: false } // Include questions where isActive is true or not set
    });

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No questions found in selected sections'
      });
    }

    // Shuffle questions for random order
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
    const questionIds = shuffledQuestions.map(q => q._id);


    const session = new ReviewSession({
      userId: req.userId,
      sectionIds,
      cardMode: cardMode || 'normal',
      allQuestions: questionIds,
      remainingQuestions: questionIds,
      correctQuestions: [],
      wrongQuestions: [],
      mediumQuestions: [],
      correctCount: 0,
      wrongCount: 0,
      mediumCount: 0,
      isActive: true,
      status: 'active',
      currentIndex: 0,
      answeredQuestionIds: [],
      isSimplified: isSimplified || false
    });

    await session.save();

    // Populate questions for frontend usage
    await session.populate('remainingQuestions');

    res.json({
      success: true,
      message: 'Session started successfully',
      data: {
        session: {
          _id: session._id,
          id: session._id,
          cardMode: session.cardMode,
          isSimplified: session.isSimplified,
          totalQuestions: session.allQuestions.length,
          allQuestions: session.allQuestions, // Keep IDs for lightweight reference if needed
          remainingQuestions: session.remainingQuestions // Now populated with full objects
        }
      }
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting session'
    });
  }
};

export const getNextQuestion = async (req, res) => {
  try {
    const session = await ReviewSession.findOne({
      userId: req.userId,
      isActive: true
    }).populate('remainingQuestions');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found'
      });
    }

    // For simplified sessions, use the currentIndex pointer
    let nextQuestion;
    let currentIndex;

    if (session.isSimplified) {
      if (session.currentIndex >= session.remainingQuestions.length) {
        return res.json({
          success: true,
          message: 'Session completed!',
          data: { completed: true }
        });
      }
      nextQuestion = session.remainingQuestions[session.currentIndex];
      currentIndex = session.currentIndex;
    } else {
      // Legacy behavior for normal sessions (queue-based)
      if (session.remainingQuestions.length === 0) {
        return res.json({
          success: true,
          message: 'Session completed!',
          data: { completed: true }
        });
      }
      nextQuestion = session.remainingQuestions[0];
      currentIndex = session.allQuestions.length - session.remainingQuestions.length;
    }

    res.json({
      success: true,
      data: {
        question: nextQuestion,
        progress: {
          total: session.allQuestions.length,
          remaining: session.remainingQuestions.length - (session.isSimplified ? session.currentIndex : 0),
          currentQuestionIndex: currentIndex,
          correct: session.correctCount,
          wrong: session.wrongCount,
          completed: false
        }
      }
    });
  } catch (error) {
    console.error('Get next question error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting next question'
    });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { questionId, responseType } = req.body;
    // responseType: 'easy' | 'medium' | 'hard'

    const session = await ReviewSession.findOne({
      userId: req.userId,
      isActive: true
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found'
      });
    }

    // Find current position of question in remainingQuestions before removing it
    const currentQuestionIndex = session.remainingQuestions.findIndex(
      id => id.toString() === questionId
    );

    // Update question stats
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    // Handle based on response type
    if (session.isSimplified) {
      // POINTER BASED LOGIC for Simplified Session
      // Just move the pointer, do not remove questions
      session.currentIndex = (session.currentIndex || 0) + 1;

      // Update question stats (optional: do we want to schedule spaced repetition for Simplified? 
      // User said "Just IDs, Lightweight state". But usually we still record stats?
      // Let's assume we still record correct/wrong counts on the question but MAYBE NOT nextReviewDate if it's "Review All"?
      // Usually "Review All" implies Cram Mode / Extra study, so affecting Spaced Repetition might be side-effect.
      // But user didn't specify to disable stats. Let's record stats but NOT mutate session arrays.

      if (responseType === 'easy' || responseType === 'medium') {
        question.totalCorrect += 1;
        session.correctCount += 1;
        // We don't push to correctQuestions array to save space/complexity if using pointer? 
        // usage of session.correctQuestions is for results page. Let's keep it sync.
        session.correctQuestions.push(questionId);
      } else {
        question.totalWrong += 1;
        session.wrongCount += 1;
        session.wrongQuestions.push(questionId);
      }
      // Note: We are NOT rescheduling nextReviewDate here to avoid messing up the main schedule?
      // Or should we? "Review All" usually acts outside of schedule. Let's treat it as "Extra Study".
      // We will update lastReviewed.
    } else {
      // QUEUE BASED LOGIC for Normal Session
      // Remove from remaining questions first
      session.remainingQuestions = session.remainingQuestions.filter(
        id => id.toString() !== questionId
      );

      if (responseType === 'easy') {
        // Green button: Schedule for 3 days later, remove from session
        question.nextReviewDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        question.reviewDifficulty = 'easy';
        question.lastDifficultyRating = new Date();
        question.totalCorrect += 1;
        session.correctCount += 1;
        session.correctQuestions.push(questionId);
      } else if (responseType === 'medium') {
        // Yellow button: Schedule for tomorrow, remove from session
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow
        question.nextReviewDate = tomorrow;
        question.reviewDifficulty = 'medium';
        question.lastDifficultyRating = new Date();
        session.mediumCount += 1;
        session.mediumQuestions.push(questionId);
      } else if (responseType === 'hard') {
        // Red button: Keep in session, reinsert after 5-7 cards (spaced repetition)
        question.reviewDifficulty = 'hard';
        question.lastDifficultyRating = new Date();
        question.totalWrong += 1;
        session.wrongCount += 1;
        session.wrongQuestions.push(questionId);

        // Reinsert after 5-7 cards
        const reintDelay = Math.floor(Math.random() * 3) + 5; // 5-7
        const insertAt = Math.min(
          currentQuestionIndex + reintDelay,
          session.remainingQuestions.length
        );
        session.remainingQuestions.splice(insertAt, 0, questionId);
      }
    }

    question.lastReviewed = new Date();
    await question.save();
    await session.save();

    res.json({
      success: true,
      message: `Answer submitted: ${responseType}`,
      data: {
        progress: {
          total: session.allQuestions.length,
          remaining: session.isSimplified
            ? session.remainingQuestions.length - session.currentIndex
            : session.remainingQuestions.length,
          correct: session.correctCount,
          medium: session.mediumCount,
          wrong: session.wrongCount
        }
      }
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting answer'
    });
  }
};

export const endSession = async (req, res) => {
  try {
    const session = await ReviewSession.findOneAndUpdate(
      { userId: req.userId, isActive: true },
      {
        isActive: false,
        status: 'completed',
        endTime: new Date()
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found'
      });
    }

    // UPDATE USER STATS
    let userStats = await UserStats.findOne({ userId: req.userId });
    if (!userStats) {
      userStats = new UserStats({ userId: req.userId });
    }

    // Calculate session duration in minutes
    const duration = Math.round((session.endTime - session.startTime) / 60000);

    // Update stats
    userStats.totalSessions += 1;
    userStats.totalQuestionsReviewed += session.correctCount + session.wrongCount;
    userStats.totalCorrectAnswers += session.correctCount;
    userStats.totalTimeSpent += duration;
    userStats.lastSessionDate = new Date();

    // Update streak (simple version - if session was today, increment streak)
    const lastSession = userStats.lastSessionDate;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!lastSession ||
      lastSession.toDateString() === yesterday.toDateString() ||
      lastSession.toDateString() === today.toDateString()) {
      userStats.currentStreak += 1;
    } else {
      userStats.currentStreak = 1; // Reset streak
    }

    userStats.longestStreak = Math.max(userStats.longestStreak, userStats.currentStreak);

    await userStats.save();

    res.json({
      success: true,
      message: 'Session ended successfully',
      data: {
        session: {
          correct: session.correctCount,
          wrong: session.wrongCount,
          duration: duration
        },
        stats: {
          currentStreak: userStats.currentStreak,
          totalSessions: userStats.totalSessions
        }
      }
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending session'
    });
  }
};

export const getCurrentSession = async (req, res) => {
  try {
    // Find sessions with status 'active' or 'paused'
    const session = await ReviewSession.findOne({
      userId: req.userId,
      status: { $in: ['active', 'paused'] }
    })
      .populate('sectionIds', 'name color')
      .populate('remainingQuestions')
      .populate('correctQuestions')
      .populate('wrongQuestions')
      .sort({ lastUpdated: -1 }); // Get most recently updated

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found'
      });
    }

    res.json({
      success: true,
      data: {
        session: {
          id: session._id,
          cardMode: session.cardMode,
          currentMode: session.cardMode, // Alias for consistency
          totalQuestions: session.allQuestions.length,
          sections: session.sectionIds,
          sectionIds: session.sectionIds.map(s => s._id),
          allQuestions: session.allQuestions,
          progress: {
            total: session.allQuestions.length,
            remaining: session.remainingQuestions.length,
            currentIndex: session.currentIndex,
            correct: session.correctCount,
            wrong: session.wrongCount,
            answeredQuestionIds: session.answeredQuestionIds
          },
          startTime: session.startTime,
          sessionStartTime: session.startTime, // Alias for consistency
          status: session.status,
          lastUpdated: session.lastUpdated,
          useSmartReview: session.useSmartReview,
          smartReviewState: session.smartReviewState
        }
      }
    });
  } catch (error) {
    console.error('Get current session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching current session'
    });
  }
};

export const getLastSessionResults = async (req, res) => {
  try {
    const lastSession = await ReviewSession.findOne({
      userId: req.userId,
      isActive: false
    })
      .sort({ endTime: -1 })
      .limit(1);

    if (!lastSession) {
      return res.status(404).json({
        success: false,
        message: 'No completed sessions found'
      });
    }

    const totalQuestions = lastSession.correctCount + lastSession.wrongCount;
    const accuracy = totalQuestions > 0
      ? Math.round((lastSession.correctCount / totalQuestions) * 100)
      : 0;

    const duration = lastSession.endTime
      ? Math.round((lastSession.endTime - lastSession.startTime) / 60000)  // minutes
      : 0;

    res.json({
      success: true,
      data: {
        correct: lastSession.correctCount,
        wrong: lastSession.wrongCount,
        total: totalQuestions,
        accuracy,
        duration,
        sections: lastSession.sectionIds,
        date: lastSession.endTime
      }
    });
  } catch (error) {
    console.error('Get last session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching last session'
    });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const { sectionIds, currentIndex, answeredQuestionIds, status, smartReviewState, sessionId } = req.body;

    let session;
    if (sessionId) {
      // Find the specific session by ID (for simplified/quick-play sessions)
      session = await ReviewSession.findOne({
        _id: sessionId,
        userId: req.userId,
        status: { $in: ['active', 'paused'] }
      });
    } else {
      session = await ReviewSession.findOne({
        userId: req.userId,
        status: { $in: ['active', 'paused'] }
      });
    }

    // If no session exists but smartReviewState is provided, create one for Smart Review
    if (!session && smartReviewState) {
      // Extract sectionIds from smartReviewState or request body
      const extractedSectionIds = sectionIds || smartReviewState.sectionIds || [];

      session = new ReviewSession({
        userId: req.userId,
        sectionIds: extractedSectionIds,
        useSmartReview: true,
        status: status || 'active',
        currentIndex: currentIndex || 0,
        answeredQuestionIds: answeredQuestionIds || [],
        smartReviewState: smartReviewState,
        isActive: true
      });

      await session.save();

      return res.json({
        success: true,
        message: 'Smart Review session created and progress saved',
        data: {
          session: {
            id: session._id,
            currentIndex: session.currentIndex,
            status: session.status,
            lastUpdated: session.lastUpdated
          }
        }
      });
    }

    // If still no session found, return error (for legacy mode)
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found'
      });
    }

    // Update fields if provided
    if (currentIndex !== undefined) {
      session.currentIndex = currentIndex;
    }
    if (answeredQuestionIds !== undefined) {
      session.answeredQuestionIds = answeredQuestionIds;
    }
    if (status !== undefined) {
      session.status = status;
    }
    if (smartReviewState !== undefined) {
      session.smartReviewState = smartReviewState;
      // Also set useSmartReview flag if smartReviewState is provided
      session.useSmartReview = true;
    }

    session.lastUpdated = new Date();
    await session.save();

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        session: {
          id: session._id,
          currentIndex: session.currentIndex,
          status: session.status,
          lastUpdated: session.lastUpdated
        }
      }
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating progress'
    });
  }
};

export const pauseSession = async (req, res) => {
  try {
    const { sessionId } = req.body || {};

    let query = { userId: req.userId, status: 'active' };
    if (sessionId) {
      query._id = sessionId;
    }

    const session = await ReviewSession.findOne(query);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active session found'
      });
    }

    session.status = 'paused';
    session.lastUpdated = new Date();
    await session.save();

    res.json({
      success: true,
      message: 'Session paused successfully',
      data: {
        session: {
          id: session._id,
          status: session.status,
          lastUpdated: session.lastUpdated
        }
      }
    });
  } catch (error) {
    console.error('Pause session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error pausing session'
    });
  }
};

// Get all active simplified sessions for the current user (for section card Play/Pause state)
export const getSimplifiedSessions = async (req, res) => {
  try {
    const sessions = await ReviewSession.find({
      userId: req.userId,
      isSimplified: true,
      isActive: true,
      status: { $in: ['active', 'paused'] }
    }).select('sectionIds remainingQuestions allQuestions correctCount wrongCount status');

    // Build a map: sectionId -> session summary
    const sessionMap = {};
    sessions.forEach(session => {
      session.sectionIds.forEach(sectionId => {
        sessionMap[sectionId.toString()] = {
          sessionId: session._id,
          status: session.status,
          remaining: session.remainingQuestions.length,
          total: session.allQuestions.length,
          correctCount: session.correctCount,
          wrongCount: session.wrongCount
        };
      });
    });

    res.json({
      success: true,
      data: { sessionMap }
    });
  } catch (error) {
    console.error('Get simplified sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching simplified sessions'
    });
  }
};

// Resume a simplified session: reshuffle remaining questions and return session data
export const resumeSimplifiedSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ReviewSession.findOne({
      _id: sessionId,
      userId: req.userId,
      isSimplified: true,
      isActive: true
    }).populate('remainingQuestions');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active simplified session found'
      });
    }

    // DO NOT Reshuffle remaining questions for pointer persistence
    // const shuffled = [...session.remainingQuestions].sort(() => Math.random() - 0.5);
    // session.remainingQuestions = shuffled.map(q => q._id);

    // Just activate the session
    session.status = 'active';
    session.lastUpdated = new Date();
    await session.save();

    // Use current index to determine actual remaining questions for frontend
    // const effectiveRemaining = session.remainingQuestions.slice(session.currentIndex || 0);

    res.json({
      success: true,
      message: 'Session resumed',
      data: {
        session: {
          _id: session._id,
          id: session._id,
          cardMode: session.cardMode,
          isSimplified: true,
          totalQuestions: session.allQuestions.length,
          allQuestions: session.allQuestions, // IDs
          remainingQuestions: session.remainingQuestions, // Return FULL array for pointer logic
          currentIndex: session.currentIndex || 0,
          correctCount: session.correctCount,
          wrongCount: session.wrongCount,
          status: session.status
        }
      }
    });
  } catch (error) {
    console.error('Resume simplified session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resuming simplified session'
    });
  }
};

// End a specific simplified session by ID
export const endSimplifiedSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ReviewSession.findOneAndUpdate(
      { _id: sessionId, userId: req.userId, isSimplified: true, isActive: true },
      { isActive: false, status: 'completed', endTime: new Date() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'No active simplified session found'
      });
    }

    // Update user stats
    let userStats = await UserStats.findOne({ userId: req.userId });
    if (!userStats) {
      userStats = new UserStats({ userId: req.userId });
    }

    const duration = Math.round((session.endTime - session.startTime) / 60000);
    userStats.totalSessions += 1;
    userStats.totalQuestionsReviewed += session.correctCount + session.wrongCount;
    userStats.totalCorrectAnswers += session.correctCount;
    userStats.totalTimeSpent += duration;
    userStats.lastSessionDate = new Date();
    await userStats.save();

    res.json({
      success: true,
      message: 'Simplified session ended',
      data: {
        session: {
          correct: session.correctCount,
          wrong: session.wrongCount,
          total: session.allQuestions.length,
          duration
        }
      }
    });
  } catch (error) {
    console.error('End simplified session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending simplified session'
    });
  }
};