// / ==================== SWIPE GESTURES FUNCTIONALITY ====================
let swipeState = {
    startX: 0,
    startY: 0,
    startTime: 0,
    isDragging: false,
    ghostElement: null,
    debounceTimer: null
};

// Swipe sensitivity thresholds - improved for better UX
const SWIPE_THRESHOLDS = {
    horizontal: 60, // pixels - increased for better sensitivity
    vertical: 80,   // pixels - increased for better sensitivity
    velocity: 0.15, // pixels per millisecond - reduced for easier triggering
    angle: 30       // degrees - increased angle tolerance
};

// Debounce delay
const SWIPE_DEBOUNCE = 150; // milliseconds

// Mobile device detection
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Helper function to check if touch is in the central swipe zone (top 50% height, middle 40% width)
function isTouchInTopHalf(touch) {
    const questionCard = document.getElementById('questionCard');
    if (!questionCard) return false;
    
    const rect = questionCard.getBoundingClientRect();
    const cardHeight = rect.height;
    const cardWidth = rect.width;
    const cardTop = rect.top;
    const cardLeft = rect.left;
    
    // Calculate the central swipe zone boundaries
    // Top 50% of card height, middle 40% width (30% removed from each edge)
    const swipeAreaHeight = cardHeight * 0.5; // Top 50% of card height
    const cardMiddle = cardTop + swipeAreaHeight;
    const leftBoundary = cardLeft + (cardWidth * 0.3); // Remove 30% from left
    const rightBoundary = cardLeft + (cardWidth * 0.7); // Remove 30% from right (keep middle 40%)
    
    // Check if touch is within the central swipe zone
    return touch.clientY >= cardTop && touch.clientY <= cardMiddle && 
           touch.clientX >= leftBoundary && touch.clientX <= rightBoundary;
}

// Helper function to check if mouse click is in the central swipe zone (top 50% height, middle 40% width)
function isMouseInTopHalf(mouseEvent) {
    const questionCard = document.getElementById('questionCard');
    if (!questionCard) return false;
    
    const rect = questionCard.getBoundingClientRect();
    const cardHeight = rect.height;
    const cardWidth = rect.width;
    const cardTop = rect.top;
    const cardLeft = rect.left;
    
    // Calculate the central swipe zone boundaries
    // Top 50% of card height, middle 40% width (30% removed from each edge)
    const swipeAreaHeight = cardHeight * 0.5; // Top 50% of card height
    const cardMiddle = cardTop + swipeAreaHeight;
    const leftBoundary = cardLeft + (cardWidth * 0.3); // Remove 30% from left
    const rightBoundary = cardLeft + (cardWidth * 0.7); // Remove 30% from right (keep middle 40%)
    
    // Check if mouse click is within the central swipe zone
    return mouseEvent.clientY >= cardTop && mouseEvent.clientY <= cardMiddle && 
           mouseEvent.clientX >= leftBoundary && mouseEvent.clientX <= rightBoundary;
}

function initSwipeGestures() {
    const questionCard = document.getElementById('questionCard');
    if (!questionCard) return;
    
    console.log('📱 Initializing swipe gestures...');
    console.log('📱 Mobile device detected:', isMobileDevice());
    console.log('📱 User agent:', navigator.userAgent);
    
    // Add touch event listeners
    questionCard.addEventListener('touchstart', handleTouchStart, { passive: false });
    questionCard.addEventListener('touchmove', handleTouchMove, { passive: false });
    questionCard.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Add mouse event listeners for desktop testing
    questionCard.addEventListener('mousedown', handleMouseDown);
    questionCard.addEventListener('mousemove', handleMouseMove);
    questionCard.addEventListener('mouseup', handleMouseUp);
    questionCard.addEventListener('mouseleave', handleMouseUp);
    
    // Add keyboard event listeners
    document.addEventListener('keydown', handleKeyboardSwipe);
    
    // Hide swipe hint after first interaction
    hideSwipeHintAfterDelay();
    
    console.log('✅ Swipe gestures initialized successfully');
}

