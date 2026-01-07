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
    enum: ['normal', 'flashcard', 'elimination', 'tiktok'],
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
  },

  // Session resumption fields
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active'
  },
  currentIndex: {
    type: Number,
    default: 0
  },
  answeredQuestionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },

  // Smart Review integration fields
  useSmartReview: {
    type: Boolean,
    default: false
  },
  smartReviewState: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

// Update lastUpdated on save
reviewSessionSchema.pre('save', function () {
  this.lastUpdated = new Date();
});

reviewSessionSchema.index({ userId: 1, status: 1 });
reviewSessionSchema.index({ userId: 1, isActive: 1 });

const ReviewSession = mongoose.model('ReviewSession', reviewSessionSchema);
export default ReviewSession;