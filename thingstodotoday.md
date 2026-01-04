TODAY'S PRIORITY MATRIX
🔴 CRITICAL + HARD (Do First)
High importance, high difficulty - Tackle these when energy is highest

1. Performance - "Too Slow in All Sections" ⏰ 3-4 hours
Why critical: Affects ALL users, EVERY session. Performance is UX foundation.

Audit API response times (add logging)

Implement React.memo() on heavy components

Virtualize elimination mode list if >50 questions

Lazy load images/code blocks

Cache question data in localStorage

2. Clean Up Normal Card + Smart Review Swipe ⏰ 3-4 hours
Why critical: Core feature broken. Normal mode is primary review method.

Replace binary swipe (right/left) with 5-zone swipe

Integrate with existing CompactRatingBar logic

Maintain backward compatibility during migration

Update swipe visual feedback for 1-5 ratings

🟠 IMPORTANT + MEDIUM (Do Second)
High importance, manageable difficulty

3. Elimination Mode - Jump Prevention ⏰ 2-3 hours
Why important: Major UX pain point you specifically called out.

Implement smooth exit animations (transform/opacity)

Maintain scroll position using refs

Batch DOM updates to prevent reflows

Add visual indicator of "next question" target

4. Add Notes to FAB ⏰ 2-3 hours
Why important: Feature completeness. Users expect annotation.

Create NotesModal with markdown support

Backend API for note storage

Search within notes

Question-note association

5. Pause Functionality + Styling ⏰ 1-2 hours
Why important: Timer usability. Users need breaks.

Add pause/resume to TimerDisplay

Visual pause state (dimmed, icon change)

Keyboard shortcut (Spacebar)

Persist pause state

🟡 USEFUL + EASY (Do Third)
Lower importance but quick wins

6. Full View Mode in FAB ⏰ 1 hour
Simple toggle between compact/full layouts

Store preference in localStorage

7. Bookmark Questions ⏰ 1-2 hours
Bookmark icon on cards

Filter by bookmarked

Backend bookmark storage

8. Add CSS Animations ⏰ 1 hour
Micro-interactions for buttons

Loading skeletons

Page transitions

⚫ DEFER (Not Today)
Important but not urgent, or too large for today

9. Progress Stats System-Wide ⏰ 4-6 hours
Reason to defer: Major feature requiring analytics design, data modeling, visualization.

10. New Mobile Homepage ⏰ 3-4 hours
Reason to defer: Full redesign. Can use responsive improvements instead.

11. Move Questions Between Sections ⏰ 2-3 hours
Reason to defer: Lower frequency use case. Can use export/import as interim.