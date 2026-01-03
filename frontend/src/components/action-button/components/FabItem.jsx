import React from 'react';
import '../styles/fabItem.css';

const FabItem = ({ icon: Icon, label, onClick, isVisible }) => {
  return (
    <button
      className={`fab-item ${isVisible ? 'fab-item--visible' : ''}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <Icon className="fab-item-icon" />
      <span className="fab-item-label">{label}</span>
    </button>
  );
};

export default FabItem;