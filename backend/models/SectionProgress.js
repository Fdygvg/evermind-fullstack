import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const SectionProgressSchema = new mongoose.Schema({
    userId: { type: ObjectId, ref: 'User', required: true },
    sectionId: { type: ObjectId, ref: 'Section', required: true },
    currentSessionDay: { type: Number, default: 1 },
    totalSessions: { type: Number, default: 0 },
    lastReviewed: { type: Date, default: null },
    alreadyAdvancedThisSession: {
        type: Boolean,
        default: false
    },
    lastSessionDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

SectionProgressSchema.index({ userId: 1, sectionId: 1 }, { unique: true });

const SectionProgress = mongoose.model('SectionProgress', SectionProgressSchema);

export default SectionProgress;