import React, { useState } from 'react';
import '../../css/MobileTikTokCard.css';

const MobileTikTokCard = ({ question, answer, onRate }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="mobile-tiktok-card">
      {/* Mobile TikTok Card Component */}
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

export default MobileTikTokCard;

