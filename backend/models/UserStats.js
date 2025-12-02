// models/UserStats.js
import mongoose from 'mongoose';

const userStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  totalQuestionsReviewed: {
    type: Number,
    default: 0
  },
  totalCorrectAnswers: {
    type: Number,
    default: 0
  },
  totalTimeSpent: { // in minutes
    type: Number,
    default: 0
  },
  lastSessionDate: {
    type: Date
  }
}, {
  timestamps: true
});

const UserStats = mongoose.model('UserStats', userStatsSchema);
export default UserStats;