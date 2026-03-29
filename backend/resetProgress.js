import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from './models/Question.js';
import SessionList from './models/ReviewSession.js';

// Load env vars
dotenv.config();

const resetProgress = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const result = await Question.updateMany(
      {},
      {
        $set: {
          totalCorrect: 0,
          totalWrong: 0,
          lastReviewed: null,
          nextReviewDate: new Date(),
          priority: 0,
          lastRating: null,
          dueDate: 0,
          timesReviewed: 0,
          wasRolledOver: false,
          priorityBoosts: 0,
          consecutiveMisses: 0,
          lastReviewedAt: null,
          easeFactor: 2.5,
          currentInterval: 0,
          isPending: false,
          pendingSessionId: null
        }
      }
    );

    console.log(`Successfully reset progress for ${result.modifiedCount} questions.`);

    const sessionResult = await mongoose.model('ReviewSession').deleteMany({});
    console.log(`Deleted ${sessionResult.deletedCount} old sessions.`);

    process.exit(0);
  } catch (error) {
    console.error('Error resetting progress:', error);
    process.exit(1);
  }
};

resetProgress();
