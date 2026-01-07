# **TASK PRIORITY MATRIX - Critical Fixes First**

## **🔴 CRITICAL BUGS (Must Fix Immediately)**
<!-- 1. **In normal mode with many questions → blank screen** -->
<!-- 2. **Flashcard mode not displaying complete questions**   -->
3. **Question card on mobile inaccurate**  
<!-- 4. **Session results time showing 00:00**   -->
<!-- 5. **End session → start new → goes to results page (infinite loop)**   -->

## **🟠 HIGH PRIORITY (Major UX Issues)**
6. **Fix homepage (broken layout/functionality)**  
<!-- 7. **Fix searchbar on mobile (display + functionality)**   -->
<!-- 8. **Flashcards mode: card on floor when flipped + small buttons**   -->
9. **Swipe hard to trigger in flashcard mode (mobile & desktop)**  
<!-- 10. **Make TikTok mode display properly**   -->
11. **FAB overlapping rating buttons in normal mode mobile**  
12. **Elimination mode FAB overlaying question cards**  

## **🟡 MEDIUM PRIORITY (Important Improvements)**
13. **Fix question filter (inaccurate)**  
14. **Fix navbar on tablet**  
15. **Increase rating button size in normal mode (mobile)**  
16. **Increase rating button size in flashcard mode**  
17. **Apply new logic for prismjs (isCode questions)**  
18. **Fix pause button (add proper modals)**  
19. **Fix speed of undo action**  
20. **Slow updating of questions in elimination mode (tablet/mobile)**  

## **🟢 LOW PRIORITY (Enhancements & Polish)**
21. **Daily progress card too big (reduce size)**  
22. **Progress counter accountable for undo actions**  
23. **Remove red undo button from elimination mode**  
24. **Elimination mode on desktop needs padding**  
25. **Make swipe work from edges only (all devices)**  
26. **Add undo/pause/end to full view mode**  
27. **Change sounds and add everywhere**  
28. **Add vibration feedback (session start, rating)**  
29. **New theme selector (mobile + desktop)**  

## **🔵 NEW FEATURES (Schedule Later)**
30. **Import yesterday's questions**  
31. **Beautify text in all modes (text libraries)**  
32. **Handle long questions better (mobile)**  
33. **Add stats to full view mode (with close button)**  
34. **Offline functionality**  
35. **Upgrade settings page (remove sound/vibration)**  
36. **Add new "Fun Mode" page with games (Pokemon, Trivia)**  

---

# **GROUPED BY DOMAIN**

## **📱 MOBILE-SPECIFIC FIXES**
- Searchbar display/functionality  
- Rating button sizes (normal + flashcard modes)  
- Daily progress card size reduction  
- FAB overlapping issues  
- Long question text handling  

## **🎨 UI/UX IMPROVEMENTS**
- Question card accuracy  
- Flashcard mode layout  
- Navbar tablet fix  
- Theme selector redesign  
- Text beautification  

## **⚙️ FUNCTIONAL BUGS**
- Blank screen with many questions  
- Session results time display  
- Infinite session loop  
- Question filter accuracy  
- Slow question updates  

## **🔄 MODE-SPECIFIC ISSUES**
- **Flashcard mode:** Card position, swipe detection  
- **Elimination mode:** FAB position, desktop padding  
- **Normal mode:** Rating button size, many-questions bug  
- **TikTok mode:** Display fix  

## **🎮 NEW FEATURES**
- Fun mode with games  
- Vibration feedback  
- Offline support  
- Enhanced settings  

---

# **RECOMMENDED EXECUTION ORDER**

**Week 1:** Critical bugs (1-5) → Blocking user workflows  
**Week 2:** High priority UX (6-12) → Major pain points  
**Week 3:** Medium priority (13-20) → Important improvements  
**Week 4:** Low priority (21-29) → Polish & cleanup  
**Future:** New features (30-36) → When core is stable



frontend/src/pages/
└── HomePage.jsx                 # Main homepage

frontend/src/components/homepage/css/
<!-- ├── hero.css                    # HeroSection styles -->
<!-- ├── quiz-preview.css           # QuizPreview styles   -->
<!-- ├── motivation.css             # MotivationSection styles -->
<!-- ├── modes.css                  # ModeShowcase styles -->
<!-- ├── features.css               # FeatureHighlights styles -->
<!-- ├── social-proof.css           # SocialProof styles -->
<!-- ├── cta.css                    # CTASection styles -->

frontend/src/components/homepage/
<!-- ├── HeroSection.jsx            # With imported hero.css -->
<!-- ├── QuizPreview.jsx           # With imported quiz-preview.css -->
<!-- ├── MotivationSection.jsx     # With imported motivation.css -->
<!-- ├── ModeShowcase.jsx          # With imported modes.css -->
<!-- ├── FeatureHighlights.jsx     # With imported features.css -->
<!-- ├── SocialProof.jsx           # With imported social-prood.css -->
<!-- ├── CTASection.jsx            # With imported cta.css -->
└── HomePage.jsx              # Imports all CSS files

frontend/src/styles/
├── globals.css               # Your existing CSS
└── homepage-overrides.css    # Additional homepage styles