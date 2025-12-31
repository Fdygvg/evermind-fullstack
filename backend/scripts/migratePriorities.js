// backend/scripts/migratePriorities.js
import mongoose from 'mongoose';
import Question from '../models/Question.js';

async function migratePriorities() {
    try {
        await mongoose.connect('mongodb+srv://jackcollmas:v7UubtqRQ04bDH8t@cluster0.3ezbv9h.mongodb.net/evermind');

        console.log('Migrating question priorities...');

        // Update questions with no priority
        const result = await Question.updateMany(
            { priority: { $exists: false } }, // Or { priority: null }
            {
                $set: {
                    priority: 0, // Mark as new/unreviewed
                    dueDate: new Date() // Make them due now
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} questions`);

        // Also update questions that have been reviewed but no priority
        const reviewedQuestions = await Question.find({
            lastRating: { $exists: true, $ne: null },
            priority: 0
        });

        for (const question of reviewedQuestions) {
            // If it has a lastRating, set priority = lastRating
            await Question.findByIdAndUpdate(question._id, {
                priority: question.lastRating
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

migratePriorities();