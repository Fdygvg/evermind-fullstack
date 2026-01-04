import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';
import Question from '../models/Question.js'; // Ensure this model path is correct

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
dotenv.config({ path: join(__dirname, '..', '.env') });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function importQuestions() {
    try {
        console.log('📦 Starting Question Import Tool...');

        // 1. Ask for details
        const userId = await askQuestion('👤 Enter Target User ID: ');
        if (!userId) {
            console.error('❌ User ID is required!');
            process.exit(1);
        }

        const sectionId = await askQuestion('📂 Enter Target Section ID: ');
        if (!sectionId) {
            console.error('❌ Section ID is required!');
            process.exit(1);
        }

        const jsonFileName = await askQuestion('📄 Enter JSON file name (default: questions_cleaned.json): ');
        const finalFileName = jsonFileName.trim() || 'questions_cleaned.json';

        // 2. Read File
        // Adjust path to point to root or specific location. 
        // Assuming questions_cleaned.json is in project root (parent of backend).
        const filePath = join(__dirname, '..', '..', finalFileName);

        console.log(`📖 Reading from: ${filePath}`);
        if (!fs.existsSync(filePath)) {
            console.error('❌ File not found at:', filePath);
            process.exit(1);
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const rawQuestions = JSON.parse(fileContent);

        console.log(`📊 Found ${rawQuestions.length} questions in file.`);

        // 3. Connect DB
        const prodUri = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;
        if (!prodUri) {
            console.error('❌ MONGODB_URI_PROD or MONGODB_URI not found in .env');
            process.exit(1);
        }

        console.log('🌐 Connecting to MongoDB...');
        await mongoose.connect(prodUri);
        console.log('✅ Connected.');

        // 4. Transform Data
        console.log('🔄 Transforming data...');
        const questionsToInsert = rawQuestions.map(q => ({
            userId: new mongoose.Types.ObjectId(userId),
            sectionId: new mongoose.Types.ObjectId(sectionId),
            question: q.question,
            answer: q.answer,

            // Optional: Keep isCode if present, otherwise default
            isCode: q.isCode !== undefined ? q.isCode : false,

            // Reset progress tracking to fresh state
            totalCorrect: 0,
            totalWrong: 0,
            isActive: true,
            dueDate: 0, // Ready for session 0
            priority: 0, // New priority
            timesReviewed: 0,
            wasRolledOver: false,
            priorityBoosts: 0,
            consecutiveMisses: 0,
            easeFactor: 2.5,
            currentInterval: 0,
            lastRating: null,
            isPending: false,
            pendingSessionId: null,
            nextReviewDate: new Date(), // Now
        }));

        // 5. Insert
        console.log(`🚀 Importing ${questionsToInsert.length} questions...`);
        const result = await Question.insertMany(questionsToInsert);

        console.log(`\n🎉 Success! Imported ${result.length} questions.`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Section ID: ${sectionId}`);

    } catch (error) {
        console.error('\n❌ Import Failed:', error.message);
    } finally {
        await mongoose.connection.close();
        rl.close();
        process.exit(0);
    }
}

importQuestions();
