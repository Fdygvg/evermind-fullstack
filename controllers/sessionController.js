// controllers/sessionController.js
import ReviewSession from '../models/ReviewSession.js';
import Question from '../models/Question.js';
import UserStats from '../models/UserStats.js';

export const startSession = async (req, res) => {
  try {
    const { sectionIds, mode = 'buffer' } = req.body;
    
    // End any existing active session
    await ReviewSession.findOneAndUpdate(
      { userId: req.userId, isActive: true },
      { isActive: false, endTime: new Date() }
    );

    // Get questions from selected sections
    const questions = await Question.find({
      userId: req.userId,
      sectionId: { $in: sectionIds },
      isActive: true
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

    // Create new session
    const session = new ReviewSession({
      userId: req.userId,
      sectionIds,
      mode,
      allQuestions: questionIds,
      remainingQuestions: questionIds,
      correctQuestions: [],
      wrongQuestions: [],
      correctCount: 0,
      wrongCount: 0,
      isActive: true
    });

    await session.save();

    res.json({
      success: true,
      message: 'Session started successfully',
      data: { 
        session: {
          id: session._id,
          mode: session.mode,
          totalQuestions: session.allQuestions.length,
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

    // BUFFER MODE: Check if we need to reinsert wrong questions
    if (session.mode === 'buffer' && session.remainingQuestions.length === 0 && session.wrongQuestions.length > 0) {
      // Reinsert wrong questions after user has gone through all remaining questions
      session.remainingQuestions = [...session.wrongQuestions];
      session.wrongQuestions = [];
      await session.save();
      
      // Re-populate after update
      await session.populate('remainingQuestions');
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
    
    res.json({
      success: true,
      data: {
        question: nextQuestion,
        progress: {
          total: session.allQuestions.length,
          remaining: session.remainingQuestions.length,
          correct: session.correctCount,
          wrong: session.wrongCount
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
    const { questionId, isCorrect } = req.body;
    
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

    // Update question stats
    const question = await Question.findById(questionId);
    if (question) {
      if (isCorrect) {
        question.totalCorrect += 1;
        session.correctCount += 1;
        session.correctQuestions.push(questionId);
      } else {
        question.totalWrong += 1;
        session.wrongCount += 1;
        session.wrongQuestions.push(questionId);
        
        // BUFFER MODE: Add to wrong questions (will be reinserted later)
        // We don't add back immediately - we'll handle in getNextQuestion
      }
      question.lastReviewed = new Date();
      await question.save();
    }

    // Remove from remaining questions (whether correct or wrong)
    session.remainingQuestions = session.remainingQuestions.filter(
      id => id.toString() !== questionId
    );

    // RANDOM MODE: Add wrong questions back to random position immediately
    if (session.mode === 'random' && !isCorrect) {
      const randomPosition = Math.floor(Math.random() * (session.remainingQuestions.length + 1));
      session.remainingQuestions.splice(randomPosition, 0, questionId);
    }

    // BUFFER MODE: Wrong questions are tracked in wrongQuestions array
    // They will be reinserted in getNextQuestion when appropriate

    await session.save();

    res.json({
      success: true,
      message: `Answer submitted: ${isCorrect ? 'Correct' : 'Wrong'}`,
      data: {
        progress: {
          total: session.allQuestions.length,
          remaining: session.remainingQuestions.length,
          correct: session.correctCount,
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
    const session = await ReviewSession.findOne({
      userId: req.userId,
      isActive: true
    })
    .populate('sectionIds', 'name color')
    .populate('remainingQuestions')
    .populate('correctQuestions')
    .populate('wrongQuestions');

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
          mode: session.mode,
          sections: session.sectionIds,
          progress: {
            total: session.allQuestions.length,
            remaining: session.remainingQuestions.length,
            correct: session.correctCount,
            wrong: session.wrongCount
          },
          startTime: session.startTime
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