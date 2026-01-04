// backend/scripts/fixQuestionFieldsPROD_V2.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Question from '../models/Question.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function fixQuestionFields() {
    try {
        console.log('🌐 Connecting to PRODUCTION database...');

        const prodUri = process.env.MONGODB_URI_PROD ||
            'mongodb+srv://jackcollmas:v7UubtqRQ04bDH8t@cluster0.3ezbv9h.mongodb.net/evermind';

        await mongoose.connect(prodUri);
        console.log('✅ Connected to PRODUCTION MongoDB');

        const totalQuestions = await Question.countDocuments();
        console.log(`📊 Total questions in PROD: ${totalQuestions}`);

        console.log('🔧 Fixing ALL questions to match new schema...');

        // 1. FIX dueDate: Convert Date → Number (session day)
        // If dueDate is a Date object, convert to session day 0
        const dateToNumberResult = await Question.updateMany(
            {
                $or: [
                    { dueDate: { $type: 'date' } }, // Is a Date object
                    { dueDate: { $type: 'string' } } // Or string date
                ]
            },
            [
                {
                    $set: {
                        dueDate: {
                            $cond: {
                                if: { $eq: [{ $type: "$dueDate" }, "date"] },
                                then: 0, // Reset to session day 0
                                else: {
                                    $cond: {
                                        if: { $eq: [{ $type: "$dueDate" }, "string"] },
                                        then: 0, // Reset to session day 0  
                                        else: "$dueDate"
                                    }
                                }
                            }
                        }
                    }
                }
            ],
            { updatePipeline: true }
        );

        console.log(`✅ Converted ${dateToNumberResult.modifiedCount} dueDate fields from Date → Number`);

        // 2. ADD ALL missing new fields to EVERY question
        const addMissingFieldsResult = await Question.updateMany(
            {}, // Update ALL questions
            [
                {
                    $set: {
                        // Ensure these fields exist with correct defaults
                        timesReviewed: { $ifNull: ["$timesReviewed", 0] },
                        wasRolledOver: { $ifNull: ["$wasRolledOver", false] },
                        priorityBoosts: { $ifNull: ["$priorityBoosts", 0] },
                        consecutiveMisses: { $ifNull: ["$consecutiveMisses", 0] },
                        easeFactor: { $ifNull: ["$easeFactor", 2.5] },
                        currentInterval: { $ifNull: ["$currentInterval", 0] },
                        lastRating: { $ifNull: ["$lastRating", null] },
                        isPending: { $ifNull: ["$isPending", false] },
                        pendingSessionId: { $ifNull: ["$pendingSessionId", null] },
                        nextReviewDate: { $ifNull: ["$nextReviewDate", new Date()] }
                    }
                }
            ],
            { updatePipeline: true }
        );

        console.log(`✅ Added missing fields to ${addMissingFieldsResult.modifiedCount} questions`);

        // 3. FIX priority values (ensure they're 0-5)
        const fixPriorityResult = await Question.updateMany(
            {
                $or: [
                    { priority: { $lt: 0 } },
                    { priority: { $gt: 5 } },
                    { priority: { $exists: false } }
                ]
            },
            { $set: { priority: 0 } }
        );

        console.log(`✅ Fixed priority for ${fixPriorityResult.modifiedCount} questions`);

        // 4. Update reviewed questions (has lastReviewed date)
        const reviewedQuestions = await Question.find({
            lastReviewed: { $exists: true, $ne: null },
            priority: 0 // But still marked as new
        });

        console.log(`📝 Found ${reviewedQuestions.length} reviewed-but-new questions`);

        if (reviewedQuestions.length > 0) {
            const reviewedUpdateResult = await Question.updateMany(
                {
                    lastReviewed: { $exists: true, $ne: null },
                    priority: 0
                },
                {
                    $set: {
                        priority: 3,
                        dueDate: 7, // 7 sessions from now
                    },
                    $inc: {
                        timesReviewed: 1
                    }
                }
            );

            console.log(`✅ Updated ${reviewedUpdateResult.modifiedCount} reviewed questions to priority 3`);
        }

        // 5. Show sample of updated questions
        const sampleQuestions = await Question.find().limit(3);
        console.log('\n📋 Sample questions after migration:');
        sampleQuestions.forEach((q, i) => {
            console.log(`  ${i + 1}. ID: ${q._id}`);
            console.log(`     Question: ${q.question.substring(0, 30)}...`);
            console.log(`     Priority: ${q.priority} (type: ${typeof q.priority})`);
            console.log(`     dueDate: ${q.dueDate} (type: ${typeof q.dueDate})`);
            console.log(`     timesReviewed: ${q.timesReviewed}`);
            console.log(`     easeFactor: ${q.easeFactor}`);
            console.log(`     isPending: ${q.isPending}`);
        });

        // 6. Final verification
        const questionsWithWrongDueDateType = await Question.countDocuments({
            $or: [
                { dueDate: { $type: 'date' } },
                { dueDate: { $type: 'string' } }
            ]
        });

        const questionsMissingFields = await Question.countDocuments({
            $or: [
                { timesReviewed: { $exists: false } },
                { easeFactor: { $exists: false } },
                { currentInterval: { $exists: false } }
            ]
        });

        console.log('\n📊 Final Verification:');
        console.log(`   Questions with wrong dueDate type: ${questionsWithWrongDueDateType}`);
        console.log(`   Questions missing new fields: ${questionsMissingFields}`);

        if (questionsWithWrongDueDateType === 0 && questionsMissingFields === 0) {
            console.log('🎉 PROD migration COMPLETELY successful!');
        } else {
            console.log('⚠️  Some issues remain - may need manual fix');
        }

        await mongoose.connection.close();
        console.log('🚀 PROD migration complete!');

    } catch (error) {
        console.error('❌ PROD Migration error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Add confirmation prompt
import readline from 'readline';
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('⚠️  WARNING: This will update ALL 344 questions in PRODUCTION!');
console.log('   It will convert dueDate from Date → Number and add new fields.');
rl.question('   Continue? (yes/no): ', async (answer) => {
    if (answer.toLowerCase() === 'yes') {
        await fixQuestionFields();
    } else {
        console.log('Migration cancelled.');
    }
    rl.close();
});