import json
from datetime import datetime
from bson import ObjectId

# ============ CONFIG ============
USER_ID = "692edd208a4f05bc8c4544b5"  # ← PUT YOUR USER ID HERE
SECTION_ID = "695aa324dc873b2b7a911e07"  # ← PUT YOUR SECTION ID HERE

def enhance_json_file():
    """
    Add all missing Evermind fields to your questions.json
    Output: questions_enhanced.json (ready for MongoDB import)
    """
    # ============ FILE PATHS ============
    INPUT_FILE = "questions_cleaned.json"  # Your file with just question/answer
    OUTPUT_FILE = "questions_enhanced.json"
    
    # ============ PROCESS ============
    try:
        print(f"📄 Reading {INPUT_FILE}...")
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            questions = json.load(f)
        
        print(f"Found {len(questions)} questions")
        
        enhanced_questions = []
        current_time = datetime.now()
        
        print("🔄 Adding Evermind fields...")
        
        for i, q in enumerate(questions):
            # Detect if it's code
            question_text = (q.get("question", "") + " " + q.get("answer", "")).lower()
            code_keywords = ["function", "const ", "var ", "let ", "class ", "def ", 
                           "import ", "export ", "console.log", "return ", "if (", 
                           "for (", "while (", "<div>", "<script>", "css", "html", 
                           "javascript", "python", "java", "c++", "code", "syntax"]
            
            is_code = any(keyword in question_text for keyword in code_keywords)
            
            # Create enhanced question in MongoDB format
            enhanced = {
                "_id": {"$oid": str(ObjectId())},  # New ObjectId
                "userId": {"$oid": USER_ID},
                "sectionId": {"$oid": SECTION_ID},
                "question": q.get("question", "").strip(),
                "answer": q.get("answer", "").strip(),
                "totalCorrect": 0,
                "totalWrong": 0,
                "isActive": True,
                "isCode": is_code,
                "__v": 0,
                "createdAt": {"$date": current_time.isoformat() + "Z"},
                "updatedAt": {"$date": current_time.isoformat() + "Z"},
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
                "nextReviewDate": {"$date": current_time.isoformat() + "Z"}
            }
            
            enhanced_questions.append(enhanced)
            
            if (i + 1) % 50 == 0:
                print(f"  Enhanced {i + 1}/{len(questions)}...")
        
        # Save enhanced file
        print(f"💾 Saving to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(enhanced_questions, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Done! Created {OUTPUT_FILE} with {len(enhanced_questions)} enhanced questions")
        
        # Show sample
        print("\n📋 Sample enhanced question:")
        sample = enhanced_questions[0]
        print(json.dumps(sample, indent=2)[:500] + "...")
        
        # Instructions for import
        print("\n" + "="*50)
        print("🚀 IMPORT INSTRUCTIONS:")
        print("="*50)
        print("1. Use mongoimport command:")
        print(f'   mongoimport --uri="mongodb+srv://jackcollmas:v7UubtqRQ04bDH8t@cluster0.3ezbv9h.mongodb.net/evermind" \\')
        print(f'     --collection=questions \\')
        print(f'     --file={OUTPUT_FILE} \\')
        print(f'     --jsonArray')
        print("\n2. Or use MongoDB Compass GUI:")
        print("   - Connect to your cluster")
        print("   - Select 'evermind' database")
        print("   - Select 'questions' collection")
        print(f"   - Click 'Add Data' → 'Import File' → Select {OUTPUT_FILE}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

def quick_verify():
    """Quickly check current file structure"""
    try:
        with open("questions.json", 'r', encoding='utf-8') as f:
            sample = json.load(f)[0]
        
        print("\n🔍 Current file structure sample:")
        print(f"  Keys in first item: {list(sample.keys())}")
        print(f"  Has question field: {'question' in sample}")
        print(f"  Has answer field: {'answer' in sample}")
        
    except Exception as e:
        print(f"Could not verify: {e}")

if __name__ == "__main__":
    print("🎯 Evermind JSON Enhancer")
    print("="*50)
    
    # Show current structure
    quick_verify()
    
    print("\n⚠️  CONFIRM THESE IDs:")
    print(f"   USER_ID: {USER_ID}")
    print(f"   SECTION_ID: {SECTION_ID}")
    
    confirm = input("\n👉 Are these IDs correct? (yes/no): ").strip().lower()
    
    if confirm == 'yes':
        enhance_json_file()
    else:
        print("\nPlease update USER_ID and SECTION_ID at the TOP of the script!")
        print("\nTo get your IDs, open MongoDB Compass and:")
        print("1. USER_ID: Find in 'users' collection")
        print("2. SECTION_ID: Find in 'sections' collection")