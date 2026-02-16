import React, { useRef, useMemo } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useSound } from '../../hooks/useSound';

// Zone Configuration with Deadzone (0-0.1 is safe)
const ZONES_FULL = [
    { id: 1, label: 'HARD', color: '#EF4444', min: 0.1, max: 0.25 },
    { id: 2, label: 'MEDIUM', color: '#F59E0B', min: 0.25, max: 0.45 },
    { id: 3, label: 'GOOD', color: '#3B82F6', min: 0.45, max: 0.65 },
    { id: 4, label: 'EASY', color: '#10B981', min: 0.65, max: 0.85 },
    { id: 5, label: 'VERY EASY', color: '#06B6D4', min: 0.85, max: 1.5 }
];

// Simplified zones: only Hard and Easy, split at 50%
const ZONES_SIMPLIFIED = [
    { id: 1, label: 'HARD', color: '#EF4444', min: 0.1, max: 0.5 },
    { id: 4, label: 'EASY', color: '#10B981', min: 0.5, max: 1.5 }
];

const SwipeZoneContainer = ({
    children,
    onRate,
    disabled = false,
    swipeThreshold = 300, // Max distance for 100%
    isSimplified = false
}) => {
    const x = useMotionValue(0);
    const containerRef = useRef(null);
    const { playSound } = useSound();

    const zones = useMemo(() => isSimplified ? ZONES_SIMPLIFIED : ZONES_FULL, [isSimplified]);

    // Calculate generic progress (0 to 1) based on absolute distance
    const progress = useTransform(x, (currentX) => {
        return Math.min(Math.abs(currentX) / swipeThreshold, 1.1);
    });

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

        let rating;
        if (isSimplified) {
            // Simplified: first half = Hard (1), second half = Easy (4)
            rating = pct >= 0.5 ? 4 : 1;
        } else {
            // Full: 5-zone rating
            rating = 1;
            if (pct >= 0.8) rating = 5;
            else if (pct >= 0.6) rating = 4;
            else if (pct >= 0.4) rating = 3;
            else if (pct >= 0.2) rating = 2;
        }

        if (onRate) {
            if (rating >= 3) {
                playSound('correct');
            } else {
                playSound('wrong');
            }
            onRate(rating);
        }
    };

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', touchAction: 'pan-y' }}>
            <motion.div
                style={{
                    touchAction: 'pan-y',
                    cursor: disabled ? 'default' : 'grab',
                    position: 'relative',
                    zIndex: 10,
                    borderRadius: '16px',
                    overflow: 'hidden'
                }}
                onPan={handlePan}
                onPanEnd={handlePanEnd}
                whileTap={{ cursor: disabled ? 'default' : 'grabbing' }}
            >
                {children}

                {/* Overlays */}
                {zones.map((zone) => (
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
    const opacity = useTransform(progress, (p) => {
        return (p >= zone.min && p < zone.max) ? 0.5 : 0;
    });

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
                opacity,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 20,
                pointerEvents: 'none',
                backdropFilter: 'blur(2px)'
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
