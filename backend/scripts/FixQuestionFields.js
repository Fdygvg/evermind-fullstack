// backend/scripts/fixQuestionFields.js
import mongoose from 'mongoose';
import Question from '../models/Question.js';

async function fixQuestionFields() {
    try {
        // await mongoose.connect('mongodb+srv://jackcollmas:v7UubtqRQ04bDH8t@cluster0.3ezbv9h.mongodb.net/evermind');
        await mongoose.connect('mongodb://localhost:27017/evermind');
        console.log('Fixing question fields...');

        // Add missing Smart Review fields to ALL questions
        const result = await Question.updateMany(
            {
                $or: [
                    { priority: { $exists: false } },
                    { priority: null },
                    { dueDate: { $exists: false } }
                ]
            },
            {
                $set: {
                    priority: 0, // Default to "new/unreviewed"
                    dueDate: new Date(), // Due now
                    lastRating: null,
                    timesReviewed: 0,
                    wasRolledOver: false,
                    priorityBoosts: 0,
                    consecutiveMisses: 0,
                    easeFactor: 2.5,
                    currentInterval: 0
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} questions`);

        // Also update questions that have been reviewed (have lastReviewed date)
        const reviewedQuestions = await Question.find({
            lastReviewed: { $exists: true, $ne: null },
            priority: 0 // But still marked as new
        });

        for (const question of reviewedQuestions) {
            // If it has lastReviewed, it's not new
            await Question.findByIdAndUpdate(question._id, {
                priority: 3, // Default to "medium" priority
                dueDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
            });
        }

        console.log(`Updated ${reviewedQuestions.length} reviewed questions`);

        mongoose.connection.close();
        console.log('Migration complete!');

    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

fixQuestionFields();