# **Smart Review System - Complete Specification**

## **🎯 CORE CONCEPT:**
A **per-section independent timeline** system where each section progresses through "virtual days" independently, regardless of calendar dates.

## **📊 SYSTEM OVERVIEW:**

### **1. PER-SECTION TIMELINES:**
- Each **section** has its own `currentSessionDay` counter
- Programming section could be on **Day 3**
- Anatomy section could be on **Day 1**
- Math section could be on **Day 7**
- All can be reviewed in the **same session**

### **2. VIRTUAL DAYS (NOT CALENDAR):**
- **Day 1** = Questions scheduled for immediate review
- **Day 2** = Questions scheduled for "tomorrow" (virtual tomorrow)
- **Day 3** = Questions scheduled for "day after tomorrow"
- **No connection to real calendar dates**

### **3. QUESTION SELECTION RULES:**
For each section in a session:
- Get questions where: `dueDate <= (today + (currentSessionDay - 1))`
- **ALWAYS** include priority 0 questions (new/unreviewed)
- Sort by: Priority (0→5) then dueDate (oldest first)

### **4. DAILY LIMITS (PER-SECTION):**
Daily Limit = 50% of REVIEW questions only (Priority 1-5)

NEW questions (Priority 0): UNLIMITED (always show)
 USER EXPERIENCE:
text
User has:
- 30 NEW questions (Priority 0)
- 70 REVIEW questions (Priority 1-5)

Daily Session:
- Shows ALL 30 NEW questions (unlimited)
- Shows 35 REVIEW questions (50% of 70)
- Total: 65 questions today

"Add More" shows: 35 remaining review questions
### **5. SESSION PROGRESSION:**
```
SESSION START:
- Programming: Day 3 → Get Day 3 questions
- Anatomy: Day 1 → Get Day 1 questions

DURING SESSION:
- Rate questions 1-5 → Updates priority & dueDate

SESSION COMPLETE:
- Programming: Day 3 → Day 4 (advances)
- Anatomy: Day 1 → Day 2 (advances)
```

### **6. RATING SYSTEM (1-5):**
```
1 (Red)    😫 Hard      → Review today
2 (Orange) 😕 Medium    → Review tomorrow  
3 (Yellow) 😐 Good      → Review in 3 days
4 (Green)  🙂 Easy      → Review in 1 week
5 (Blue)   😄 Perfect   → Review in 2 weeks
```

## **🔧 KEY ALGORITHMS:**

### **A. Question Scheduling:**
```javascript
function scheduleQuestion(question, rating) {
  // Rating 1-5 → days until next review
  const daysMap = {1:1, 2:2, 3:4, 4:7, 5:14};
  const days = daysMap[rating];
  
  // Add random offset (±20%) to prevent clumping
  const offset = (Math.random() * 0.4 - 0.2); // -20% to +20%
  const actualDays = Math.max(1, days * (1 + offset));
  
  // Set new dueDate
  question.dueDate = new Date(Date.now() + actualDays * 24*60*60*1000);
  question.priority = rating; // Priority = last rating
}
```

### **B. Daily Selection:**
```javascript
function getQuestionsForSection(section, currentSessionDay) {
  // Target date = today + (currentSessionDay - 1) virtual days
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + (currentSessionDay - 1));
  
  return questions.filter(q => 
    q.sectionId === section.id && 
    (q.priority === 0 || q.dueDate <= targetDate)
  );
}
```

## **📱 FRONTEND COMPONENTS:**

### **1. RatingButtons.jsx**
- 1-5 buttons with colors/emojis
- Compact/full versions
- Animations on click

### **2. DailyCounter.jsx**  
- Shows: "15/100 questions today"
- Progress bar
- Today's stats

### **3. SectionProgressDisplay.jsx**
- Shows: "Programming: Day 3 • Anatomy: Day 1"
- Per-section timeline

### **4. AddMoreButton.jsx**
- Shows rolled-over questions
- "Add 25 more questions"

## **🔗 INTEGRATION WITH EXISTING MODES:**

### **All 4 Modes Use Same System:**
- **Normal Mode:** Rating buttons below question
- **Flashcard Mode:** Rating on card back
- **Elimination Mode:** Rating after elimination
- **TikTok Mode:** Rating overlay on swipe

### **Shared State via `useSmartReview` Hook:**
```javascript
const {
  todaysQuestions,    // Array of questions (mixed sections)
  currentQuestion,    // Current question
  rateQuestion,       // Rate current question (1-5)
  sectionProgress,    // {sectionId: {currentSessionDay: 3}}
  dailyLimit,         // Total questions for today
  reviewedToday,      // Count of rated questions
  loadTodaysQuestions // Start new session
} = useSmartReview();
```

## **✅ SUCCESS CRITERIA:**

1. **Per-section independence** - Sections progress separately
2. **No calendar dependency** - Virtual days, not real dates
3. **Same-day multiple sessions** - Each advances sections by 1 day
4. **Mixed sections in one session** - Programming Day 3 + Anatomy Day 1
5. **All existing features preserved** - Priority, limits, rollover
6. **Backward compatibility** - Old sessions still work
7. **Smooth UX** - Animations, sounds, clear feedback

## **🚨 EDGE CASES HANDLED:**

1. **New section** - Starts at Day 1
2. **Skip sessions** - Timeline doesn't reset
3. **All questions rated** - Auto-advance section
4. **Rolled-over questions** - Available via "Add more"
5. **Backlog** - Temporary limit increase (+10% per missed day)
6. **Undo rating** - Reset priority and dueDate

## **🎮 USER FLOW:**

```

1. User selects sections [Programming, Anatomy]
2. System loads:
   - Programming: Day 3 questions
   - Anatomy: Day 1 questions
3. Mixed questions shown in priority order
4. User rates each 1-5
5. Questions disappear with animation
6. Progress updates
7. Option to "Add more" rolled-over questions
8. Session complete → sections advance:
   - Programming: Day 3 → Day 4
   - Anatomy: Day 1 → Day 2
```

**This is the complete Smart Review system ready for implementation.**




and  My Recommendation: Option D
Because:

Fair: User didn't get to rate them → they deserve another chance

Practical: Won't fill up next day's queue

Simple: Just exclude them from daily limit calculation

Implementation:
javascript
function getTodaysQuestions() {
  // 1. Get ALL new questions (priority 0) - UNLIMITED ✓
  // 2. Get ALL unrated questions from previous sessions - UNLIMITED ✓
  // 3. Get review questions (priority 1-5) - LIMITED to 50% ✓
  
  const unlimitedQuestions = [
    ...newQuestions,
    ...unratedQuestions // From previous sessions
  ];
  
  const limitedQuestions = reviewQuestions.slice(0, reviewLimit);
  
  return [...unlimitedQuestions, ...limitedQuestions];
}
User Experience:
text
Session 1 (50 questions):
- Rates 30 questions → they get scheduled
- 20 unrated → marked as "pending"

Session 2 (next day):
- Shows: 20 pending questions (unlimited)
- Shows: 15 new questions (unlimited)  
- Shows: 25 review questions (limited)
Total: 60 questions (20+15 unlimited, 25 limited)
This ensures unrated questions don't get lost, but also don't overwhelm the system.