// frontend/src/components/SmartReview/AIChatPanel.jsx
import React, { useState } from 'react';
import { FaRobot, FaTimes, FaLightbulb, FaPen, FaCheck, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import { aiService } from '../../services/aiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './AIChatPanel.css';
const AIChatPanel = ({
  question,        // current question object { _id, question, answer }
  onClose,         // close the panel
  onAnswerSaved,   // callback after saving a rewritten answer (updates session state)
}) => {
  const [activeTab, setActiveTab] = useState(null);  // null | 'explain' | 'rewrite'
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [rewriteData, setRewriteData] = useState(null);  // { versionA, versionB, original }
  const [selectedVersion, setSelectedVersion] = useState(null);  // 'A' | 'B'
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleExplain = async () => {
    setActiveTab('explain');
    setLoading(true);
    setError('');
    setExplanation('');
    try {
      const response = await aiService.explain(question.question, question.answer);
      setExplanation(response.data.data.explanation);
    } catch (err) {
      console.error('AI Explain error:', err);
      setError('Failed to get explanation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRewrite = async () => {
    setActiveTab('rewrite');
    setLoading(true);
    setError('');
    setRewriteData(null);
    setSelectedVersion(null);
    setSaved(false);
    try {
      const response = await aiService.rewrite(question.question, question.answer);
      setRewriteData(response.data.data);
    } catch (err) {
      console.error('AI Rewrite error:', err);
      setError('Failed to generate rewrites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRewrite = async () => {
    if (!selectedVersion || !rewriteData) return;

    const newAnswer = selectedVersion === 'A' ? rewriteData.versionA : rewriteData.versionB;
    setSaving(true);
    try {
      await aiService.saveAnswer(question._id, newAnswer);
      setSaved(true);
      // Update the question in the current session so the UI reflects it immediately
      if (onAnswerSaved) {
        onAnswerSaved(question._id, { answer: newAnswer });
      }
    } catch (err) {
      console.error('Save rewrite error:', err);
      setError('Failed to save the new answer.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    setActiveTab(null);
    setExplanation('');
    setRewriteData(null);
    setSelectedVersion(null);
    setSaved(false);
    setError('');
  };

  return (
    <div className="ai-chat-panel">
      {/* Header */}
      <div className="ai-panel-header">
        <div className="ai-header-left">
          {activeTab && (
            <button className="ai-back-btn" onClick={handleBack} title="Back">
              <FaArrowLeft />
            </button>
          )}
          <FaRobot className="ai-avatar" />
          <div>
            <span className="ai-title">Code Sage</span>
            <span className="ai-subtitle">
              {activeTab === 'explain' ? 'Explaining...' : activeTab === 'rewrite' ? 'Rewriting...' : 'Your AI Study Buddy'}
            </span>
          </div>
        </div>
        <button className="ai-close-btn" onClick={onClose} title="Close AI Panel">
          <FaTimes />
        </button>
      </div>

      {/* Content Area */}
      <div className="ai-panel-content">
        {/* Menu (no tab selected) */}
        {!activeTab && (
          <div className="ai-menu">
            <p className="ai-menu-prompt">What would you like me to do with this question?</p>
            <button className="ai-action-card" onClick={handleExplain}>
              <FaLightbulb className="ai-action-icon explain-icon" />
              <div>
                <strong>Explain This</strong>
                <span>Break it down like I'm a junior dev</span>
              </div>
            </button>
            <button className="ai-action-card" onClick={handleRewrite}>
              <FaPen className="ai-action-icon rewrite-icon" />
              <div>
                <strong>Rewrite Answer</strong>
                <span>Generate 2 improved versions to choose from</span>
              </div>
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="ai-loading">
            <FaSpinner className="ai-spinner" />
            <span>{activeTab === 'explain' ? 'Code Sage is thinking...' : 'Generating rewrites...'}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="ai-error">
            <span>⚠️ {error}</span>
            <button onClick={activeTab === 'explain' ? handleExplain : handleRewrite}>Retry</button>
          </div>
        )}

        {/* Explain result */}
        {activeTab === 'explain' && explanation && !loading && (
          <div className="ai-explanation">
            <div className="ai-markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {explanation}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Rewrite result */}
        {activeTab === 'rewrite' && rewriteData && !loading && (
          <div className="ai-rewrite-results">
            {/* Version A */}
            <div
              className={`ai-version-card ${selectedVersion === 'A' ? 'selected' : ''}`}
              onClick={() => !saved && setSelectedVersion('A')}
            >
              <div className="ai-version-header">
                <span className="ai-version-badge a">Version A</span>
                <span className="ai-version-label">Concise</span>
              </div>
              <div className="ai-version-body ai-markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {rewriteData.versionA}
                </ReactMarkdown>
              </div>
            </div>

            {/* Version B */}
            <div
              className={`ai-version-card ${selectedVersion === 'B' ? 'selected' : ''}`}
              onClick={() => !saved && setSelectedVersion('B')}
            >
              <div className="ai-version-header">
                <span className="ai-version-badge b">Version B</span>
                <span className="ai-version-label">Detailed</span>
              </div>
              <div className="ai-version-body ai-markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {rewriteData.versionB}
                </ReactMarkdown>
              </div>
            </div>

            {/* Save button */}
            {selectedVersion && !saved && (
              <button
                className="ai-save-btn"
                onClick={handleSaveRewrite}
                disabled={saving}
              >
                {saving ? (
                  <><FaSpinner className="ai-spinner" /> Saving...</>
                ) : (
                  <><FaCheck /> Save Version {selectedVersion} as New Answer</>
                )}
              </button>
            )}

            {saved && (
              <div className="ai-saved-banner">
                <FaCheck /> Answer updated successfully!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatPanel;
