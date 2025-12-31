// backend/scripts/FixQuestionFieldsPROD.cjs
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Question from '../models/Question.js'; // ES module import

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

async function fixQuestionFields() {
    try {
        await mongoose.connect(process.env.MONGODB_URI_PROD || process.env.MONGODB_URI);
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
                    priority: 0,
                    dueDate: new Date(),
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

        // Also update questions that have been reviewed
        const reviewedQuestions = await Question.find({
            lastReviewed: { $exists: true, $ne: null },
            priority: 0
        });

        for (const question of reviewedQuestions) {
            await Question.findByIdAndUpdate(question._id, {
                priority: 3,
                dueDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000)
            });
        }

        console.log(`Updated ${reviewedQuestions.length} reviewed questions`);

        await mongoose.connection.close();
        console.log('Migration complete!');

    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

fixQuestionFields();