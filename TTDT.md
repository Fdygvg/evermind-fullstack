<!-- Fix registration error and account setup page -->

Fix that issue in normal mode (undefined)

HomePage && DashboardPage
<!-- Fix overlapping in navbar on mobile -->

<!-- Fix searchbar on mobile + media query -->

<!-- Remove that outer layer 😢 (layout issue) -->

<!-- Elimination mode to take full screen width -->

<!-- Fix HTML files (validation/errors) -->

Add shuffle and change theme to FAB

Ability to select and move questions between sections

<!-- Smart review navigation bar -->

<!-- Tablet page for TikTok mode -->

<!-- Work on progress stats system-wide -->

Add per session review modes tracking

<!-- Apply UX principles learned today -->

<!-- Elimination/Flashcard mode (IDEA) -->

Pause button (another day)




frontend/src/components/common/
├── Navbar.jsx                  # Logo + Profile/Login buttons
├── Footer.jsx                  # Standard footer
└── ProfileDropdown.jsx         # Dropdown menu for profile

frontend/src/components/homepage/
├── HeroSection.jsx             # Headline + QuizPreview
├── QuizPreview.jsx             # Live trivia demo
├── MotivationSection.jsx       # Why spaced repetition works
├── ModeShowcase.jsx            # 4 modes with icons
├── FeatureHighlights.jsx       # Smart rating, priority, limits
├── CTASection.jsx              # Signup/Get started
└── SocialProof.jsx             # Stats/testimonials

frontend/src/components/profile/     # New
├── ProfilePage.jsx             # Main profile page
├── ProfileHeader.jsx           # Avatar + basic info
├── AccountInfo.jsx             # Email, username, etc.
└── PreferencesCard.jsx         # Settings (non-functional)
















 IMPLEMENTATION PLAN: EVERMIND UI GLOW-UP
📅 PHASE 1: FOUNDATION (Day 1)
Setup & Core Components
bash
# 1. Install Tailwind + shadcn
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
npx shadcn-ui@latest init

# 2. Install shadcn components
npx shadcn-ui@latest add avatar button dropdown-menu
npx shadcn-ui@latest add card badge progress separator
Files to Create:
Navbar.jsx ✅ (START HERE)

ProfileDropdown.jsx

Footer.jsx

Update globals.css with Tailwind

📅 PHASE 2: HOMEPAGE (Day 2-3)
HomePage.jsx Structure:
jsx
<HomePage>
  <Navbar />
  <HeroSection />        # With QuizPreview
  <MotivationSection />  # Why spaced repetition
  <ModeShowcase />       # 4 modes visualization
  <FeatureHighlights />  # Smart rating, priority, limits
  <SocialProof />        # Stats/testimonials
  <CTASection />         # Signup/Login
  <Footer />
</HomePage>
Components Order:
HeroSection.jsx + QuizPreview.jsx

MotivationSection.jsx

ModeShowcase.jsx

FeatureHighlights.jsx

CTASection.jsx

SocialProof.jsx

📅 PHASE 3: PROFILE (Day 4)
Placeholder Profile System:
ProfilePage.jsx (Route: /profile)

ProfileHeader.jsx

AccountInfo.jsx (Static data)

PreferencesCard.jsx (Non-functional toggles)

📅 PHASE 4: DASHBOARD UPGRADE (Day 5-7)
Transform Your Dashboard:
Stats Grid → Visual cards with icons/trends

Session Resume → Enhanced progress visualization

Sections List → Interactive cards with hover

Navigation → Clean button group

Search Bar → Styled with Tailwind

🎨 DESIGN SYSTEM:
Colors:
Primary: #3b82f6 (Blue - Focus/Learning)

Secondary: #8b5cf6 (Purple - Creativity/TikTok mode)

Success: #10b981 (Green - Mastery)

Warning: #f59e0b (Orange - Streaks/Energy)

Background: #f8fafc (Light gray)

Font: Inter (Google Fonts)
Spacing: 4px base unit
🚀 PRIORITY ORDER:
Navbar with auth states (Today)

Homepage hero with trivia demo (Today)

Footer (Today)

Remaining homepage sections (Tomorrow)

Profile page placeholder (Day 3)

Dashboard upgrade (Day 4-5)

🎯 SUCCESS METRICS:
✅ Navbar shows correct auth state

✅ Homepage loads in <3s

✅ Mobile responsive

✅ QuizPreview works (trivia API)

✅ Profile page accessible

✅ Dashboard maintains all functionality