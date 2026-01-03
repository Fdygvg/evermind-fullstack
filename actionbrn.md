src/
└── components/
    └── action-button/
        ├── components/           # UI building blocks
        │   ├── FabSpeedDial.jsx  # Main floating action button container
        │   │                    # - Manages open/closed state
        │   │                    # - Renders FabItems in speed-dial layout
        │   │                    # - Handles click events and animations
        │   │                    # - Connects to TimerContext
        │   │
        │   ├── FabItem.jsx      # Individual speed-dial menu item
        │   │                    # - Clickable button with icon + label
        │   │                    # - Accepts onClick handler
        │   │                    # - Handles its own hover/focus states
        │   │
        │   ├── TimerDisplay.jsx # Top-right live countdown component
        │   │                    # - Shows time remaining visually
        │   │                    # - Changes color when low time
        │   │                    # - May show current default mark
        │   │
        │   ├── TimerSetupModal.jsx # Timer configuration popup
        │   │                    # - Duration picker (slider/buttons)
        │   │                    # - Default mark selector (1-5)
        │   │                    # - Save/cancel buttons
        │   │
        │   └── shared/          # UI components ONLY used within action-button
        │       ├── Modal.jsx    # Reusable modal wrapper
        │       │               # - Backdrop, centered content
        │       │               # - Escape key close, click outside close
        │       │
        │       ├── Button.jsx   # Styled button component
        │       │               # - Variants: primary, secondary, icon-only
        │       │               # - Loading states, disabled states
        │       │
        │       └── icons/       # SVG icon components
        │           ├── TimerIcon.jsx    # Timer icon for menu
        │           ├── ShuffleIcon.jsx  # Shuffle icon
        │           ├── ThemeIcon.jsx    # Palette/theme icon
        │           └── index.js         # Barrel exports
        │
        ├── hooks/               # Feature-specific React hooks
        │   ├── useFabAnimation.js # Manages speed-dial animations
        │   │                    # - Staggered item entrance/exit
        │   │                    # - CSS transition coordination
        │   │                    # - Returns animation classes/timing
        │   │
        │   ├── useTimer.js      # Core timer countdown logic
        │   │                    # - Start/pause/reset timer
        │   │                    # - Auto-mark on expiration
        │   │                    # - Sync with server time
        │   │                    # - Handles browser tab visibility
        │   │
        │   └── useClickOutside.js # Detect clicks outside element
        │                         # - Close menu when clicking elsewhere
        │                         # - Escape key support
        │                         # - Mobile touch support
        │
        ├── services/            # Pure business logic (no React)
        │   ├── timerStrategies.js # Mode-specific timer behavior
        │   │                    # - normalModeTimer() - per question reset
        │   │                    # - eliminationModeTimer() - sequential list
        │   │                    # - tiktokModeTimer() - video-specific logic
        │   │
        │   ├── fabConfig.js     # Menu item configuration per mode
        │   │                    # - Defines which items show in each mode
        │   │                    # - Icons, labels, action types
        │   │                    # - Disabled states based on context
        │   │
        │   └── constants.js     # Magic numbers and strings
        │                       # - DEFAULT_DURATIONS
        │                       # - ANIMATION_DELAYS
        │                       # - LOCAL_STORAGE_KEYS
        │
        ├── contexts/            # React Context for state sharing
        │   └── TimerContext.jsx # Global timer state provider
        │                       # - Timer active/inactive
        │                       # - Current time left
        │                       # - Default mark setting
        │                       # - Mode-specific configuration
        │
        ├── utils/               # Generic helper functions
        │   ├── animations.js    # CSS animation utilities
        │   │                   # - generateStaggerDelays()
        │   │                   # - springPresets()
        │   │                   # - reduceMotionSafe()
        │   │
        │   └── dom.js          # DOM manipulation helpers
        │                       # - focusTrap()
        │                       # - getScrollbarWidth()
        │                       # - isTouchDevice()
        │
        └── index.js            # Public API export
                              # - Export all public components
                              # - Export useful hooks
                              # - Clean interface for consumers



                              # **Complete 0→100% Plan for Action Button Feature**

## **Phase 1: Foundation & Core FAB (Days 1-2)**
```
✅ STEP 1: Folder structure (already defined)
✅ STEP 2: CSS variables integration plan
   - All components use --color-* variables
   - Respect prefers-reduced-motion
   
STEP 3: Build basic UI components
   - shared/Modal.jsx (using CSS variables)
   - shared/Button.jsx (using CSS variables)
   - shared/icons/*.jsx (SVG icons)
   
STEP 4: Create FabSpeedDial container
   - Open/close state
   - Basic positioning (bottom-right)
   - Click handlers
   
STEP 5: Create FabItem component
   - Icon + label
   - Hover/active states
   
STEP 6: Basic animations
   - useFabAnimation.js hook
   - Staggered entrance
   - CSS transitions
```

