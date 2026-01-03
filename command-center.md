/src/
├── components/
│   └── CommandCenter/                  # EVERYTHING HERE
│       ├── CommandCenterButton.jsx     # Draggable launcher
│       ├── CommandCenterDropdown.jsx   # Features menu
│       ├── CommandCenterProvider.jsx   # Context provider
│       │
│       ├── config/                     # Configs
│       │   ├── command-center.config.js
│       │   ├── timer.config.js
│       │   ├── widget.config.js
│       │   └── review-modes.config.js
│       │
│       ├── core/                       # Business logic
│       │   ├── TimerEngine.js
│       │   ├── FeatureRegistry.js
│       │   └── event-bus.js
│       │
│       ├── hooks/                      # Hooks
│       │   ├── useTimer.js
│       │   ├── useWidgets.js
│       │   └── useCommandCenter.js
│       │
│       ├── widgets/                    # Widget system
│       │   ├── WidgetPortal.jsx
│       │   ├── DraggableWidget.jsx
│       │   ├── TimerWidget.jsx
│       │   └── WidgetManager.jsx
│       │
│       ├── modals/                     # Modals
│       │   ├── TimerConfigModal.jsx
│       │   └── BaseModal.jsx
│       │
│       └── utils/                      # Utilities
│           ├── drag-utils.js
│           └── storage.js
│
├── review-modes/                       # Your existing (unchanged)
│   └── ...
│
└── App.jsx



EVERMIND Command Center - Implementation Roadmap
PHASE 1: FOUNDATION (Week 1)
Goal: Basic structure and core timer logic

Day 1-2: Core Business Logic

TimerEngine.js - Pure JS timer with start/pause/reset/timeout

timer.config.js - Timer defaults, durations, auto-score options

FeatureRegistry.js - Basic feature definitions (timer only)

Day 3: React Integration Layer

useTimer.js - React hook that wraps TimerEngine

event-bus.js - Simple event system for cross-component comms

Day 4: Widget System Foundation

WidgetManager.jsx - Zustand store for widget state

DraggableWidget.jsx - Base draggable container component

WidgetPortal.jsx - Portal to render widgets at root level

Day 5: First Widget Implementation

TimerWidget.jsx - Timer display with controls

Integration test in a simple page

PHASE 2: COMMAND CENTER UI (Week 2)
Goal: Launch interface and configuration

Day 6: Command Center Launcher

CommandCenterButton.jsx - Draggable launch button

storage.js - Save/load positions from localStorage

drag-utils.js - Dragging helpers with boundaries

Day 7: Feature Menu

CommandCenterDropdown.jsx - Reads from FeatureRegistry

command-center.config.js - Button appearance/behavior config

useCommandCenter.js - State management hook

Day 8: Configuration Modal

BaseModal.jsx - Reusable modal component

TimerConfigModal.jsx - Timer settings form

Connect: Button → Dropdown → Modal → TimerWidget creation

Day 9: Polish & Integration

widget.config.js - Widget appearance/behavior

CommandCenterProvider.jsx - Context provider

Styling and theme integration

PHASE 3: REVIEW MODE INTEGRATION (Week 3)
Goal: Make timer work across all review modes

Day 10: Sequential Mode Adapter

Update TimerEngine for continuous mode

Integrate useTimer into FlashcardMode.jsx

Test: Auto-reset on question change

Day 11: Batch Mode Adapter

Update TimerEngine for per-question mode

review-modes.config.js - Mode-specific behaviors

Integrate into BatchMode.jsx

Test: Timer activates on "reveal answer"

Day 12: TikTok Mode Integration

Integrate into TikTokMode.jsx

Test: Swipe interactions with timer

Ensure timer works with vertical swipe UI

Day 13: Cross-Mode Communication

Timer state sync across modes

Handle mode switching mid-session

Persist timer settings across sessions

PHASE 4: ENHANCEMENTS (Week 4)
Goal: Polish, performance, and additional features

Day 14: Auto-Score Business Logic

Connect timer timeout to smart review scoring (1-5)

Implement "mark as 1 if no answer" logic

Test with real review sessions

Day 15: Performance & Edge Cases

Memory leak prevention

Offline/online state handling

Error boundaries and recovery

Day 16: Additional Features (Start)

Add "Shuffle" to FeatureRegistry (instant type)

Add "Theme Switcher" (modal type)

Expand dropdown menu

Day 17-20: Testing & Polish

Unit tests for TimerEngine

Integration tests for each review mode

UX polish, animations, sound effects

Documentation for team

CRITICAL MILESTONES:
Milestone 1 (Day 5): TimerWidget works standalone
Milestone 2 (Day 9): Command Center launches TimerWidget
Milestone 3 (Day 13): Timer works in all review modes
Milestone 4 (Day 20): Production-ready with 3+ features

IMPLEMENTATION PROTOCOL:
For each step, I will:

Show the file structure for that step

Write clean, commented code

Explain the integration points

Highlight potential issues

Provide testing instructions

NEXT STEP:
We start with PHASE 1, Day 1:

TimerEngine.js - Core timer logic

timer.config.js - Default configurations