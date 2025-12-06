import React from 'react';
import '../Common/css/eliminatedList.css';

const EliminatedList = ({
  eliminatedQuestions = [],
  partialQuestions = [],
  onReset
}) => {
  const hasEliminated = (eliminatedQuestions?.length ?? 0) > 0;
  const hasPartial = (partialQuestions?.length ?? 0) > 0;

  if (!hasEliminated && !hasPartial) {
    return null;
  }

  return (
    <div className="eliminated-section">
      {hasEliminated && (
        <div className="eliminated-group">
          <h3>✅ Fully Eliminated ({eliminatedQuestions?.length ?? 0})</h3>
          <div className="eliminated-list">
            {(eliminatedQuestions || []).map((question) => (
              <div key={question._id} className="eliminated-card">
                <span className="eliminated-text">{question.question}</span>
                <button
                  className="undo-btn"
                  onClick={() => onReset(question._id)}
                  title="Bring back this question"
                >
                  Undo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {hasPartial && (
        <div className="eliminated-group">
          <h3>⚠️ Partially Known ({partialQuestions?.length ?? 0})</h3>
          <div className="eliminated-list">
            {(partialQuestions || []).map((question) => (
              <div key={question._id} className="eliminated-card partial">
                <span className="eliminated-text">{question.question}</span>
                <button
                  className="undo-btn"
                  onClick={() => onReset(question._id)}
                  title="Bring back this question"
                >
                  Undo
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EliminatedList;