## **Phase 2: Timer Feature Core (Days 2-3)**
```
STEP 7: TimerSetupModal component
   - Duration picker (slider/buttons)
   - Default mark selector (1-5 radio)
   - Save to localStorage
   
STEP 8: TimerDisplay component
   - Top-right positioned
   - Countdown display (MM:SS)
   - Color changes (warning/critical)
   
STEP 9: useTimer.js hook
   - Countdown logic (setInterval)
   - Browser tab visibility handling
   - Basic start/pause/reset
   
STEP 10: Connect FAB → Timer
   - Add Timer to fabConfig.js
   - Click opens modal, saves config
   - TimerDisplay appears when active
```

## **Phase 3: Timer Logic & Mode Integration (Days 3-4)**
```
STEP 11: You explain mode specifics
   - Normal mode flow
   - Flashcard mode flow  
   - Elimination mode (all questions visible)
   - TikTok mode flow
   
STEP 12: Build timerStrategies.js
   - Per-mode timer behavior
   - Normal: reset per question
   - Elimination: sequential top-down
   - etc.
   
STEP 13: Auto-mark integration
   - On timer end → auto rate with default mark
   - Call existing review API
   - Move to next question
   
STEP 14: Manual mark handling
   - Detect when user rates question
   - Reset timer immediately
   - Move to next question (or next in elimination)
```

## **Phase 4: Polish & Edge Cases (Days 4-5)**
```
STEP 15: Click outside to close
   - useClickOutside.js hook
   - Escape key support
   
STEP 16: Responsive design
   - Mobile touch targets
   - Tablet layouts
   - Small screen adaptations
   
STEP 17: Accessibility
   - ARIA labels
   - Keyboard navigation
   - Screen reader announcements
   - Focus trapping in modals
   
STEP 18: Error handling & loading states
   - API error fallbacks
   - Loading spinners
   - Retry logic
```

## **Phase 5: Additional Features (Days 5-7)**
```
STEP 19: Theme switcher
   - Add theme icon to FAB
   - Cycle through themes.roygbiv etc.
   - Update CSS variables in real-time
   
STEP 20: Shuffle feature
   - Add shuffle icon
   - Integrate with existing shuffle logic
   
STEP 21: Notes feature
   - Notes modal
   - Save/load per question
   
STEP 22: AI hints feature
   - AI icon
   - Integration with AI service
   
STEP 23: Performance optimization
   - Memoization
   - Animation performance
   - Bundle size checks
```

## **Phase 6: Testing & Deployment (Days 7-8)**
```
STEP 24: Unit tests
   - timerStrategies.js
   - hooks (useTimer, useFabAnimation)
   
STEP 25: Integration tests
   - FAB open/close
   - Timer flow
   - Mode switching
   
STEP 26: User testing
   - Gather feedback
   - Fix UX issues
   
STEP 27: Documentation
   - Component README
   - Usage examples
   
STEP 28: Deployment
   - Merge to main
   - Monitor for issues
```

## **Critical Dependencies & Order**
1. **CSS variables must be available globally** before Phase 1
2. **Mode explanations needed** before Phase 3 (timerStrategies)
3. **Existing review API endpoints** needed for auto-mark (Phase 3)
4. **Theme system integration** (Phase 5) requires your themes.js

## **Risk Mitigation**
- **Timer accuracy**: Use performance.now() for drift correction
- **State persistence**: localStorage + periodic sync to backend
- **Mobile gestures**: Disable FAB during swipe gestures
- **Browser support**: Test on iOS Safari (timer throttling)
- **Backward compatibility**: Graceful degradation if CSS variables missing

## **Deliverables After Each Phase**
- **Phase 1**: Working FAB with menu (no real actions)
- **Phase 2**: Timer that counts down (no mode logic)
- **Phase 3**: Timer works correctly in all review modes
- **Phase 4**: Polished, accessible, responsive
- **Phase 5**: All menu features complete
- **Phase 6**: Tested, documented, deployed

---

**Does this plan work for you?** Should I adjust any phases or timelines?

**Next immediate action:** Start Phase 1, Step 3 (shared/Modal.jsx) using your CSS variables?