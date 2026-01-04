import json
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId

def fix_and_import():
    # ============ CONFIG ============
    MONGO_URI = "mongodb+srv://jackcollmas:v7UubtqRQ04bDH8t@cluster0.3ezbv9h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
    DB_NAME = "evermind"
    COLLECTION = "questions"
    
    # CHANGE THESE TO YOUR ACTUAL IDs!
    USER_ID = "692edd208a4f05bc8c4544b5"  # ← Your actual user ID
    SECTION_ID = "6959839fa7ba2b602d0b4f5d"  # ← Your actual section ID
    
    INPUT_FILE = "questions.json"  # Your file with just question/answer
    OUTPUT_FILE = "questions_ready_for_mongo.json"
    
    # ============ DO THE IMPORT ============
    try:
        print("📄 Reading your questions file...")
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            questions = json.load(f)
        
        print(f"Found {len(questions)} questions")
        
        # Transform each question
        print("🔄 Adding missing fields...")
        transformed = []
        current_time = datetime.now()
        
        for i, q in enumerate(questions):
            # Detect if it's code
            question_text = (q.get("question", "") + " " + q.get("answer", "")).lower()
            code_keywords = ["function", "const ", "var ", "let ", "class ", "def ", 
                           "import ", "export ", "console.log", "return ", "if (", 
                           "for (", "while (", "<div>", "<script>", "css", "html", 
                           "javascript", "python", "java", "c++", "code", "syntax"]
            
            is_code = any(keyword in question_text for keyword in code_keywords)
            
            # Create complete question document
            full_question = {
                "question": q.get("question", "").strip(),
                "answer": q.get("answer", "").strip(),
                "userId": ObjectId(USER_ID),
                "sectionId": ObjectId(SECTION_ID),
                "totalCorrect": 0,
                "totalWrong": 0,
                "isActive": True,
                "isCode": is_code,
                "dueDate": 0,
                "priority": 0,
                "isPending": False,
                "pendingSessionId": None,
                "timesReviewed": 0,
                "wasRolledOver": False,
                "priorityBoosts": 0,
                "consecutiveMisses": 0,
                "easeFactor": 2.5,
                "currentInterval": 0,
                "lastRating": None,
                "lastReviewed": None,
                "createdAt": current_time,
                "updatedAt": current_time,
                "nextReviewDate": current_time,
                "__v": 0
            }
            transformed.append(full_question)
            
            if (i + 1) % 50 == 0:
                print(f"  Processed {i + 1}/{len(questions)}...")
        
        # Save transformed data
        print(f"💾 Saving transformed data to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(transformed, f, default=str, indent=2)
        
        # Connect to MongoDB and import
        print("📡 Connecting to MongoDB...")
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db[COLLECTION]
        
        print("🚀 Importing to MongoDB...")
        result = collection.insert_many(transformed)
        
        print(f"✅ SUCCESS! Imported {len(result.inserted_ids)} questions")
        print(f"📊 Collection now has: {collection.count_documents({})} total questions")
        
        # Show sample
        print("\n📋 Sample imported question:")
        sample = collection.find_one()
        print(f"  Question: {sample['question'][:50]}...")
        print(f"  Answer: {sample['answer'][:50]}...")
        print(f"  User ID: {sample['userId']}")
        print(f"  Section ID: {sample['sectionId']}")
        print(f"  isCode: {sample['isCode']}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("⚠️  Make sure these IDs are correct:")
    print(f"   USER_ID: 692edd208a4f05bc8c4544b5")
    print(f"   SECTION_ID: 6959839fa7ba2b602d0b4f5d")
    
    confirm = input("\n👉 Are these IDs correct? (yes/no): ").strip().lower()
    if confirm == 'yes':
        fix_and_import()
    else:
        print("Please update the USER_ID and SECTION_ID in the script first!")