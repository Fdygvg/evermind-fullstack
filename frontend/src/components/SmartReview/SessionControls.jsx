// frontend/src/components/SmartReview/SessionControls.jsx
import React from 'react';
import { FaUndo, FaPause, FaStop } from 'react-icons/fa';
import './SessionControls.css';

/**
 * SessionControls - Unified session control buttons for all Smart Review modes
 * Provides consistent Undo, Pause, and End Session functionality
 */
const SessionControls = ({
    canUndo = false,
    onUndo,
    onPause,
    onEnd,
    isLoading = false,
}) => {
    return (
        <div className="session-controls-bar">
            {/* Undo Button - only shown when can undo */}
            {canUndo && (
                <button
                    className="session-control-btn undo-btn"
                    onClick={onUndo}
                    disabled={isLoading}
                    title="Undo last rating"
                >
                    <FaUndo className="btn-icon" />
                    <span className="btn-label">Undo</span>
                </button>
            )}

            {/* Pause Button */}
            <button
                className="session-control-btn pause-btn"
                onClick={onPause}
                disabled={isLoading}
                title="Pause and save progress"
            >
                <FaPause className="btn-icon" />
                <span className="btn-label">Pause</span>
            </button>

            {/* End Session Button */}
            <button
                className="session-control-btn end-btn"
                onClick={onEnd}
                disabled={isLoading}
                title="End session"
            >
                <FaStop className="btn-icon" />
                <span className="btn-label">End</span>
            </button>
        </div>
    );
};

export default SessionControls;
