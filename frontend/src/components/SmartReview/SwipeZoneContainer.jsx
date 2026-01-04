import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useSound } from '../../hooks/useSound';

// Zone Configuration
// Zone Configuration with Deadzone (0-0.1 is safe)
const ZONES = [
    { id: 1, label: 'HARD', color: '#EF4444', min: 0.1, max: 0.25 },
    { id: 2, label: 'MEDIUM', color: '#F59E0B', min: 0.25, max: 0.45 },
    { id: 3, label: 'GOOD', color: '#3B82F6', min: 0.45, max: 0.65 },
    { id: 4, label: 'EASY', color: '#10B981', min: 0.65, max: 0.85 },
    { id: 5, label: 'VERY EASY', color: '#06B6D4', min: 0.85, max: 1.5 }
];

const SwipeZoneContainer = ({
    children,
    onRate,
    disabled = false,
    swipeThreshold = 300 // Max distance for 100%
}) => {
    const x = useMotionValue(0);
    const containerRef = useRef(null);
    const { playSound } = useSound();

    // Calculate generic progress (0 to 1) based on absolute distance
    const progress = useTransform(x, (currentX) => {
        return Math.min(Math.abs(currentX) / swipeThreshold, 1.1);
    });

    // Rotation - Disabled as per user request "i dont want the card to move"
    // const rotate = useTransform(x, [-swipeThreshold, swipeThreshold], [-10, 10]);

    const handlePan = (_, info) => {
        if (!disabled) {
            x.set(info.offset.x);
        }
    };

    const handlePanEnd = (_, info) => {
        if (disabled) return;

        const dragDistance = Math.abs(x.get());
        const pct = dragDistance / swipeThreshold;

        // Reset position instantly or smoothly
        animate(x, 0, { type: "spring", stiffness: 400, damping: 25 });

        // Check if validated rating
        if (pct < 0.1) {
            return;
        }

        // Determine rating based on percentage
        // Adjusted zones to account for 0.1 deadzone
        let rating = 1;
        if (pct >= 0.8) rating = 5;
        else if (pct >= 0.6) rating = 4;
        else if (pct >= 0.4) rating = 3;
        else if (pct >= 0.2) rating = 2; // Covers 0.2 to 0.4

        if (onRate) {
            // Play sound based on rating
            if (rating >= 3) {
                playSound('correct');
            } else {
                playSound('wrong');
            }

            // Call onRate
            onRate(rating);
        }
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', touchAction: 'pan-y' }}>
            {/* 
                We use onPan on the wrapper to detecting "swipes" anywhere on the card
                without physically moving the card with CSS transforms.
             */}
            <motion.div
                style={{
                    // x, // Removed to keep card static
                    // rotate, // Removed
                    touchAction: 'pan-y', // Allow vertical scrolling, capture horizontal? 
                    // 'pan-y' means browser handles vertical, we handle horizontal? 
                    // Actually 'pan-y' allows vertical scroll, but we want to capture horizontal.
                    // Framer motion onPan by default captures all? 
                    // Better to use touch-action: pan-y so vertical scroll still works.
                    cursor: disabled ? 'default' : 'grab',
                    position: 'relative',
                    zIndex: 10,
                    // overflow: 'hidden', // Ensure overlay stays within card border
                    // Actually, if we want it to "spill over" but "only the question card", 
                    // it usually means it matches the card border radius.
                    // Assuming children has border radius, we should probably match it or let children handle.
                    // But if we put overlay ON TOP, it needs radius.
                    borderRadius: '16px', // Assumed standard radius
                    overflow: 'hidden' // Clip overlay to card shape
                }}
                onPan={handlePan}
                onPanEnd={handlePanEnd}
                whileTap={{ cursor: disabled ? 'default' : 'grabbing' }}
            >
                {children}

                {/* Overlays */}
                {ZONES.map((zone) => (
                    <ZoneOverlay
                        key={zone.id}
                        zone={zone}
                        progress={progress}
                    />
                ))}

            </motion.div>
        </div>
    );
};

// Sub-component for individual zone overlays to encapsulate transform logic
const ZoneOverlay = ({ zone, progress }) => {
    // Opacity logic:
    // Visible ONLY when progress is within [min, max]
    // We add small overlap or transition windows if needed, but intended logic is strict zones.
    // Using a small input range around the transition points to avoid flickering.

    const opacity = useTransform(progress, (p) => {
        return (p >= zone.min && p < zone.max) ? 0.5 : 0;
    });

    // Scale effect for the text
    const scale = useTransform(progress, (p) => {
        return (p >= zone.min && p < zone.max) ? 1 : 0.8;
    });

    return (
        <motion.div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: zone.color,
                opacity, // Bound to motion value
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                pointerEvents: 'none',
                backdropFilter: 'blur(2px)' // Optional, might be heavy on mobile
            }}
        >
            <motion.div style={{ scale, textAlign: 'center', color: 'white' }}>
                <div style={{ fontSize: '3rem', fontWeight: '900', textShadow: '0 4px 12px rgba(0,0,0,0.3)', letterSpacing: '2px' }}>
                    {zone.label}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '600', marginTop: '10px', textTransform: 'uppercase', opacity: 0.9 }}>
                    Release to Rate
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SwipeZoneContainer;
