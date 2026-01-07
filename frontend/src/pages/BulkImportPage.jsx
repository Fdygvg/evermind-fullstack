import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sectionService } from '../services/sections';
import { questionService } from '../services/question';
import { detectCodeInQuestion } from '../utils/codeDetector';

const BulkImportPage = () => {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [inputMethod, setInputMethod] = useState('text'); // 'text', 'json', 'csv'
  const [textInput, setTextInput] = useState('');
  const [jsonFile, setJsonFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const response = await sectionService.getSections();
      setSections(response.data.data.sections);
      if (response.data.data.sections.length > 0) {
        setSelectedSection(response.data.data.sections[0]._id);
      }
    } catch (error) {
      console.error('Failed to load sections:', error);
      setError('Failed to load sections');
    }
  };

  // Text format parser: "Question | Answer"
  const parseTextFormat = (text) => {
    const lines = text.split('\n');
    const questions = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return; // Skip empty lines

      const parts = trimmed.split('|').map(p => p.trim());
      if (parts.length !== 2) {
        throw new Error(`Line ${index + 1}: Invalid format. Expected "Question | Answer"`);
      }

      if (!parts[0] || !parts[1]) {
        throw new Error(`Line ${index + 1}: Question and Answer cannot be empty`);
      }

      questions.push({
        question: parts[0],
        answer: parts[1]
      });
    });

    return questions;
  };

  // JSON parser
  const parseJSONFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!Array.isArray(data)) {
            reject(new Error('JSON must be an array of question objects'));
            return;
          }

          const questions = data.map((item, index) => {
            if (!item.question || !item.answer) {
              throw new Error(`Item ${index + 1}: Missing question or answer field`);
            }
            return {
              question: String(item.question).trim(),
              answer: String(item.answer).trim()
            };
          });

          resolve(questions);
        } catch (err) {
          reject(new Error(`Invalid JSON: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // CSV parser (simple implementation)
  const parseCSVFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim());

          if (lines.length === 0) {
            reject(new Error('CSV file is empty'));
            return;
          }

          // Check if first line is header
          const hasHeader = lines[0].toLowerCase().includes('question') &&
            lines[0].toLowerCase().includes('answer');
          const startIndex = hasHeader ? 1 : 0;

          const questions = [];
          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV parsing (handles quoted values)
            const values = [];
            let current = '';
            let inQuotes = false;

            for (let j = 0; j < line.length; j++) {
              const char = line[j];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim());

            if (values.length < 2) {
              throw new Error(`Line ${i + 1}: Invalid CSV format. Expected at least 2 columns`);
            }

            const question = values[0].replace(/^"|"$/g, '');
            const answer = values[1].replace(/^"|"$/g, '');

            if (!question || !answer) {
              throw new Error(`Line ${i + 1}: Question and Answer cannot be empty`);
            }

            questions.push({ question, answer });
          }

          resolve(questions);
        } catch (err) {
          reject(new Error(`CSV parsing error: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Handle text input change and parse
  const handleTextChange = (e) => {
    setTextInput(e.target.value);
    setError('');
    setParsedQuestions([]);

    if (e.target.value.trim()) {
      try {
        const questions = parseTextFormat(e.target.value);
        setParsedQuestions(questions);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Handle JSON file upload
  const handleJSONFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setJsonFile(file);
    setError('');
    setParsedQuestions([]);

    try {
      const questions = await parseJSONFile(file);
      setParsedQuestions(questions);
    } catch (err) {
      setError(err.message);
      setJsonFile(null);
    }
  };

  // Handle CSV file upload
  const handleCSVFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCsvFile(file);
    setError('');
    setParsedQuestions([]);

    try {
      const questions = await parseCSVFile(file);
      setParsedQuestions(questions);
    } catch (err) {
      setError(err.message);
      setCsvFile(null);
    }
  };

  // Import questions
  const handleImport = async () => {
    if (!selectedSection) {
      setError('Please select a section');
      return;
    }

    if (parsedQuestions.length === 0) {
      setError('No questions to import');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Format questions with sectionId and auto-detect code
      const questionsToImport = parsedQuestions.map(q => ({
        question: q.question,
        answer: q.answer,
        sectionId: selectedSection,
        isCode: detectCodeInQuestion(q.question, q.answer).isCode
      }));

      const response = await questionService.bulkImport(questionsToImport);

      setMessage(`Successfully imported ${response.data.data.questions.length} questions!`);

      // Clear inputs
      setTextInput('');
      setJsonFile(null);
      setCsvFile(null);
      setParsedQuestions([]);

      // Reset file inputs
      document.querySelectorAll('input[type="file"]').forEach(input => input.value = '');

      // Navigate after 2 seconds
      setTimeout(() => {
        navigate(`/sections`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-import-page">
      <div className="bulk-import-header">
        <h1>Bulk Import Questions</h1>
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

      <div className="bulk-import-container">
        {/* Section Selector */}
        <div className="form-group">
          <label htmlFor="section">Select Section *</label>
          <select
            id="section"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            required
          >
            <option value="">Select a section</option>
            {sections.map(section => (
              <option key={section._id} value={section._id}>
                {section.name}
              </option>
            ))}
          </select>
        </div>

        {/* Input Method Tabs */}
        <div className="input-method-tabs">
          <button
            className={`tab ${inputMethod === 'text' ? 'active' : ''}`}
            onClick={() => {
              setInputMethod('text');
              setError('');
              setParsedQuestions([]);
            }}
          >
            Text Format
          </button>
          <button
            className={`tab ${inputMethod === 'json' ? 'active' : ''}`}
            onClick={() => {
              setInputMethod('json');
              setError('');
              setParsedQuestions([]);
            }}
          >
            JSON File
          </button>
          <button
            className={`tab ${inputMethod === 'csv' ? 'active' : ''}`}
            onClick={() => {
              setInputMethod('csv');
              setError('');
              setParsedQuestions([]);
            }}
          >
            CSV File
          </button>
        </div>

        {/* Text Input */}
        {inputMethod === 'text' && (
          <div className="input-section">
            <label htmlFor="text-input">Enter questions (one per line)</label>
            <textarea
              id="text-input"
              className="text-input"
              value={textInput}
              onChange={handleTextChange}
              placeholder="Question 1 | Answer 1&#10;Question 2 | Answer 2&#10;Question 3 | Answer 3"
              rows="10"
            />
            <small>Format: Question | Answer (one per line, separated by |)</small>
          </div>
        )}

        {/* JSON File Upload */}
        {inputMethod === 'json' && (
          <div className="input-section">
            <label htmlFor="json-file">Upload JSON File</label>
            <input
              type="file"
              id="json-file"
              accept=".json"
              onChange={handleJSONFileChange}
            />
            <small>
              JSON format: [{"{"}"question": "...", "answer": "..."{"}"}, ...]
            </small>
            {jsonFile && (
              <div className="file-info">Selected: {jsonFile.name}</div>
            )}
          </div>
        )}

        {/* CSV File Upload */}
        {inputMethod === 'csv' && (
          <div className="input-section">
            <label htmlFor="csv-file">Upload CSV File</label>
            <input
              type="file"
              id="csv-file"
              accept=".csv"
              onChange={handleCSVFileChange}
            />
            <small>
              CSV format: question,answer (first row can be header)
            </small>
            {csvFile && (
              <div className="file-info">Selected: {csvFile.name}</div>
            )}
          </div>
        )}

        {/* Preview */}
        {parsedQuestions.length > 0 && (
          <div className="preview-section">
            <h3>Preview ({parsedQuestions.length} questions)</h3>
            <div className="preview-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Answer</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedQuestions.slice(0, 10).map((q, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{q.question}</td>
                      <td>{q.answer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedQuestions.length > 10 && (
                <p className="preview-more">
                  ... and {parsedQuestions.length - 10} more questions
                </p>
              )}
            </div>
          </div>
        )}

        {/* Import Button */}
        <div className="import-actions">
          <button
            className="import-button"
            onClick={handleImport}
            disabled={loading || parsedQuestions.length === 0 || !selectedSection}
          >
            {loading ? 'Importing...' : `Import ${parsedQuestions.length} Questions`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkImportPage;

