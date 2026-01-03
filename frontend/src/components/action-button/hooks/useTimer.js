// src/components/action-button/hooks/useTimer.js
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing a countdown timer
 * @param {Object} options - Timer options
 * @param {number} options.initialDuration - Initial duration in seconds
 * @param {boolean} options.autoStart - Whether to start timer automatically
 * @param {Function} options.onComplete - Callback when timer completes
 * @param {Function} options.onTick - Callback on each tick (receives remaining seconds)
 * @param {Function} options.onWarning - Callback when entering warning states
 */
const useTimer = (options = {}) => {
    const {
        initialDuration = 30,
        autoStart = false,
        onComplete,
        onTick,
        onWarning,
        warningThreshold = 0.3, // 30% of time remaining
        criticalThreshold = 0.1, // 10% of time remaining
    } = options;

    const [duration, setDuration] = useState(initialDuration);
    const [timeLeft, setTimeLeft] = useState(initialDuration);
    const [isRunning, setIsRunning] = useState(autoStart);
    const [isPaused, setIsPaused] = useState(false);

    const intervalRef = useRef(null);
    const startTimeRef = useRef(null);
    const expectedEndTimeRef = useRef(null);

    // Calculate timer state
    const percentage = duration > 0 ? (timeLeft / duration) * 100 : 0;
    const isWarning = percentage <= warningThreshold * 100 && percentage > criticalThreshold * 100;
    const isCritical = percentage <= criticalThreshold * 100;
    const isComplete = timeLeft <= 0;

    // Format time as MM:SS
    const formatTime = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    const formattedTime = formatTime(timeLeft);

    // Start the timer
    const start = useCallback((newDuration) => {
        if (newDuration !== undefined) {
            setDuration(newDuration);
            setTimeLeft(newDuration);
        }

        startTimeRef.current = Date.now();
        expectedEndTimeRef.current = Date.now() + (newDuration ?? timeLeft) * 1000;
        setIsRunning(true);
        setIsPaused(false);
    }, [timeLeft]);

    // Pause the timer
    const pause = useCallback(() => {
        setIsPaused(true);
        setIsRunning(false);
    }, []);

    // Resume the timer
    const resume = useCallback(() => {
        if (timeLeft > 0) {
            startTimeRef.current = Date.now();
            expectedEndTimeRef.current = Date.now() + timeLeft * 1000;
            setIsRunning(true);
            setIsPaused(false);
        }
    }, [timeLeft]);

    // Stop and reset the timer
    const reset = useCallback((newDuration) => {
        const dur = newDuration ?? duration;
        setTimeLeft(dur);
        setIsRunning(false);
        setIsPaused(false);
        startTimeRef.current = null;
        expectedEndTimeRef.current = null;
    }, [duration]);

    // Stop without resetting
    const stop = useCallback(() => {
        setIsRunning(false);
        setIsPaused(false);
        startTimeRef.current = null;
        expectedEndTimeRef.current = null;
    }, []);

    // Add time to the timer
    const addTime = useCallback((seconds) => {
        setTimeLeft(prev => Math.max(0, prev + seconds));
        if (expectedEndTimeRef.current) {
            expectedEndTimeRef.current += seconds * 1000;
        }
    }, []);

    // Timer effect
    useEffect(() => {
        if (!isRunning || isPaused) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((expectedEndTimeRef.current - now) / 1000));

            setTimeLeft(remaining);
            onTick?.(remaining);

            // Check warning states
            const currentPercentage = duration > 0 ? remaining / duration : 0;
            if (currentPercentage <= criticalThreshold && currentPercentage > 0) {
                onWarning?.(remaining, 'critical');
            } else if (currentPercentage <= warningThreshold) {
                onWarning?.(remaining, 'warning');
            }

            if (remaining <= 0) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
                setIsRunning(false);
                onComplete?.();
            }
        }, 100); // Update more frequently for smoother display

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRunning, isPaused, duration, onComplete, onTick, onWarning, criticalThreshold, warningThreshold]);

    // Update duration when initialDuration changes
    useEffect(() => {
        if (!isRunning && !isPaused) {
            setDuration(initialDuration);
            setTimeLeft(initialDuration);
        }
    }, [initialDuration, isRunning, isPaused]);

    return {
        // State
        timeLeft,
        duration,
        isRunning,
        isPaused,
        isComplete,
        isWarning,
        isCritical,
        percentage,
        formattedTime,

        // Actions
        start,
        pause,
        resume,
        reset,
        stop,
        addTime,
        setDuration: (d) => {
            setDuration(d);
            if (!isRunning) setTimeLeft(d);
        },
    };
};

export default useTimer;
