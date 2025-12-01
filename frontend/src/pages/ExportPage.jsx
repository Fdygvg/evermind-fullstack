import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sectionService } from '../services/sections';
import { questionService } from '../services/question';
import { generateHTML } from '../utils/templateProcessor';
import { downloadHTML, generateFilename } from '../utils/fileDownload';

const ExportPage = () => {
  const [sections, setSections] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('dual-mode');
  const [exportOptions, setExportOptions] = useState({
    title: 'Exam Revision',
    themeMode: 'dark',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [questionCount, setQuestionCount] = useState(0);

  const navigate = useNavigate();

  const templates = [
    {
      id: 'dual-mode',
      name: 'Dual Mode',
      description: 'Homepage and Revision modes with stats tracking',
      preview: '📘',
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean and simple design',
      preview: '📄',
    },
    {
      id: 'cards',
      name: 'Cards',
      description: 'Card-based layout with grid view',
      preview: '🃏',
    },
  ];

  useEffect(() => {
    loadSections();
  }, []);

  useEffect(() => {
    if (selectedSections.length > 0) {
      fetchQuestionCount();
    } else {
      setQuestionCount(0);
    }
  }, [selectedSections]);

  const loadSections = async () => {
    try {
      const response = await sectionService.getSections();
      setSections(response.data.data.sections);
    } catch (error) {
      console.error('Failed to load sections:', error);
      setError('Failed to load sections');
    }
  };

  const fetchQuestionCount = async () => {
    try {
      const params = { sectionId: selectedSections.join(',') };
      const response = await questionService.getQuestions(params);
      setQuestionCount(response.data.data.questions?.length || 0);
    } catch (error) {
      console.error('Failed to fetch question count:', error);
    }
  };

  const toggleSection = (sectionId) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleOptionChange = (key, value) => {
    setExportOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleExport = async () => {
    if (selectedSections.length === 0) {
      setError('Please select at least one section to export');
      return;
    }

    if (questionCount === 0) {
      setError('Selected sections have no questions to export');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Fetch questions from backend
      const params = { sectionId: selectedSections.join(',') };
      let response;
      try {
        // Try export endpoint first
        response = await questionService.exportQuestions(params);
      } catch (err) {
        // Fallback to regular getQuestions if export endpoint doesn't exist
        response = await questionService.getQuestions(params);
      }
      const questions = response.data.data.questions;

      if (!questions || questions.length === 0) {
        setError('No questions found to export');
        setLoading(false);
        return;
      }

      // Generate HTML
      const htmlContent = generateHTML(selectedTemplate, questions, exportOptions);

      // Download file
      const filename = generateFilename(exportOptions.title);
      downloadHTML(htmlContent, filename);

      setMessage(`Successfully exported ${questions.length} questions!`);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
        navigate('/sections');
      }, 3000);
    } catch (err) {
      console.error('Export error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to export questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="export-page">
      <div className="export-header">
        <h1>Export Questions</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/sections')}
        >
          ← Back to Sections
        </button>
      </div>

      {message && (
        <div className="message success">{message}</div>
      )}

      {error && (
        <div className="message error">{error}</div>
      )}

      <div className="export-container">
        {/* Section Selection */}
        <div className="export-section">
          <h2>Select Sections</h2>
          <p className="section-hint">
            Choose which sections to include in your export
          </p>
          {questionCount > 0 && (
            <div className="question-count-badge">
              {questionCount} question{questionCount !== 1 ? 's' : ''} selected
            </div>
          )}
          <div className="sections-selection">
            {sections.length === 0 ? (
              <p className="no-sections">No sections available. Create a section first.</p>
            ) : (
              sections.map((section) => (
                <label key={section._id} className="section-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedSections.includes(section._id)}
                    onChange={() => toggleSection(section._id)}
                  />
                  <span className="section-checkbox-label">
                    <span className="section-name">{section.name}</span>
                    <span className="section-meta">
                      {section.questionCount || 0} questions
                    </span>
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Template Selection */}
        <div className="export-section">
          <h2>Choose Template</h2>
          <p className="section-hint">
            Select a design theme for your exported HTML file
          </p>
          <div className="templates-grid">
            {templates.map((template) => (
              <button
                key={template.id}
                className={`template-card ${selectedTemplate === template.id ? 'active' : ''}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="template-preview-icon">{template.preview}</div>
                <h3 className="template-name">{template.name}</h3>
                <p className="template-description">{template.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Customization Options */}
        <div className="export-section">
          <h2>Customization</h2>
          <div className="options-grid">
            <div className="option-group">
              <label htmlFor="export-title">Document Title</label>
              <input
                id="export-title"
                type="text"
                value={exportOptions.title}
                onChange={(e) => handleOptionChange('title', e.target.value)}
                placeholder="Exam Revision"
              />
            </div>

            <div className="option-group">
              <label htmlFor="export-theme">Default Theme</label>
              <select
                id="export-theme"
                value={exportOptions.themeMode}
                onChange={(e) => handleOptionChange('themeMode', e.target.value)}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="export-actions">
          <button
            className="export-button"
            onClick={handleExport}
            disabled={loading || selectedSections.length === 0 || questionCount === 0}
          >
            {loading ? 'Exporting...' : `Export ${questionCount} Questions`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;

