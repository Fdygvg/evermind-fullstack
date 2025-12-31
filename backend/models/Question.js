import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  // ============ EXISTING FIELDS ============
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Section',
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  totalCorrect: {
    type: Number,
    default: 0
  },
  totalWrong: {
    type: Number,
    default: 0
  },
  isCode: {
    type: Boolean,
    default: false
  },
  lastReviewed: {
    type: Date
  },

  // ============ NEW FIELDS FROM PROVIDED SCHEMA ============
  // (only adding what wasn't in your current schema)

  nextReviewDate: {
    type: Date,
    default: Date.now
  },

  priority: {
    type: Number,
    enum: [0, 1, 2, 3, 4, 5],
    default: 0
  },

  lastRating: {
    type: Number,
    enum: [1, 2, 3, 4, 5],
    default: null
  },

  dueDate: {
    type: Number,  // Session day number (not calendar date!)
    default: 0     // 0 = due immediately in next session
  },

  timesReviewed: {
    type: Number,
    default: 0
  },

  wasRolledOver: {
    type: Boolean,
    default: false
  },

  priorityBoosts: {
    type: Number,
    default: 0
  },

  consecutiveMisses: {
    type: Number,
    default: 0
  },

  lastReviewedAt: {
    type: Date,
    default: null
  },

  easeFactor: {
    type: Number,
    default: 2.5
  },

  currentInterval: {
    type: Number,
    default: 0
  },

  // PENDING QUESTION TRACKING (for incomplete sessions)
  isPending: {
    type: Boolean,
    default: false
  },

  pendingSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReviewSession',
    default: null
  }
},
  {
    timestamps: true
  });

questionSchema.index({ userId: 1, priority: 1, dueDate: 1 });
questionSchema.index({ userId: 1, dueDate: 1 });
questionSchema.index({ userId: 1, sectionId: 1, priority: 1 });
// Three-track system indexes
questionSchema.index({ userId: 1, sectionId: 1, dueDate: 1, priority: 1 });
questionSchema.index({ userId: 1, isPending: 1 });
questionSchema.index({ userId: 1, sectionId: 1, lastReviewedAt: 1 });

const Question = mongoose.model('Question', questionSchema);
export default Question;