import { sessionService } from './sessions';

const STORAGE_KEY = 'evermind_session_progress';

/**
 * Session Persistence Service
 * Saves/loads/syncs Review All session state to localStorage
 * for resilience against refreshes and offline scenarios.
 */
export const sessionPersistence = {
    /**
     * Save current session state snapshot to localStorage.
     * Called after every rating for instant persistence.
     */
    saveToLocal(sessionState) {
        try {
            const snapshot = {
                sessionId: sessionState.sessionId,
                sectionIds: sessionState.sectionIds,
                currentIndex: sessionState.currentIndex,
                reviewedToday: sessionState.reviewedToday,
                initialQuestionCount: sessionState.initialQuestionCount,
                todaysQuestions: (sessionState.todaysQuestions || []).map(q =>
                    typeof q === 'string' ? q : q._id
                ),
                ratingHistory: (sessionState.ratingHistory || []).map(r => ({
                    questionId: r.questionId,
                    rating: r.rating
                })),
                mode: sessionState.mode || 'normal',
                cardMode: sessionState.cardMode || 'normal',
                savedAt: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
        } catch (error) {
            console.warn('[SessionPersistence] Failed to save to localStorage:', error);
        }
    },

    /**
     * Load saved session state from localStorage.
     * Returns null if nothing saved or data is stale (>24h).
     */
    loadFromLocal() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;

            const snapshot = JSON.parse(raw);

            // Discard if older than 24 hours
            if (snapshot.savedAt && Date.now() - snapshot.savedAt > 24 * 60 * 60 * 1000) {
                this.clearLocal();
                return null;
            }

            return snapshot;
        } catch (error) {
            console.warn('[SessionPersistence] Failed to load from localStorage:', error);
            return null;
        }
    },

    /**
     * Clear saved session state from localStorage.
     * Called on session end/complete.
     */
    clearLocal() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.warn('[SessionPersistence] Failed to clear localStorage:', error);
        }
    },

    /**
     * Attempt to sync localStorage snapshot to the backend.
     * On success, clears the local snapshot.
     * Returns true if synced, false if nothing to sync or failed.
     */
    async syncToBackend() {
        const snapshot = this.loadFromLocal();
        if (!snapshot) return false;

        try {
            const smartReviewState = {
                currentIndex: snapshot.currentIndex,
                reviewedToday: snapshot.reviewedToday,
                todaysQuestions: snapshot.todaysQuestions,
                ratingHistory: snapshot.ratingHistory,
                sectionIds: snapshot.sectionIds,
                initialQuestionCount: snapshot.initialQuestionCount,
                mode: snapshot.mode,
                cardMode: snapshot.cardMode
            };

            await sessionService.updateProgress({
                sectionIds: snapshot.sectionIds,
                currentIndex: snapshot.currentIndex,
                answeredQuestionIds: snapshot.ratingHistory.map(r => r.questionId),
                status: 'active',
                smartReviewState,
                sessionId: snapshot.sessionId || undefined
            });

            console.log('[SessionPersistence] Synced local progress to backend');
            // Don't clear local — keep it as backup until next explicit save
            return true;
        } catch (error) {
            console.error('[SessionPersistence] Failed to sync to backend:', error);
            return false;
        }
    },

    /**
     * Check if a saved snapshot matches the given session.
     */
    matchesSession(sessionId, sectionIds) {
        const snapshot = this.loadFromLocal();
        if (!snapshot) return false;

        // Match by sessionId if available
        if (snapshot.sessionId && sessionId) {
            return snapshot.sessionId === sessionId;
        }

        // Fallback: match by sectionIds
        if (snapshot.sectionIds && sectionIds) {
            const savedSorted = [...snapshot.sectionIds].sort().join(',');
            const currentSorted = [...sectionIds].sort().join(',');
            return savedSorted === currentSorted;
        }

        return false;
    }
};
