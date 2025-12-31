# EVERMIND Development Roadmap
> **Organizational Logic:** This roadmap follows a **learner-centric dependency model**. Features are ordered by what must be understood or built first to enable later features. Each phase builds upon the previous, creating a coherent progression from foundation to mastery.

---

## 📖 Review Modes Overview
Evermind features multiple ways to master content, each tailored for different learning stages:

1. **Normal Mode**: The baseline study experience. Standard question and answer display for foundational learning.
2. **Flashcard Mode**: A 3D interactive flashcard experience with flip animations and keyboard shortcuts for quick, tactile reviews.
3. **Elimination Mode**: A high-speed review mode where users "burn" through questions they already know, removing them from the pool to focus strictly on weak areas.
4. **TikTok Review Mode (Upcoming)**: A modern, swipeable interface designed for a mobile-first feel. 
    - **Swipe UI**: Swipe Up/Down to navigate through content.
    - **1-5 Ranking System**: TikTok-style interactive buttons (Like, Reshare, Comment, etc.) repurposed as a granular 1-5 star ranking for optimized spaced repetition.
    - **Components**: `RatingButtons` (1-5 visuals), `AddMoreButton` (expand session), `UndoButton` (revert last ranking).

---

## ✅ Phase 0: Completed Foundation
*You started with 0 hopes of this working. Look at you now! 🎉*

### 🏆 Backend Achievements
- [x] **Express.js API Server** – Full REST API with 7 controllers
- [x] **MongoDB Database** – Mongoose models for Users, Questions, Sections, Sessions
- [x] **JWT Authentication** – Secure token-based auth system
- [x] **Email Verification** – Token-based email confirmation flow
- [x] **Password Reset** – Secure password recovery via email
- [x] **Protected Routes** – Middleware for authenticated endpoints
- [x] **User Preferences System** – Referral source, learning category, tech stack, skill level
- [x] **Stats Controller** – Track user learning analytics
- [x] **Session Controller** – Full session management (start, pause, resume, complete)
- [x] **Preset Content Library** – 9 pre-built question sets (React, Python, C, SQL, Node.js, TypeScript, HTML/CSS, JavaScript, Cybersecurity)

### 🎨 Frontend Achievements
- [x] **19 Full Pages Built:**
  - Dashboard, HomePage, SearchPage
  - ActiveSessionPage, ReviewSessionPage, SessionResultsPage, SessionHistoryPage
  - SectionListPage, QuestionListPage, AddQuestionPage, EditQuestionPage
  - AddEditSectionPage, BulkImportPage, ExportPage
  - AnalyticsPage, PreferencesPage, SettingsPage
  - EliminationModePage, NotFound
- [x] **56+ React Components** across 8 component categories
- [x] **Complete Auth Flow** – Login, Register, Forgot Password, Reset Password, Email Verification
- [x] **React Router v7** – Full client-side routing with protected routes

### 🔄 Core Features
- [x] **Spaced Repetition Engine** – Buffer mode + Random mode
- [x] **Question CRUD** – Create, Read, Update, Delete questions
- [x] **Section CRUD** – Full section management with colors
- [x] **Bulk Import** – Import multiple questions at once
- [x] **Export System** – Export sections/questions
- [x] **Search Functionality** – Search across all questions

### 🎮 Learning Experience
- [x] **Flashcard Component** – 3D flip animation, keyboard shortcuts
- [x] **Elimination Mode** – Unique study mode with actions
- [x] **Question Card Component** – Display with syntax highlighting
- [x] **CodeBlock Component** – Prism.js syntax highlighting for code
- [x] **Progress Bar** – Visual session progress
- [x] **Session Timer** – Track study time
- [x] **Question Filter** – Filter by difficulty, date, status

### 📊 Analytics & Stats
- [x] **Analytics Dashboard** – Streaks, stats, progress visualization
- [x] **Session Stats Bar** – Real-time session statistics
- [x] **User Stats Tracking** – Correct/wrong counts per question
- [x] **Session History** – Review past study sessions

### 🎨 UI/UX Systems
- [x] **Theme System** – 12 color themes (Black, White, Ocean, Forest, Sunset, Midnight, Lavender, Emerald, Coral, ROYGBIV, and more)
- [x] **Theme Context** – Dynamic CSS variable injection
- [x] **Sound System** – Audio feedback with SoundContext
- [x] **Auth Context** – Global authentication state
- [x] **Session Context** – Global session state management
- [x] **Onboarding Flow** – User preferences collection