// Hide swipe hint after a delay or first interaction
function hideSwipeHintAfterDelay() {
    const questionCard = document.getElementById('questionCard');
    if (!questionCard) return;
    
    // Hide hint after 5 seconds
    setTimeout(() => {
        const hint = questionCard.querySelector('.swipe-hint');
        if (hint) {
            hint.style.opacity = '0';
        }
    }, 5000);
    
    // Hide hint immediately when user starts swiping
    const hideHintOnSwipe = () => {
        const hint = questionCard.querySelector('.swipe-hint');
        if (hint) {
            hint.style.opacity = '0';
        }
        // Remove event listeners after hiding
        questionCard.removeEventListener('touchstart', hideHintOnSwipe);
        questionCard.removeEventListener('mousedown', hideHintOnSwipe);
    };
    
    questionCard.addEventListener('touchstart', hideHintOnSwipe);
    questionCard.addEventListener('mousedown', hideHintOnSwipe);
}

function handleTouchStart(e) {
    const touch = e.touches[0];
    
    console.log('📱 Touch start detected:', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        isInTopHalf: isTouchInTopHalf(touch)
    });
    
    // Check if touch is in the top 50% of the question card
    if (!isTouchInTopHalf(touch)) {
        console.log('📱 Touch outside swipe area - ignoring');
        return; // Ignore touches in bottom half
    }
    
    console.log('📱 Touch in swipe area - starting swipe detection');
    swipeState.startX = touch.clientX;
    swipeState.startY = touch.clientY;
    swipeState.startTime = Date.now();
    swipeState.isDragging = true;
    
    // Prevent default to avoid scrolling
    e.preventDefault();
}

