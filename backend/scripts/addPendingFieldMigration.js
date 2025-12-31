/**
 * Migration Script: Add isPending and pendingSessionId Fields
 * 
 * This script adds the new isPending and pendingSessionId fields to all existing questions
 * to support the three-track smart review system (NEW/PENDING/REVIEW).
 * 
 * Run this script once after deploying the updated Question model.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from '../models/Question.js';
import connectDB from '../config/db.js';

dotenv.config();

const migratePendingFields = async () => {
    try {
        console.log('🔄 Starting migration: Add isPending and pendingSessionId fields...');
        
        // Connect to database
        await connectDB();
        console.log('✅ Connected to database');

        // Count total questions before migration
        const totalQuestions = await Question.countDocuments({});
        console.log(`📊 Total questions in database: ${totalQuestions}`);

        // Find questions that don't have isPending field yet
        const questionsToUpdate = await Question.countDocuments({
            isPending: { $exists: false }
        });

        console.log(`🔍 Questions to update: ${questionsToUpdate}`);

        if (questionsToUpdate === 0) {
            console.log('✨ No questions need updating. Migration already completed or not needed.');
            process.exit(0);
        }

        // Update all questions without isPending field
        const result = await Question.updateMany(
            { isPending: { $exists: false } },
            { 
                $set: {
                    isPending: false,
                    pendingSessionId: null
                }
            }
        );

        console.log(`✅ Migration successful!`);
        console.log(`   - Modified: ${result.modifiedCount} questions`);
        console.log(`   - Matched: ${result.matchedCount} questions`);

        // Verify the migration
        const verifyCount = await Question.countDocuments({
            isPending: { $exists: true }
        });

        console.log(`🔍 Verification: ${verifyCount}/${totalQuestions} questions have isPending field`);

        if (verifyCount === totalQuestions) {
            console.log('✅ Migration verified successfully!');
        } else {
            console.warn('⚠️  Warning: Some questions may not have been updated.');
        }

        // Show sample of updated questions
        const sampleQuestions = await Question.find({
            isPending: { $exists: true }
        }).limit(3).select('question isPending pendingSessionId priority');

        console.log('\n📋 Sample of updated questions:');
        sampleQuestions.forEach((q, index) => {
            console.log(`   ${index + 1}. Question ID: ${q._id}`);
            console.log(`      isPending: ${q.isPending}`);
            console.log(`      pendingSessionId: ${q.pendingSessionId}`);
            console.log(`      priority: ${q.priority}`);
        });

        console.log('\n🎉 Migration completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

// Run migration
migratePendingFields();

