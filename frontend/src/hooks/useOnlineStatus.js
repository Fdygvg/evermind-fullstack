import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect online/offline status.
 * Returns { isOnline, wasOffline } where wasOffline briefly flips
 * true when transitioning from offline → online (used to trigger sync).
 */
export const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [wasOffline, setWasOffline] = useState(false);

    const handleOnline = useCallback(() => {
        console.log('[useOnlineStatus] Back online');
        setIsOnline(true);
        setWasOffline(true);

        // Reset wasOffline after a short delay so consumers can react once
        setTimeout(() => setWasOffline(false), 5000);
    }, []);

    const handleOffline = useCallback(() => {
        console.log('[useOnlineStatus] Gone offline');
        setIsOnline(false);
    }, []);

    useEffect(() => {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [handleOnline, handleOffline]);

    return { isOnline, wasOffline };
};