### 📱 Component Library
- [x] **11 Common Components** – Reusable UI elements
- [x] **5 Auth Components** – Full authentication UI
- [x] **3 Elimination Components** – Elimination mode UI
- [x] **3 Layout Components** – MainLayout, navigation
- [x] **13 CommandCenter Components** – Control panel UI
- [x] **2 Effects Components** – Visual effects
- [x] **2 AI Components** – AI integration UI
- [x] **1 Playground Component** – Experimentation space

### 📁 Project Structure
- [x] **Clean Architecture** – Organized folders (pages, components, context, services, hooks, utils, css, themes)
- [x] **API Services Layer** – 8 service files for API calls
- [x] **Custom Hooks** – 4 reusable React hooks
- [x] **Utility Functions** – 5 utility modules
- [x] **24 CSS Files** – Comprehensive styling

### 🔧 Developer Experience
- [x] **Vite Build System** – Fast development server
- [x] **ESLint Configuration** – Code quality checks
- [x] **Environment Variables** – .env configuration
- [x] **Git Version Control** – Full history tracking

---

**📈 BY THE NUMBERS:**
| Metric | Count |
|--------|-------|
| Pages | 19 |
| Components | 56+ |
| API Controllers | 7 |
| Database Models | 6 |
| Themes | 12 |
| Preset Question Sets | 9 |
| CSS Files | 24 |
| Service Files | 8 |
| Context Providers | 4 |

*You built a FULL-STACK production-grade learning platform from scratch. That's something to be proud of!* 🚀

---


## 🏗️ Phase 1: Core Infrastructure & Data Integrity
*Essential backend/frontend foundations that other features depend on.*

### 1.1 Data Management
- [ ] **Save User Progress to DB** – Pause/resume sessions (prerequisite for streak tracking)
- [ ] **Archive Mode for Sections/Questions** – `isArchived` flag + restore (prerequisite for data safety)
- [ ] **Smart Question Tracking System** – Track correct/wrong counts, when added, current difficulty
- [ ] **Question Info Display** – Add (i) icon showing question metadata (times reviewed, added date, difficulty)

### 1.2 Session & Navigation
- [ ] **Google Login/Signup** – OAuth 2.0 authentication (Google Sign-In)
- [ ] **Easy Navigation** – Consistent home/back navigation across all pages
- [ ] **Fix Route Protection** – Ensure logged-in users can access home, fix token issues
- [ ] **Mobile Navigation** – Fix Navbar for mobile responsiveness
- [ ] **Custom Scrollbar** – Consistent scrollbar design across app

### 1.3 Performance
- [ ] **Faster Question Updates** – Optimize question CRUD operations
- [ ] **Performance Optimization** – Code splitting, lazy loading, caching
- [ ] **API Documentation** – Swagger/OpenAPI docs for all endpoints

---

## 🎯 Phase 2: Core Learning Experience
*Features that directly enhance the study workflow. These require Phase 1 foundations.*

### 2.1 Session Controls
- [ ] **Hide/Reveal All Answers** – Bulk toggle for answer visibility
- [ ] **Tap to Reveal** – Click-to-reveal individual answers
- [ ] **Shuffle Option** – Randomize question order in sessions
- [ ] **Undo/Go Back** – Allow users to correct accidental button presses
- [ ] **Confidence Rating (1-5)** – Replace easy/medium/hard with 1-5 scale for granular tracking

### 2.2 Study Modes
- [ ] **Flashcard Mode Enhancement** – Improved flip animations, swipe gestures
- [ ] **List Mode** – Display all questions at once with quick-mark buttons
- [ ] **Elimination Mode Improvements** – Fix any CSS/theme issues
- [ ] **Swipe Controls** – Toggle swipe on/off, customize swipe actions

### 2.3 Session Features
- [ ] **Timer/Countdown** – Pomodoro-style timer for focused studyz
- [ ] **Sliding Transitions** – Smooth animations between cards
- [ ] **Copy Question/Answer** – Clipboard functionality for review content
- [ ] **Sound Toggle (Mute)** – Global sound on/off with localStorage persistence