function handleTouchMove(e) {
    if (!swipeState.isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const deltaY = touch.clientY - swipeState.startY;
    
    console.log('📱 Touch move:', { deltaX, deltaY });
    
    // Show ghost preview
    showSwipeGhost(deltaX, deltaY);
    
    // Prevent default to avoid scrolling
    e.preventDefault();
}

function handleTouchEnd(e) {
    if (!swipeState.isDragging) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const deltaY = touch.clientY - swipeState.startY;
    const deltaTime = Date.now() - swipeState.startTime;
    
    console.log('📱 Touch end:', { deltaX, deltaY, deltaTime });
    
    processSwipe(deltaX, deltaY, deltaTime);
    
    // Clean up
    swipeState.isDragging = false;
    hideSwipeGhost();
    
    e.preventDefault();
}

function handleMouseDown(e) {
    // Check if mouse click is in the top 50% of the question card
    if (!isMouseInTopHalf(e)) {
        return; // Ignore clicks in bottom half
    }
    
    swipeState.startX = e.clientX;
    swipeState.startY = e.clientY;
    swipeState.startTime = Date.now();
    swipeState.isDragging = true;
    
    e.preventDefault();
}

function handleMouseMove(e) {
    if (!swipeState.isDragging) return;
    
    const deltaX = e.clientX - swipeState.startX;
    const deltaY = e.clientY - swipeState.startY;
    
    showSwipeGhost(deltaX, deltaY);
}

function handleMouseUp(e) {
    if (!swipeState.isDragging) return;
    
    const deltaX = e.clientX - swipeState.startX;
    const deltaY = e.clientY - swipeState.startY;
    const deltaTime = Date.now() - swipeState.startTime;
    
    processSwipe(deltaX, deltaY, deltaTime);
    
    // Clean up
    swipeState.isDragging = false;
    hideSwipeGhost();
}

function handleKeyboardSwipe(e) {
    // Only handle keyboard swipes in revision mode
    if (document.getElementById('revisionMode').style.display === 'none') return;
    
    let action = null;
    
    switch(e.key) {
        case 'ArrowLeft':
            action = 'wrong';
            break;
        case 'ArrowRight':
            action = 'correct';
            break;
        case 'ArrowDown':
            action = 'skip';
            break;
        default:
            return;
    }
    
    e.preventDefault();
    executeSwipeAction(action);
}

function processSwipe(deltaX, deltaY, deltaTime) {
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;
    const angle = Math.atan2(Math.abs(deltaY), Math.abs(deltaX)) * (180 / Math.PI);
    
    console.log('🔄 Processing swipe:', { deltaX, deltaY, distance, velocity, angle });
    
    // More lenient swipe detection
    const isHorizontalSwipe = Math.abs(deltaX) > SWIPE_THRESHOLDS.horizontal && 
                             Math.abs(deltaY) < SWIPE_THRESHOLDS.vertical * 1.5 && // More lenient vertical tolerance
                             angle < SWIPE_THRESHOLDS.angle;
    
    const isVerticalSwipe = Math.abs(deltaY) > SWIPE_THRESHOLDS.vertical && 
                           Math.abs(deltaX) < SWIPE_THRESHOLDS.horizontal * 1.5 && // More lenient horizontal tolerance
                           angle > (90 - SWIPE_THRESHOLDS.angle);
    
    const hasEnoughVelocity = velocity > SWIPE_THRESHOLDS.velocity;
    
    console.log('📊 Swipe analysis:', { isHorizontalSwipe, isVerticalSwipe, hasEnoughVelocity });
    
    if ((isHorizontalSwipe || isVerticalSwipe) && hasEnoughVelocity) {
        // Debounce the action
        if (swipeState.debounceTimer) {
            clearTimeout(swipeState.debounceTimer);
        }
        
        swipeState.debounceTimer = setTimeout(() => {
            let action = null;
            
            if (isHorizontalSwipe) {
                action = deltaX > 0 ? 'correct' : 'wrong';
            } else if (isVerticalSwipe && deltaY > 0) {
                action = 'skip';
            }
            
            if (action) {
                console.log('✅ Executing swipe action:', action);
                executeSwipeAction(action);
            }
        }, SWIPE_DEBOUNCE);
    }
}

function showSwipeGhost(deltaX, deltaY) {
    if (swipeState.ghostElement) {
        swipeState.ghostElement.remove();
    }
    
    const questionCard = document.getElementById('questionCard');
    const ghost = document.createElement('div');
    ghost.className = 'swipe-ghost';
    
    // Calculate swipe direction and intensity
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const intensity = Math.min(distance / 100, 1); // Normalize to 0-1
    
    // Determine action based on swipe direction
    let actionText = '';
    let backgroundColor = '';
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            actionText = '✓ Correct';
            backgroundColor = `rgba(16, 185, 129, ${intensity * 0.3})`;
        } else {
            actionText = '✗ Wrong';
            backgroundColor = `rgba(239, 68, 68, ${intensity * 0.3})`;
        }
    } else if (deltaY > 0) {
        actionText = '⏭️ Skip';
        backgroundColor = `rgba(245, 158, 11, ${intensity * 0.3})`;
    }
    
    // Only show ghost if there's a clear action
    if (actionText && distance > 30) {
    ghost.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
            background: ${backgroundColor};
        border-radius: 10px;
        pointer-events: none;
        z-index: 1000;
            transform: translate(${deltaX * 0.1}px, ${deltaY * 0.1}px);
            transition: all 0.1s ease;
            backdrop-filter: blur(2px);
        `;
        
        ghost.innerHTML = `
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        font-size: 1.8rem; font-weight: bold; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                        opacity: ${intensity};">
                ${actionText}
            </div>
        `;
    
    questionCard.style.position = 'relative';
    questionCard.appendChild(ghost);
    swipeState.ghostElement = ghost;
    }
}

function hideSwipeGhost() {
    if (swipeState.ghostElement) {
        swipeState.ghostElement.remove();
        swipeState.ghostElement = null;
    }
}

function executeSwipeAction(action) {
    // Add haptic feedback if available
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // Add sound feedback
    if (window.SoundEffects) {
        window.SoundEffects.playSound('click');
    }
    
    // Execute the action
    switch(action) {
        case 'correct':
            markCorrect();
            break;
        case 'wrong':
            markWrong();
            break;
        case 'skip':
            skipQuestion();
            break;
    }
    
    // Show visual feedback
    showSwipeFeedback(action);
}

function showSwipeFeedback(action) {
    const questionCard = document.getElementById('questionCard');
    const feedback = document.createElement('div');
    feedback.className = 'swipe-feedback';
    
    let text = '';
    let color = '';
    
    switch(action) {
        case 'correct':
            text = '✓ Correct!';
            color = 'var(--btn-success)';
            break;
        case 'wrong':
            text = '✗ Wrong';
            color = 'var(--btn-danger)';
            break;
        case 'skip':
            text = '⏭️ Skipped';
            color = 'var(--btn-primary)';
            break;
    }
    
    feedback.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${color};
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 1.2rem;
        font-weight: bold;
        z-index: 1001;
        pointer-events: none;
        animation: swipeFeedback 0.5s ease-out;
    `;
    feedback.textContent = text;
    
    questionCard.appendChild(feedback);
    
    // Remove after animation
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
        }
    }, 500);
}

// Add CSS for swipe feedback animation
const swipeCSS = `
@keyframes swipeFeedback {
    0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.5);
    }
    50% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.1);
    }
    100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(1);
    }
}
`;

// Add swipe CSS to head
const swipeStyle = document.createElement('style');
swipeStyle.textContent = swipeCSS;
document.head.appendChild(swipeStyle);