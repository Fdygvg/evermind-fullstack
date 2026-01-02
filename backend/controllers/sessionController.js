// controllers/sessionController.js
import ReviewSession from '../models/ReviewSession.js';
import Question from '../models/Question.js';
import UserStats from '../models/UserStats.js';

export const startSession = async (req, res) => {
  try {
    const { sectionIds, cardMode = 'normal' } = req.body;
    
    // End any existing active session
    await ReviewSession.findOneAndUpdate(
      { userId: req.userId, isActive: true },
      { isActive: false, endTime: new Date() }
    );

    // Get questions from selected sections that are due for review
    const now = new Date();
    const questions = await Question.find({
      userId: req.userId,
      sectionId: { $in: sectionIds },
      isActive: true,
      $or: [
        { nextReviewDate: null },
        { nextReviewDate: { $lte: now } }
      ]
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
      cardMode,
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
      answeredQuestionIds: []
    });

    await session.save();

    res.json({
      success: true,
      message: 'Session started successfully',
      data: { 
        session: {
          _id: session._id,
          id: session._id,
          cardMode: session.cardMode,
          totalQuestions: session.allQuestions.length,
          allQuestions: session.allQuestions,
          remainingQuestions: session.remainingQuestions.length
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

    if (session.remainingQuestions.length === 0) {
      return res.json({
        success: true,
        message: 'Session completed!',
        data: { completed: true }
      });
    }

    // Get next question (first in remainingQuestions)
    const nextQuestion = session.remainingQuestions[0];
    
    // Calculate current question index
    const currentIndex = session.allQuestions.length - session.remainingQuestions.length;
    
    res.json({
      success: true,
      data: {
        question: nextQuestion,
        progress: {
          total: session.allQuestions.length,
          remaining: session.remainingQuestions.length,
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

    // Remove from remaining questions first
    session.remainingQuestions = session.remainingQuestions.filter(
      id => id.toString() !== questionId
    );

    // Handle based on response type
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

    question.lastReviewed = new Date();
    await question.save();
    await session.save();

    res.json({
      success: true,
      message: `Answer submitted: ${responseType}`,
      data: {
        progress: {
          total: session.allQuestions.length,
          remaining: session.remainingQuestions.length,
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
    const { sectionIds, currentIndex, answeredQuestionIds, status, smartReviewState } = req.body;
    
    let session = await ReviewSession.findOne({
      userId: req.userId,
      status: { $in: ['active', 'paused'] }
    });

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
    const session = await ReviewSession.findOne({
      userId: req.userId,
      status: 'active'
    });

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