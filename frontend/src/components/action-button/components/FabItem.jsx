import React from 'react';
import '../styles/fabItem.css';

const FabItem = ({ icon: Icon, label, onClick, isVisible, active, disabled }) => {
  return (
    <button
      className={`fab-item ${isVisible ? 'fab-item--visible' : ''} ${active ? 'fab-item--active' : ''} ${disabled ? 'fab-item--disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
    >
      <Icon className="fab-item-icon" />
      <span className="fab-item-label">{label}</span>
    </button>
  );
};

export default FabItem;