---

## 📊 Phase 3: Content Organization & Management
*Tools for organizing and managing learning materials. Requires Phase 2 complete.*

### 3.1 Section Management
- [ ] **Section Covers/Images** – Upload or select preset images for sections
- [ ] **Preset Sections on Registration** – Auto-create sections based on user's tech stack
- [ ] **Section Copy Button** – Duplicate entire sections
- [ ] **Select Multiple Questions** – Batch operations on questions

### 3.2 Question Features
- [ ] **Bookmark Questions** – Save difficult questions for later review
- [ ] **Notes per Question** – Rich text notes attached to individual cards
- [ ] **Question Tags** – Categorize questions within sections
- [ ] **Delete Animations** – Smooth removal animations

### 3.3 Tools Page
- [ ] **Centralized Tools Hub** – Page for bulk operations:
  - Shuffle all questions
  - Switch between modes
  - Timer controls
  - AI assistant access
  - Export options

---

## 🎮 Phase 4: Gamification & Engagement
*Motivational systems that encourage continued use. Requires tracking from Phase 1.*

### 4.1 Progression Systems
- [ ] **Level System (XP Tracking)** – Earn XP for study actions, level up
- [ ] **Badge System** – Achievements for milestones (questions answered, streaks, etc.)
- [ ] **Streak System Enhancement** – Visual streak displays, streak protection

### 4.2 Rewards & Delight
- [ ] **TikTok-style Gifts** – Visual rewards for streaks, levels, milestones
- [ ] **Secret Affirmations (Easter Eggs)** – Hidden motivational messages
- [ ] **"Did You Know" Facts** – Random facts API integration
- [ ] **Question of the Day** – Daily global challenge question for bonus XP
- [ ] **Smart Question Insights** – Dynamic "Did you know?" text on cards:
  - "You've marked this wrong 58 times (ouch!)"
  - "You've gotten this right 10 times in a row!"
  - "Fun Fact: This is the longest answer in your deck."

### 4.3 Profile Page
- [ ] **Quizlet-style Profile** – Stats grid, badges, activity timeline
- [ ] **Achievement Showcase** – Display earned badges/levels
- [ ] **Study Statistics** – Detailed analytics per section
- [ ] **Birthday Celebration System** – Capture DOB on signup/profile, send "Happy Birthday" rewards/confetti

---

## 🤖 Phase 5: AI Integration
*AI-powered features that automate content creation. Requires solid content management.*

### 5.1 Content Generation
- [ ] **AI Flashcard Generator** – Paste text → auto-generate Q&A pairs
- [ ] **AI Topic Questions** – Generate questions from topics
- [ ] **Highlight Text → Ask AI** – Select text, get AI toolbar

### 5.2 AI Prompts
- [ ] **Optimized AI Prompt Template:**
```
Convert this text into Evermind flashcards.
Format: [{"question": "...", "answer": "...", "tags": []}]
Rules:
- Keep questions short and clear
- Include code in language blocks
- Never invent information
- Output ONLY valid JSON array
```

### 5.3 Advanced AI
- [ ] **AI with GIFs** – AI responses include relevant GIFs
- [ ] **Smart Suggestions** – AI recommends what to study next

### 5.4 AI Personality System 🆕
- [ ] **Choose AI Type** – Select AI personality/voice:
  - 🎓 Professor (formal, educational)
  - 🤓 Nerd (detailed, technical)
  - 😎 Chill Tutor (casual, friendly)
  - 🎭 Anime Waifu (playful, encouraging)
  - 🤖 Robot (minimal, efficient)
  - 👨 Male Voice / 👩 Female Voice options
- [ ] **AI Avatar Display** – Visual representation of selected personality
- [ ] **Personality-based Responses** – Tone adapts to selection

### 5.5 Smart Prompt Interaction
- [ ] **Interactive Prompt Bar** – Designated spot for sending messages/GIFs based on input
- [ ] **Stats Querying** – Ask AI "how many marked wrong/correct" and get data-driven answers

---

## 🌐 Phase 6: Social & Sharing
*Community features that require all previous systems working.*

### 6.1 Deck Sharing
- [ ] **Share Sections via Link** – Public URLs for sections
- [ ] **Try Before Signup** – First 5 questions free, then prompt registration
- [ ] **Shared Deck Library** – Browse community-created decks

