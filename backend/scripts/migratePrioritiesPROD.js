import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Question from '../models/Question.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load production environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function migratePrioritiesProd() {
    try {
        // Use the PRODUCTION URI
        console.log('Connecting to PRODUCTION database...');
        await mongoose.connect(process.env.MONGODB_URI_PROD);

        console.log('Migrating question priorities on PRODUCTION...');

        // Your existing migration logic here...
        const result = await Question.updateMany(
            { priority: { $exists: false } },
            {
                $set: {
                    priority: 0,
                    dueDate: new Date()
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} questions on PRODUCTION`);

        const reviewedQuestions = await Question.find({
            lastRating: { $exists: true, $ne: null },
            priority: 0
        });

        for (const question of reviewedQuestions) {
            await Question.findByIdAndUpdate(question._id, {
                priority: question.lastRating
            });
        }

        console.log(`Updated ${reviewedQuestions.length} reviewed questions on PRODUCTION`);

        mongoose.connection.close();
        console.log('PRODUCTION migration complete!');

    } catch (error) {
        console.error('PRODUCTION Migration error:', error);
        process.exit(1);
    }
}

migratePrioritiesProd();