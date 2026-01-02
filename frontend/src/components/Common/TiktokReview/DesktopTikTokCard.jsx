import React, { useState } from 'react';
import '../../css/DesktopTikTokCard.css';

const DesktopTikTokCard = ({ question, answer, onRate }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="desktop-tiktok-card">
      {/* Desktop TikTok Card Component */}
      <div className="card-content">
        {isFlipped ? (
          <div className="card-answer">{answer}</div>
        ) : (
          <div className="card-question">{question}</div>
        )}
      </div>
      <button onClick={handleFlip}>Flip</button>
    </div>
  );
};

export default DesktopTikTokCard;

