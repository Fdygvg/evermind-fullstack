// models/Question.js
import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
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
  // Simple tracking - no complicated intervals
  totalCorrect: {
    type: Number,
    default: 0
  },
  totalWrong: {
    type: Number,
    default: 0
  },
  lastReviewed: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Question = mongoose.model('Question', questionSchema);
export default Question;