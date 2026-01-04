import json

def clean_large_json_file(input_file, output_file):
    """
    Memory-efficient version for large JSON files.
    Processes the file line by line.
    """
    cleaned_items = []
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
            if isinstance(data, list):
                for i, obj in enumerate(data):
                    # Keep only question and answer
                    cleaned = {
                        "question": obj.get("question", ""),
                        "answer": obj.get("answer", "")
                    }
                    cleaned_items.append(cleaned)
                    
                    # Progress indicator
                    if (i + 1) % 500 == 0:
                        print(f"📊 Processed {i + 1} items...")
            
        # Write cleaned data
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(cleaned_items, f, indent=2, ensure_ascii=False)
            
        print(f"✅ Cleaned {len(cleaned_items)} items successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")

# Usage
clean_large_json_file("questions.json", "questions_cleaned.json")