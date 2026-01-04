// backend/scripts/migrateBookmarks.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function migrateBookmarks() {
    try {
        console.log('🌐 Connecting to database...');

        // Use your existing connection logic
        const dbUri = process.env.MONGODB_URI_PROD;

        await mongoose.connect(dbUri);
        console.log('✅ Connected to MongoDB');

        // Dynamically import the Question model
        const { default: Question } = await import('../models/Question.js');

        console.log('🔍 Analyzing database...');

        // Count total questions
        const totalQuestions = await Question.countDocuments();
        console.log(`📊 Total questions: ${totalQuestions}`);

        // Find questions WITHOUT isBookmarked field
        const questionsWithoutBookmark = await Question.find({
            $or: [
                { isBookmarked: { $exists: false } },
                { isBookmarked: null }
            ]
        }).select('_id question');

        console.log(`⚠️  Found ${questionsWithoutBookmark.length} questions missing isBookmarked field`);

        if (questionsWithoutBookmark.length === 0) {
            console.log('✅ All questions already have isBookmarked field!');

            // Verify schema consistency
            const sample = await Question.find().limit(3).select('_id isBookmarked bookmarkedAt');
            console.log('\n🔍 Sample verification:');
            sample.forEach(q => {
                console.log(`   Question ${String(q._id).slice(-6)}: isBookmarked = ${q.isBookmarked}, bookmarkedAt = ${q.bookmarkedAt}`);
            });

            await mongoose.disconnect();
            return;
        }

        // Show what we're about to update
        console.log('\n📝 First 5 questions to update:');
        questionsWithoutBookmark.slice(0, 5).forEach((q, i) => {
            console.log(`   ${i + 1}. ${String(q._id)} - "${q.question.substring(0, 50)}..."`);
        });

        // Ask for confirmation
        console.log(`\n⚠️  This will add "isBookmarked: false" to ${questionsWithoutBookmark.length} questions`);
        const readline = await import('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise(resolve => {
            rl.question('   Continue? (yes/no): ', resolve);
        });
        rl.close();

        if (answer.toLowerCase() !== 'yes') {
            console.log('🚫 Migration cancelled.');
            await mongoose.disconnect();
            return;
        }

        // Perform migration in batches
        console.log('🔄 Starting migration...');
        const BATCH_SIZE = 100;
        let updatedCount = 0;

        for (let i = 0; i < questionsWithoutBookmark.length; i += BATCH_SIZE) {
            const batch = questionsWithoutBookmark.slice(i, i + BATCH_SIZE);

            const bulkOps = batch.map(question => ({
                updateOne: {
                    filter: { _id: question._id },
                    update: {
                        $set: {
                            isBookmarked: false,
                            bookmarkedAt: null,
                            updatedAt: new Date()
                        }
                    }
                }
            }));

            const result = await Question.bulkWrite(bulkOps);
            updatedCount += result.modifiedCount;

            console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}: Updated ${result.modifiedCount} questions`);
        }

        // Ensure ALL questions have the field (even if they had weird values)
        const finalResult = await Question.updateMany(
            {},
            {
                $setOnInsert: { bookmarkedAt: null },
                $set: { updatedAt: new Date() }
            },
            { upsert: false }
        );

        console.log('\n✅ Migration Summary:');
        console.log(`   Total questions in DB: ${totalQuestions}`);
        console.log(`   Questions updated: ${updatedCount}`);
        console.log(`   Already had field: ${totalQuestions - questionsWithoutBookmark.length}`);

        // Final verification
        console.log('\n🔍 Final verification:');

        // Check if any questions still missing the field
        const stillMissing = await Question.countDocuments({
            isBookmarked: { $exists: false }
        });

        if (stillMissing > 0) {
            console.log(`❌ ERROR: ${stillMissing} questions still missing isBookmarked field`);
        } else {
            console.log('✅ All questions now have isBookmarked field!');
        }

        // Show updated sample
        const updatedSample = await Question.find().limit(3).select('_id isBookmarked bookmarkedAt updatedAt');
        console.log('\n📋 Updated sample:');
        updatedSample.forEach((q, i) => {
            const updatedTime = q.updatedAt ? new Date(q.updatedAt).toLocaleTimeString() : 'N/A';
            console.log(`   ${i + 1}. ${String(q._id).slice(-6)}: isBookmarked=${q.isBookmarked}, updated=${updatedTime}`);
        });

        // Count distribution
        const stats = await Question.aggregate([
            {
                $group: {
                    _id: "$isBookmarked",
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n📊 Bookmark distribution:');
        stats.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.count} questions`);
        });

        console.log('\n🎉 Migration complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from database');
    }
}

// Run migration
migrateBookmarks();