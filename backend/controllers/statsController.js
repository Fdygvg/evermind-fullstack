// controllers/statsController.js
import UserStats from '../models/UserStats.js';
import ReviewSession from '../models/ReviewSession.js';
import Question from '../models/Question.js';
import mongoose from "mongoose"

export const getUserStats = async (req, res) => {
  try {
    let userStats = await UserStats.findOne({ userId: req.userId });
    
    // Create stats if doesn't exist
    if (!userStats) {
      userStats = new UserStats({
        userId: req.userId,
        currentStreak: 0,
        longestStreak: 0,
        totalSessions: 0,
        totalQuestionsReviewed: 0,
        totalCorrectAnswers: 0,
        totalTimeSpent: 0
      });
      await userStats.save();
    }

    // Get additional real-time stats
    const totalQuestions = await Question.countDocuments({ userId: req.userId });
    const totalSessions = await ReviewSession.countDocuments({ userId: req.userId });
    
    // Calculate accuracy
    const accuracy = userStats.totalQuestionsReviewed > 0 
      ? Math.round((userStats.totalCorrectAnswers / userStats.totalQuestionsReviewed) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        stats: {
          ...userStats.toObject(),
          totalQuestions,
          totalSessions,
          accuracy,
          averageTimePerSession: userStats.totalSessions > 0 
            ? Math.round(userStats.totalTimeSpent / userStats.totalSessions)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user stats'
    });
  }
};

export const getSessionHistory = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const sessions = await ReviewSession.find({
      userId: req.userId,
      isActive: false // Only completed sessions
    })
    .sort({ endTime: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('sectionIds', 'name color')
    .select('cardMode correctCount wrongCount startTime endTime sectionIds');

    const sessionHistory = sessions.map(session => {
      // Handle cases where startTime or endTime might be missing
      const startTime = session.startTime || session.createdAt;
      const endTime = session.endTime || new Date();
      
      return {
        id: session._id,
        cardMode: session.cardMode,
        sections: session.sectionIds || [],
        correct: session.correctCount || 0,
        wrong: session.wrongCount || 0,
        total: (session.correctCount || 0) + (session.wrongCount || 0),
        accuracy: (session.correctCount || 0) + (session.wrongCount || 0) > 0 
          ? Math.round((session.correctCount / ((session.correctCount || 0) + (session.wrongCount || 0))) * 100)
          : 0,
        duration: endTime && startTime
          ? Math.round((endTime - startTime) / 60000) // minutes
          : 0,
        date: endTime || startTime || new Date()
      };
    });

    res.json({
      success: true,
      data: { sessions: sessionHistory },
      count: sessionHistory.length
    });
  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session history'
    });
  }
};

export const getDetailedAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Session analytics - FIXED: Handle division by zero
    const sessionStats = await ReviewSession.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.userId),
          endTime: { $gte: startDate },
          isActive: false
        }
      },
      {
        $addFields: {
          totalAnswers: { $add: ['$correctCount', '$wrongCount'] },
          sessionDurationMinutes: { 
            $divide: [
              { $subtract: ['$endTime', '$startTime'] },
              60000 // Convert ms to minutes
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalQuestions: { $sum: '$totalAnswers' },
          totalCorrect: { $sum: '$correctCount' },
          totalTimeMinutes: { $sum: '$sessionDurationMinutes' },
          avgAccuracy: {
            $avg: {
              $cond: [
                { $gt: ['$totalAnswers', 0] },
                { $divide: ['$correctCount', '$totalAnswers'] },
                0
              ]
            }
          }
        }
      }
    ]);

    // Category performance - FIXED: Clean and working
    const categoryStats = await Question.aggregate([
      {
        $match: { 
          userId: new mongoose.Types.ObjectId(req.userId) 
        }
      },
      {
        $lookup: {
          from: 'sections',
          localField: 'sectionId',
          foreignField: '_id',
          as: 'section'
        }
      },
      {
        $addFields: {
          sectionName: { $arrayElemAt: ['$section.name', 0] },
          totalAttempts: { $add: ['$totalCorrect', '$totalWrong'] }
        }
      },
      {
        $group: {
          _id: '$sectionId',
          category: { $first: '$sectionName' },
          totalQuestions: { $sum: 1 },
          totalCorrect: { $sum: '$totalCorrect' },
          totalWrong: { $sum: '$totalWrong' },
          totalAttempts: { $sum: '$totalAttempts' }
        }
      },
      {
        $project: {
          category: 1,
          totalQuestions: 1,
          totalCorrect: 1,
          totalWrong: 1,
          totalAttempts: 1,
          accuracy: {
            $cond: [
              { $gt: ['$totalAttempts', 0] },
              { $multiply: [{ $divide: ['$totalCorrect', '$totalAttempts'] }, 100] },
              0
            ]
          }
        }
      }
    ]);

    // Process session stats for clean output
    const stats = sessionStats[0] || {};
    const totalQuestions = stats.totalQuestions || 0;
    const totalCorrect = stats.totalCorrect || 0;
    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) : 0;

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        sessionStats: {
          totalSessions: stats.totalSessions || 0,
          totalQuestions: totalQuestions,
          totalCorrect: totalCorrect,
          totalWrong: totalQuestions - totalCorrect,
          totalTimeMinutes: Math.round(stats.totalTimeMinutes || 0),
          totalTimeFormatted: `${Math.round(stats.totalTimeMinutes || 0)} min`,
          avgAccuracy: Math.round(accuracy * 100),
          accuracyFormatted: `${Math.round(accuracy * 100)}%`
        },
        categoryStats: categoryStats,
        startDate,
        endDate: new Date()
      }
    });
  } catch (error) {
    console.error('Detailed analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching detailed analytics'
    });
  }
};