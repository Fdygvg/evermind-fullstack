import mongoose from 'mongoose';

const reviewSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sectionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section'
  }],
  cardMode: {
    type: String,
    enum: ['normal', 'flashcard', 'elimination'],
    default: 'normal'
  },

  allQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  remainingQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  correctQuestions: [{  // ← ADDED THIS!
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  wrongQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  mediumQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  correctCount: {
    type: Number,
    default: 0
  },
  wrongCount: {
    type: Number,
    default: 0
  },
  mediumCount: {
    type: Number,
    default: 0
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const ReviewSession = mongoose.model('ReviewSession', reviewSessionSchema);
export default ReviewSession;