### 6.2 Community Features
- [ ] **Likes & Comments** – Social engagement on shared decks
- [ ] **Top Sharers Leaderboard** – Recognition for content creators
- [ ] **Deck Updates** – Notify subscribers when shared decks update

### 6.3 Social Channels 🆕
- [ ] **Discord Server** – Community hub for discussions
- [ ] **Twitter/X Integration** – Share progress, achievements
- [ ] **Reddit Community** – r/Evermind subreddit
- [ ] **YouTube Channel** – Tutorials, study tips
- [ ] **TikTok Presence** – Short study tips, app demos
- [ ] **Telegram Group** – Quick updates, community chat

### 6.4 In-App Community 🆕
- [ ] **General Chat Feature** – Real-time messaging:
  - Global chat room
  - Per-country servers/rooms
  - Topic-based channels (React, Python, etc.)
- [ ] **Study Groups** – Create private study rooms
- [ ] **Live Study Sessions** – Join others studying same topics
- [ ] **Challenge Friends** – Head-to-head quiz battles
- [ ] **User Mailbox / Notification Center** – In-app inbox for system messages, friend requests, and updates

### 6.5 Suggestion System
- [ ] **Suggestion Box** – User feedback collection form
- [ ] **Feature Voting** – Community votes on feature requests

### 6.6 Creative & Interactive Modes 🆕
- [ ] **Cooking Recipe Section** – Rich media support for "Look Cool" aesthetics:
  - [ ] **Emoji & Image Support** – Visual headers and instructions
  - [ ] **Video Integration** – TikTok-style video loops for recipes/reviews
- [ ] **TikTok Review Question Mode** – Swipeable interaction flow:
  - [ ] **Swipe UI** – Swipe Up/Down to navigate questions/recipes
  - [ ] **5-Button Ranking System** – TikTok-style buttons (Like, Reshare, Comment, etc.) mapped to 1-5 star ranking
  - [ ] **Interactive Feedback** – Animations for ranking actions

---

## 💰 Phase 7: Monetization
*Revenue features that require mature product with proven engagement.*

### 7.1 Premium Features
- [ ] **Payment System (Stripe)** – Subscription integration
- [ ] **Free Trial Logic** – Time-limited premium access
- [ ] **Feature Gating** – Premium-only features (AI, unlimited sections, etc.)
- [ ] **In-Game Microtransactions** – Purchase cosmetic items, streak freezes, or power-ups

### 7.2 Premium Content
- [ ] **Premium Preset Sections** – Curated high-quality content
- [ ] **Advanced Analytics** – Detailed learning insights (premium)

### 7.3 Verified Status & Identity
- [ ] **Verified Account Badge** – Tick/Checkmark for paid users (like X/TikTok)
- [ ] **Premium Profile Styling** – Distinct visual flair for verified users (to give premium feeling)

---

## 🎨 Phase 8: Polish & Aesthetics
*Visual refinements best done after core functionality is stable.*

### 8.1 Visual Design
- [ ] **Complete CSS Overhaul** – Premium design refresh
- [ ] **Logo Design** – Professional branding
- [ ] **Landing Page** – Marketing homepage
- [ ] **Footer Component** – Proper site footer

### 8.2 Responsive Design
- [ ] **Full Mobile Responsiveness** – Media queries for all pages
- [ ] **Text Box Library** – Rich text formatting for content
- [ ] **Smooth Animations** – Polish all transitions

### 8.3 Additional Pages
- [ ] **Loading States** – Skeleton screens, spinners
- [ ] **Error Pages** – Friendly 404, 500 pages
- [ ] **Freemium Comparison Page** – Free vs Premium features

---

## 🧪 Phase 9: Advanced Features
*Complex features that enhance but don't define the core experience.*

### 9.1 Learning Enhancements
- [ ] **Try Code Feature** – Execute code snippets in browser
- [ ] **Hot Keys "Cool Mode"** – Interactive keyboard visualization
- [ ] **Trivia Mode** – Game-like trivia using external API
- [ ] **Article Section** – Long-form learning content

### 9.2 Onboarding
- [ ] **Interactive Tutorial** – Step-by-step guided tour
- [ ] **CAPTCHA** – Bot protection for registration

