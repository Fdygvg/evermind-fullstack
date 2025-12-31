import React from 'react';
import '../Common/css/SectionProgressDisplay.css';

const SectionProgressDisplay = ({ sectionProgress, sections = [] }) => {
    if (!sectionProgress || Object.keys(sectionProgress).length === 0) {
        return null;
    }

    return (
        <div className="section-progress-display">
            <h4>Section Progress</h4>
            <div className="progress-grid">
                {sections.map(section => {
                    const progress = sectionProgress[section._id];
                    if (!progress) return null;

                    return (
                        <div key={section._id} className="section-progress-item">
                            <div className="section-name">{section.name}</div>
                            <div className="session-day">
                                <span className="day-label">Day</span>
                                <span className="day-number">{progress.currentSessionDay}</span>
                            </div>
                            <div className="session-count">
                                {progress.totalSessions} sessions
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SectionProgressDisplay;