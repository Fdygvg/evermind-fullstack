import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
    FaBrain, FaSync, FaCrosshairs, FaMobileAlt, FaInfinity, FaRobot,
    FaSignInAlt, FaUserPlus, FaChartLine, FaFire, FaTrophy, FaBolt,
    FaMagic, FaWater, FaPalette, FaClock, FaEye, FaHistory, FaShare,
    FaDatabase, FaRocket, FaChevronRight, FaUsers, FaPlay, FaCog,
    FaCompass, FaStar, FaGem, FaGraduationCap, FaCode, FaMousePointer
} from 'react-icons/fa';


const Homepage = () => {
    // Theme from your CSS variables
    const theme = useMemo(() => ({
        primary: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#ff0000',
        secondary: getComputedStyle(document.documentElement).getPropertyValue('--color-secondary').trim() || '#ff7f00',
        accent: getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() || '#ffff00',
        background: getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim() || '#00ff00',
        surface: getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim() || '#0000ff',
        text: getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim() || '#4b0082',
        textSecondary: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim() || '#9400d3',
        border: getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() || '#8b00ff',
        gradientStart: getComputedStyle(document.documentElement).getPropertyValue('--color-gradient-start').trim() || '#ff0000',
        gradientEnd: getComputedStyle(document.documentElement).getPropertyValue('--color-gradient-end').trim() || '#9400d3',
    }), []);

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // State
    const [activeMode, setActiveMode] = useState(null);
    const [flipCard, setFlipCard] = useState(false);
    const [particles, setParticles] = useState([]);
    const [neuralActive, setNeuralActive] = useState(false);
    const [pulseIntensity, setPulseIntensity] = useState(1);
    const [rainbowMode, setRainbowMode] = useState(false);
    const [visualization, setVisualization] = useState('particles');
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [interactionCount, setInteractionCount] = useState(0);
    const [achievements, setAchievements] = useState([]);
    const [showSecret, setShowSecret] = useState(false);
    const [matrixMode, setMatrixMode] = useState(false);
    const [timeWarp, setTimeWarp] = useState(false);

    const containerRef = useRef(null);
    const brainRef = useRef(null);
    const audioContextRef = useRef(null);
    const animationRef = useRef(null);

    // Mock data
    const userStats = {
        streak: 42,
        cardsReviewed: 9999,
        retentionRate: 96,
        timeSpent: 888,
        level: 99,
        xp: 999999,
        rank: 'Grandmaster',
        brainPower: 100,
        memoryCapacity: 'Infinite',
        learningSpeed: 'Lightspeed'
    };

    const modes = [
        { id: 'normal', name: 'NEURAL REVIEW', icon: FaBrain, color: theme.primary, due: 42, description: 'Swipe-based intelligent repetition' },
        { id: 'flashcard', name: 'QUANTUM FLIP', icon: FaSync, color: theme.secondary, due: 24, description: 'Holographic card transitions' },
        { id: 'elimination', name: 'CHAOS CLEAR', icon: FaCrosshairs, color: theme.accent, due: 18, description: 'Eradicate questions systematically' },
        { id: 'tiktok', name: 'HYPERSCROLL', icon: FaMobileAlt, color: theme.textSecondary, due: 12, description: 'Vertical vortex learning' },
        { id: 'custom', name: 'VOID MODE', icon: FaInfinity, color: theme.border, due: 0, description: 'Create your own reality' },
        { id: 'ai', name: 'SYNTHETIC MIND', icon: FaRobot, color: theme.gradientEnd, due: 999, description: 'AI-powered adaptive learning' }
    ];

    const demoCards = [
        { front: "QUANTUM MEMORY THEORY", back: "Information exists in superposition until observed through recall.", difficulty: 5 },
        { front: "NEUROPLASTICITY FACTOR", back: "Brain rewires itself based on recall frequency and emotional weight.", difficulty: 4 },
        { front: "SPACED REPETITION ALGORITHM", back: "Optimal intervals = f(confidence, complexity, previous_success).", difficulty: 3 },
        { front: "COGNITIVE LOAD OPTIMIZATION", back: "Chunk information into quantum packets for maximum absorption.", difficulty: 5 },
        { front: "MNEMONIC DIMENSIONALITY", back: "Memory strength increases exponentially with associative layers.", difficulty: 4 }
    ];

    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [cardHistory, setCardHistory] = useState([]);
    const [neuralConnections, setNeuralConnections] = useState([]);
    const [energyLevel, setEnergyLevel] = useState(100);
    const [isCharging, setIsCharging] = useState(false);

    // Initialize particles
    useEffect(() => {
        const initParticles = () => {
            const newParticles = [];
            const colors = [theme.primary, theme.secondary, theme.accent, theme.textSecondary, theme.border];

            for (let i = 0; i < 200; i++) {
                newParticles.push({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    size: Math.random() * 8 + 2,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    speed: Math.random() * 3 + 0.5,
                    direction: Math.random() * Math.PI * 2,
                    life: Math.random() * 100,
                    pulse: Math.random() * 2,
                    connection: null,
                    charge: Math.random() > 0.7
                });
            }

            setParticles(newParticles);
        };

        initParticles();
    }, [theme]);

    // Neural connections
    useEffect(() => {
        if (neuralActive) {
            const connections = [];
            for (let i = 0; i < 50; i++) {
                connections.push({
                    id: i,
                    from: { x: Math.random() * 100, y: Math.random() * 100 },
                    to: { x: Math.random() * 100, y: Math.random() * 100 },
                    strength: Math.random(),
                    active: Math.random() > 0.5,
                    color: Math.random() > 0.5 ? theme.primary : theme.accent
                });
            }
            setNeuralConnections(connections);
        }
    }, [neuralActive, theme]);

    // Main animation loop
    useEffect(() => {
        const animate = () => {
            setParticles(prev => prev.map(p => {
                const speed = timeWarp ? p.speed * 3 : p.speed;
                const newX = (p.x + Math.cos(p.direction) * speed) % 100;
                const newY = (p.y + Math.sin(p.direction) * speed) % 100;
                const newLife = (p.life + 0.5) % 100;
                const newPulse = (p.pulse + 0.05) % (Math.PI * 2);

                // Occasionally change direction
                const newDirection = Math.random() > 0.99 ?
                    Math.random() * Math.PI * 2 : p.direction + (Math.random() - 0.5) * 0.1;

                return {
                    ...p,
                    x: newX < 0 ? 100 + newX : newX,
                    y: newY < 0 ? 100 + newY : newY,
                    life: newLife,
                    pulse: newPulse,
                    direction: newDirection,
                    size: p.size + Math.sin(newPulse) * 0.5
                };
            }));

            setNeuralConnections(prev => prev.map(c => ({
                ...c,
                strength: (c.strength + 0.01) % 1,
                active: Math.sin(Date.now() / 1000 + c.id) > 0
            })));

            if (pulseIntensity > 1) {
                setPulseIntensity(prev => prev * 0.95);
            }

            if (isCharging && energyLevel < 200) {
                setEnergyLevel(prev => prev + 1);
            } else if (!isCharging && energyLevel > 0) {
                setEnergyLevel(prev => Math.max(0, prev - 0.1));
            }
        };

        let intervalId;
        let frameId;

        const loop = () => {
            animate();
            frameId = requestAnimationFrame(loop);
        };

        frameId = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(frameId);
            if (intervalId) clearInterval(intervalId);
        };
    }, [timeWarp, isCharging]);

    // Interaction handlers
    const handleBrainClick = () => {
        setNeuralActive(!neuralActive);
        setPulseIntensity(3);
        setInteractionCount(prev => prev + 1);

        if (interactionCount >= 10 && !achievements.includes('brain_explorer')) {
            setAchievements(prev => [...prev, 'brain_explorer']);
        }

        if (Math.random() > 0.95) {
            setShowSecret(true);
            setTimeout(() => setShowSecret(false), 3000);
        }
    };

    const handleCardFlip = () => {
        setFlipCard(!flipCard);
        setCardHistory(prev => [...prev, { card: currentCardIndex, time: Date.now(), flipped: !flipCard }]);
        setInteractionCount(prev => prev + 1);
    };

    const handleNextCard = () => {
        setFlipCard(false);
        const nextIndex = (currentCardIndex + 1) % demoCards.length;
        setCurrentCardIndex(nextIndex);

        if (nextIndex === 0 && !achievements.includes('card_master')) {
            setAchievements(prev => [...prev, 'card_master']);
        }
    };

    const handleModeSelect = (modeId) => {
        setActiveMode(modeId);
        setPulseIntensity(2);

        if (modeId === 'custom' && !achievements.includes('reality_bender')) {
            setAchievements(prev => [...prev, 'reality_bender']);
        }

        if (modeId === 'ai') {
            setMatrixMode(true);
            setTimeout(() => setMatrixMode(false), 5000);
        }
    };

    const handleCharge = () => {
        setIsCharging(true);
        setTimeout(() => setIsCharging(false), 2000);

        if (energyLevel >= 150 && !achievements.includes('overcharged')) {
            setAchievements(prev => [...prev, 'overcharged']);
        }
    };

    const handleRainbowToggle = () => {
        setRainbowMode(!rainbowMode);
        if (!rainbowMode && !achievements.includes('rainbow_warrior')) {
            setAchievements(prev => [...prev, 'rainbow_warrior']);
        }
    };

    const handleVisualizationChange = (vis) => {
        setVisualization(vis);
        setPulseIntensity(1.5);
    };

    const handleTimeWarp = () => {
        setTimeWarp(!timeWarp);
        if (!timeWarp && !achievements.includes('time_lord')) {
            setAchievements(prev => [...prev, 'time_lord']);
        }
    };

    // Generate dynamic styles based on theme and state
    const dynamicStyles = {
        heroGradient: rainbowMode
            ? `linear-gradient(45deg, ${theme.primary}, ${theme.secondary}, ${theme.accent}, ${theme.textSecondary}, ${theme.border}, ${theme.gradientEnd})`
            : `linear-gradient(135deg, ${theme.gradientStart}, ${theme.gradientEnd})`,

        cardGlow: flipCard
            ? `0 0 60px ${theme.accent}, 0 0 100px ${theme.primary}`
            : `0 0 20px ${theme.primary}, 0 0 40px ${theme.secondary}`,

        pulseGlow: `0 0 ${pulseIntensity * 50}px ${theme.primary}, 0 0 ${pulseIntensity * 100}px ${theme.accent}`,

        energyBar: `linear-gradient(90deg, ${theme.primary} ${energyLevel / 2}%, ${theme.accent} ${energyLevel}%, transparent ${energyLevel + 10}%)`
    };

    return (
        <div
            className={`homepage-container ${matrixMode ? 'matrix-mode' : ''} ${rainbowMode ? 'rainbow-mode' : ''}`}
            ref={containerRef}
            style={{
                '--theme-primary': theme.primary,
                '--theme-secondary': theme.secondary,
                '--theme-accent': theme.accent,
                '--theme-background': theme.background,
                '--theme-surface': theme.surface,
                '--theme-text': theme.text,
                '--theme-text-secondary': theme.textSecondary,
                '--theme-border': theme.border,
                '--theme-gradient': dynamicStyles.heroGradient,
            }}
        >
            {/* Neural Network Overlay */}
            {neuralActive && (
                <div className="neural-overlay">
                    {neuralConnections.map(conn => (
                        <div
                            key={conn.id}
                            className="neural-connection"
                            style={{
                                left: `${conn.from.x}%`,
                                top: `${conn.from.y}%`,
                                width: `${Math.sqrt(Math.pow(conn.to.x - conn.from.x, 2) + Math.pow(conn.to.y - conn.from.y, 2))}%`,
                                transform: `rotate(${Math.atan2(conn.to.y - conn.from.y, conn.to.x - conn.from.x)}rad)`,
                                opacity: conn.active ? conn.strength : 0.1,
                                backgroundColor: conn.color
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Particle System */}
            <div className="particles-container">
                {particles.map(p => (
                    <div
                        key={p.id}
                        className={`particle ${p.charge ? 'charged' : ''}`}
                        style={{
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            backgroundColor: p.color,
                            opacity: p.life / 100,
                            transform: `scale(${1 + Math.sin(p.pulse) * 0.3})`,
                            filter: p.charge ? `drop-shadow(0 0 10px ${theme.accent})` : 'none'
                        }}
                    />
                ))}
            </div>

            {/* Auth Bar - Simple */}
            <div className="auth-bar">
                <div className="auth-left">
                    <FaBrain className="logo-icon" />
                    <span className="app-name">EVERMIND</span>
                    <span className="app-tag">∞</span>
                </div>
                <div className="auth-right">
                    {user ? (
                        <>
                            <Link to="/dashboard" className="dashboard-btn">
                                <FaChartLine /> DASHBOARD
                            </Link>
                            <button className="logout-btn" onClick={logout}>
                                LOGOUT
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="login-btn">
                                <FaSignInAlt /> LOGIN
                            </Link>
                            <Link to="/register" className="register-btn">
                                <FaUserPlus /> REGISTER
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Hero Section - Massive */}
            <section className="hero-section" style={{ background: dynamicStyles.heroGradient }}>
                <div className="hero-content">
                    <div
                        className="brain-container"
                        onClick={handleBrainClick}
                        ref={brainRef}
                        style={{ filter: `drop-shadow(${dynamicStyles.pulseGlow})` }}
                    >
                        <div className="brain-pulse" style={{ transform: `scale(${pulseIntensity})` }} />
                        <FaBrain className="brain-icon" />
                        <div className="brain-orbits">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="brain-orbit" style={{ animationDelay: `${i * 0.5}s` }}>
                                    <div className="orbit-particle" style={{ backgroundColor: theme.accent }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <h1 className="hero-title">
                        <span className="title-gradient">QUANTUM</span>
                        <span className="title-stroke">MEMORY</span>
                        <span className="title-accent">SYSTEM</span>
                    </h1>

                    <p className="hero-subtitle">
                        Where spaced repetition meets <span className="highlight">neural plasticity</span> and <span className="highlight">infinite scalability</span>
                    </p>

                    <div className="hero-stats">
                        <div className="stat-burst">
                            <FaFire />
                            <span>{userStats.streak} DAY STREAK</span>
                        </div>
                        <div className="stat-burst">
                            <FaTrophy />
                            <span>LEVEL {userStats.level}</span>
                        </div>
                        <div className="stat-burst">
                            <FaBrain />
                            <span>{userStats.brainPower}% BRAIN POWER</span>
                        </div>
                    </div>
                </div>

                {/* Energy System */}
                <div className="energy-system">
                    <div className="energy-bar" style={{ background: dynamicStyles.energyBar }}>
                        <div className="energy-level">{Math.round(energyLevel)}%</div>
                    </div>
                    <button
                        className={`charge-btn ${isCharging ? 'charging' : ''}`}
                        onClick={handleCharge}
                    >
                        <FaBolt /> {isCharging ? 'CHARGING...' : 'CHARGE'}
                    </button>
                </div>
            </section>

            {/* Interactive Card System */}
            <section className="card-system">
                <div className="mobile-section-header">
                    <h2>NEURAL FLASH CARD SIMULATOR</h2>
                    <div className="section-controls">
                        <button onClick={() => handleVisualizationChange('particles')}>
                            <FaMagic /> PARTICLES
                        </button>
                        <button onClick={() => handleVisualizationChange('waves')}>
                            <FaWater /> WAVES
                        </button>
                        <button onClick={handleRainbowToggle}>
                            <FaPalette /> {rainbowMode ? 'RAINBOW ON' : 'RAINBOW OFF'}
                        </button>
                        <button onClick={handleTimeWarp}>
                            <FaClock /> {timeWarp ? 'TIME WARP ON' : 'TIME WARP'}
                        </button>
                    </div>
                </div>

                <div className="card-simulator">
                    <div
                        className={`quantum-card ${flipCard ? 'flipped' : ''} ${visualization}`}
                        onClick={handleCardFlip}
                        style={{
                            boxShadow: dynamicStyles.cardGlow,
                            borderColor: flipCard ? theme.accent : theme.primary
                        }}
                    >
                        <div className="card-inner">
                            <div className="card-front">
                                <div className="card-header">
                                    <span className="card-difficulty">
                                        {'★'.repeat(demoCards[currentCardIndex].difficulty)}
                                    </span>
                                    <span className="card-id">#QUANTUM-{(currentCardIndex + 1).toString().padStart(3, '0')}</span>
                                </div>
                                <div className="card-content">
                                    <h3>{demoCards[currentCardIndex].front}</h3>
                                    <div className="card-hint">
                                        <FaEye /> TAP TO REVEAL NEURAL PATTERN
                                    </div>
                                </div>
                                <div className="card-footer">
                                    <span className="card-stats">
                                        <FaHistory /> {cardHistory.length} FLIPS
                                    </span>
                                </div>
                            </div>

                            <div className="card-back">
                                <div className="card-header">
                                    <span className="card-revelation">NEURAL REVELATION</span>
                                    <span className="card-energy">⚡ {Math.round(energyLevel)}</span>
                                </div>
                                <div className="card-content">
                                    <h3>{demoCards[currentCardIndex].back}</h3>
                                    <div className="card-rating-system">
                                        {[1, 2, 3, 4, 5].map(rating => (
                                            <button
                                                key={rating}
                                                className="rating-orb"
                                                style={{
                                                    backgroundColor: rating <= 3 ? theme.primary : theme.accent,
                                                    transform: `scale(${1 + Math.sin(Date.now() / 1000 + rating) * 0.2})`
                                                }}
                                            >
                                                {rating}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="card-actions">
                                    <button className="card-action-btn">
                                        <FaShare /> TRANSMIT
                                    </button>
                                    <button className="card-action-btn">
                                        <FaDatabase /> STORE
                                    </button>
                                    <button className="card-action-btn">
                                        <FaRocket /> LAUNCH
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-controls">
                        <button className="control-btn massive" onClick={handleNextCard}>
                            <FaChevronRight /> NEXT DIMENSION
                        </button>
                        <div className="card-progress">
                            <div className="progress-track">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${((currentCardIndex + 1) / demoCards.length) * 100}%` }}
                                />
                            </div>
                            <span className="progress-text">
                                CARD {currentCardIndex + 1} OF {demoCards.length}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mode Grid - Expanded */}
            <section className="modes-grid-section">
                <h2 className="mobile-section-title">SELECT NEURAL INTERFACE</h2>
                <div className="modes-grid">
                    {modes.map(mode => {
                        const Icon = mode.icon;
                        return (
                            <div
                                key={mode.id}
                                className={`mode-card ${activeMode === mode.id ? 'active' : ''} ${mode.due === 0 ? 'void' : ''}`}
                                onClick={() => handleModeSelect(mode.id)}
                                style={{
                                    borderColor: mode.color,
                                    background: activeMode === mode.id
                                        ? `linear-gradient(135deg, ${mode.color}20, transparent)`
                                        : undefined
                                }}
                            >
                                <div className="mode-glow" style={{ backgroundColor: mode.color }} />
                                <div className="mode-icon-container">
                                    <Icon style={{ color: mode.color, filter: 'drop-shadow(0 0 10px currentColor)' }} />
                                    {mode.due > 0 && (
                                        <div className="mode-badge" style={{ backgroundColor: mode.color }}>
                                            {mode.due}
                                        </div>
                                    )}
                                </div>
                                <h3>{mode.name}</h3>
                                <p>{mode.description}</p>
                                <div className="mode-stats">
                                    <span className="stat">
                                        <FaBolt /> {Math.floor(Math.random() * 100)} ENERGY
                                    </span>
                                    <span className="stat">
                                        <FaUsers /> {Math.floor(Math.random() * 1000)} ACTIVE
                                    </span>
                                </div>
                                <div className="mode-actions">
                                    <button className="mode-action-btn">
                                        <FaPlay /> ACTIVATE
                                    </button>
                                    <button className="mode-action-btn">
                                        <FaCog /> CONFIGURE
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Achievement System */}
            <section className="achievement-system">
                <h2>NEURAL ACHIEVEMENTS</h2>
                <div className="achievements-grid">
                    {[
                        { id: 'brain_explorer', name: 'BRAIN EXPLORER', icon: FaCompass, color: theme.primary },
                        { id: 'card_master', name: 'CARD MASTER', icon: FaStar, color: theme.accent },
                        { id: 'reality_bender', name: 'REALITY BENDER', icon: FaInfinity, color: theme.border },
                        { id: 'rainbow_warrior', name: 'RAINBOW WARRIOR', icon: FaPalette, color: theme.textSecondary },
                        { id: 'time_lord', name: 'TIME LORD', icon: FaClock, color: theme.gradientEnd },
                        { id: 'overcharged', name: 'OVERCHARGED', icon: FaBolt, color: theme.primary },
                    ].map(ach => (
                        <div
                            key={ach.id}
                            className={`achievement ${achievements.includes(ach.id) ? 'unlocked' : 'locked'}`}
                            style={{ borderColor: ach.color }}
                        >
                            <ach.icon style={{ color: achievements.includes(ach.id) ? ach.color : '#666' }} />
                            <span>{ach.name}</span>
                            <div className="achievement-status">
                                {achievements.includes(ach.id) ? '✓ UNLOCKED' : '🔒 LOCKED'}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Secret Easter Egg */}
            {showSecret && (
                <div className="secret-reveal">
                    <div className="secret-content">
                        <FaGem />
                        <h3>SECRET UNLOCKED</h3>
                        <p>You've discovered the quantum layer of Evermind</p>
                        <button onClick={() => setShowSecret(false)}>DISMISS</button>
                    </div>
                </div>
            )}

            {/* Footer CTA */}
            <footer className="footer-cta">
                <div className="cta-content">
                    <h2>READY FOR NEURAL UPGRADE?</h2>
                    <p>Join the cognitive revolution. Your brain will thank you.</p>
                    <div className="cta-buttons">
                        <Link to={user ? "/dashboard" : "/login"} className="cta-btn primary massive">
                            <FaRocket /> LAUNCH EVERMIND
                        </Link>
                        <button className="cta-btn secondary">
                            <FaGraduationCap /> TOUR SYSTEM
                        </button>
                        <button className="cta-btn tertiary">
                            <FaCode /> DEV CONSOLE
                        </button>
                    </div>
                </div>
            </footer>

            {/* Interaction Counter */}
            <div className="interaction-counter">
                <FaMousePointer />
                <span>INTERACTIONS: {interactionCount}</span>
            </div>
        </div>
    );
};

export default Homepage;