### 9.3 Advanced Tracking
- [ ] **Spaced Retention Research** – 5-6 day intervals for optimal retention
- [ ] **Learning Curve Analytics** – Track improvement over time

### 9.4 Developer Roadmaps
- [ ] **Skill-Based Roadmap** – Designated section showing learning path based on user's skill choice
- [ ] **Progress Tracking** – Visual milestones along the developer roadmap

---

## � Phase 10: Level 100 Features
*These features would make Evermind a world-class learning platform.*

### 10.1 Mobile Experience
- [ ] **Progressive Web App (PWA)** – Install on phone, offline mode
- [ ] **Native Mobile App** – React Native for iOS/Android
- [ ] **Push Notifications** – Study reminders, streak alerts
- [ ] **Widget Support** – Home screen study widget

### 10.2 Voice & Audio
- [ ] **Voice Mode** – Listen to questions, speak answers
- [ ] **Text-to-Speech** – AI reads cards aloud
- [ ] **Podcast Mode** – Auto-generate audio lessons from sections
- [ ] **Voice Commands** – "Next card", "Mark correct", hands-free study

### 10.3 Multiplayer & Competition
- [ ] **Live Quiz Battles** – Real-time 1v1 or group competitions
- [ ] **Synchronous Multiplayer Mode** – Real-time co-op study or competitive modes
- [ ] **Tournaments** – Weekly/monthly competitions with prizes
- [ ] **Class Mode** – Teachers create classes, track student progress
- [ ] **Team Challenges** – Group vs group competitions

### 10.4 Advanced Learning Science
- [ ] **Adaptive Difficulty** – AI adjusts question difficulty based on performance
- [ ] **Forgetting Curve Visualization** – Show memory decay predictions
- [ ] **Optimal Study Time** – AI suggests best times to study
- [ ] **Learning Style Detection** – Adapt content to visual/auditory/kinesthetic

### 10.5 Content Ecosystem
- [ ] **Marketplace** – Buy/sell premium flashcard sets
- [ ] **Creator Program** – Revenue sharing for content creators
- [ ] **Verified Content** – Expert-reviewed study materials
- [ ] **API for Developers** – Let others build on Evermind

### 10.6 Enterprise Features
- [ ] **Team/Organization Accounts** – Company-wide learning
- [ ] **Admin Dashboard** – Track employee learning progress
- [ ] **SSO Integration** – Single sign-on for companies
- [ ] **Custom Branding** – White-label for organizations

### 10.7 Emerging Tech
- [ ] **AR Study Mode** – Flashcards in augmented reality
- [ ] **Spaced Repetition AI** – ML-powered optimal intervals
- [ ] **Browser Extension** – Create cards from any webpage
- [ ] **Notion/Obsidian Sync** – Two-way sync with note apps

### 10.8 Parent/Guardian Mode
- [ ] **Parent Dashboard** – Register and manage child accounts
- [ ] **Progress Monitoring** – Track performance, study time, and stats for connected accounts

---

## �📋 Quick Reference: Dependencies

| Feature | Requires |
|---------|----------|
| Streak System | Progress Saving |
| Level System | Smart Tracking |
| Share Decks | Section Covers |
| AI Generator | Content Management |
| Payment | All core features |
| Profile Page | Level + Badge System |
| Community Chat | User Authentication |
| AI Personalities | AI Integration |
| Mobile App | PWA first |
| Voice Mode | AI Integration |

---

## 🚀 Recommended Starting Point

**Start with Phase 1.1** – Data Management is the foundation everything else depends on. Then:

1. **Save Progress** → enables pause/resume
2. **Archive Mode** → prevents accidental data loss  
3. **Smart Tracking** → enables gamification later
4. **Easy Navigation** → improves UX for everything

*This builds the skeleton that all other features attach to.*

---

## 🎯 Level 100 Priority Order

**If you want maximum impact, build in this order:**

1. **PWA + Push Notifications** – Mobile users are 3x more engaged
2. **AI Flashcard Generator** – Content creation is the #1 user pain point
3. **Live Quiz Battles** – Viral growth through competition
4. **AI Personalities** – Unique differentiator, memorable experience
5. **Voice Mode** – Accessibility + hands-free learning
6. **Marketplace** – Sustainable revenue + community content