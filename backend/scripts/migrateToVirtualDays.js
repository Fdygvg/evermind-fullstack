import dotenv from 'dotenv';
import Question from '../models/Question.js';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

async function migrateToVirtualDays() {
    try {
        await connectDB();
        
        console.log('Starting migration to virtual session days...');
        console.log('Converting dueDate from calendar dates to session day numbers');
        
        // Set all existing questions to dueDate = 0 (show immediately in next session)
        // This ensures no questions are lost during migration
        const result = await Question.updateMany(
            { 
                $or: [
                    { dueDate: { $type: 'date' } },  // Find Date types
                    { dueDate: { $exists: false } }   // Or missing dueDate
                ]
            },
            { dueDate: 0 }  // Set to session day 0 (due immediately)
        );
        
        console.log(`✓ Migrated ${result.modifiedCount} questions`);
        console.log('  All questions set to dueDate=0 (will appear in next session)');
        console.log('');
        console.log('Migration complete!');
        console.log('Note: Questions will now use session day numbers instead of calendar dates');
        console.log('Example: dueDate=5 means "due on session day 5" for that section');
        
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateToVirtualDays();

