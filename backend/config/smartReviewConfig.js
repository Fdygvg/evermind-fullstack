export const SMART_REVIEW_CONFIG = {
  // ============ DAILY LIMITS ============
  // Only applies to REVIEW track (Priority 1-5)
  // NEW (Priority 0) and PENDING are UNLIMITED
  REVIEW_LIMIT_PERCENTAGE: 0.5, // 50% of review questions per section
  
  // ============ SECTION ADVANCEMENT ============
  // Section advances to next virtual day when this threshold is met
  ADVANCEMENT_THRESHOLD: 0.8, // 80% completion
  
  // ============ RATING INTERVALS (SESSIONS) ============
  // Fixed intervals for simple spaced repetition
  // These are VIRTUAL SESSIONS, not calendar days
  RATING_INTERVALS: {
    1: 0,   // Hard - Stays in current session (reinserts after 5 questions)
    2: 1,   // Medium - Next session
    3: 3,   // Good - 3 sessions later
    4: 7,   // Easy - 7 sessions later (1 week worth)
    5: 14   // Perfect - 14 sessions later (2 weeks worth)
  },
  
  // ============ SCHEDULING ============
  // Random offset to prevent question clumping
  RANDOM_OFFSET_PERCENTAGE: 0.2, // ±20% variance on due dates
  
  // ============ PRIORITY SYSTEM ============
  // Priority tracks (for future reference)
  PRIORITY: {
    NEW: 0,       // New/unreviewed questions - UNLIMITED
    URGENT: 1,    // Highest priority review
    HIGH: 2,      // High priority review
    MEDIUM: 3,    // Medium priority review
    LOW: 4,       // Low priority review
    MASTERED: 5   // Mastered questions
  },
  
  // ============ EASE FACTOR (for future v2 adaptive algorithm) ============
  DEFAULT_EASE_FACTOR: 2.5,
  MIN_EASE_FACTOR: 1.3,
  MAX_EASE_FACTOR: 3.5,
  EASE_ADJUSTMENT: 0.1,  // Adjustment per rating
  
  // ============ BACKLOG HANDLING ============
  // Bonus multiplier for missed days (optional feature)
  BACKLOG_MULTIPLIER_INCREMENT: 0.1, // +10% per missed day
  MAX_BACKLOG_MULTIPLIER: 0.5        // Max +50%
};

export default SMART_REVIEW_CONFIG;

