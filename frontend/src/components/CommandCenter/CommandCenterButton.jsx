// components/CommandCenter/CommandCenterButton.jsx
import React from 'react';
import { Settings } from 'lucide-react';

const CommandCenterButton = ({ onClick }) => {
  return (
    <button
      className="command-center-button"
      onClick={onClick}
      aria-label="Open Command Center"
    >
      <Settings size={24} />
    </button>
  );
};

export default CommandCenterButton;