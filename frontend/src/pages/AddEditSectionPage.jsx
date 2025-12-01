import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { sectionService } from '../services/sections.js';



const AddEditSectionPage = () => {
  const { id } = useParams(); // For editing existing section
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#667eea' // Default blue
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [sectionStats, setSectionStats] = useState(null);

  // Color palette for selection
  const colorPalette = [
    '#667eea', // Blue
    '#764ba2', // Purple
    '#f093fb', // Pink
    '#f5576c', // Red
    '#4fd1c5', // Teal
    '#10b981', // Green
    '#f59e0b', // Orange
    '#ed8936', // Amber
    '#ed64a6', // Rose
    '#805ad5', // Violet
    '#3182ce', // Light Blue
    '#38a169', // Light Green
    '#d69e2e', // Yellow
    '#e53e3e', // Dark Red
    '#2d3748', // Dark Gray
  ];

  useEffect(() => {
    if (id) {
      // Editing existing section
      setIsEditing(true);
      fetchSection(id);
    } else if (location.state?.section) {
      // Section passed via state (e.g., from Sections page)
      setIsEditing(true);
      populateForm(location.state.section);
    }
  }, [id, location.state]);

  const fetchSection = async (sectionId) => {
    try {
      setLoading(true);
      const response = await sectionService.getSections();
      const sections = response.data.data.sections;
      const section = sections.find(s => s._id === sectionId);
      
      if (section) {
        populateForm(section);
        // Fetch section stats if editing
        fetchSectionStats(sectionId);
      } else {
        setError('Section not found');
      }
    } catch (error) {
        console.error(error)
      setError('Failed to load section');
    } finally {
      setLoading(false);
    }
  };

const fetchSectionStats = async (sectionId) => {
  try {
    const response = await sectionService.getSectionStats(sectionId);
    
    if (response.data.success) {
      const stats = response.data.data;
      
      setSectionStats({
        questionCount: stats.questionCount,
        accuracy: stats.accuracy,
        totalCorrect: stats.totalCorrect,
        totalWrong: stats.totalWrong,
        totalAttempts: stats.totalAttempts,
        lastActivity: stats.lastActivity 
          ? new Date(stats.lastActivity).toLocaleDateString()
          : 'Never',
        recentQuestions: stats.recentQuestions || []
      });
    }
  } catch (error) {
    console.error('Failed to fetch section stats:', error);
    // Fallback to basic stats
    setSectionStats({
      questionCount: 0,
      accuracy: 0,
      totalCorrect: 0,
      totalWrong: 0,
      totalAttempts: 0,
      lastActivity: 'Never',
      recentQuestions: []
    });
  }
};

  const populateForm = (section) => {
    setFormData({
      name: section.name || '',
      description: section.description || '',
      color: section.color || '#667eea'
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleColorSelect = (color) => {
    setFormData(prev => ({
      ...prev,
      color
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (isEditing) {
        // Update existing section
        const sectionId = id || location.state?.section?._id;
        await sectionService.updateSection(sectionId, formData);
        setSuccess('Section updated successfully!');
      } else {
        // Create new section
        await sectionService.createSection(formData);
        setSuccess('Section created successfully!');
      }

      // Redirect after delay
      setTimeout(() => {
        navigate('/sections');
      }, 1500);

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;

    const sectionName = formData.name;
    if (!window.confirm(`Are you sure you want to delete "${sectionName}"? This will also delete all questions in this section.`)) {
      return;
    }

    try {
      const sectionId = id || location.state?.section?._id;
      await sectionService.deleteSection(sectionId);
      navigate('/sections');
    } catch (error) {
        console.error(error)

      setError('Failed to delete section. Make sure it has no questions first.');
    }
  };

  const handleDuplicate = async () => {
    if (!isEditing) return;

    const duplicateName = `${formData.name} (Copy)`;
    if (!window.confirm(`Create a copy of "${formData.name}" as "${duplicateName}"?`)) {
      return;
    }

    try {
      const duplicateData = {
        ...formData,
        name: duplicateName
      };
      
      await sectionService.createSection(duplicateData);
      setSuccess('Section duplicated successfully!');
      
      setTimeout(() => {
        navigate('/sections');
      }, 1500);
    } catch (error) {
        console.error(error)

      setError('Failed to duplicate section');
    }
  };

  if (loading) {
    return (
      <div className="section-loading">
        <div className="loading-spinner"></div>
        <p>Loading section...</p>
      </div>
    );
  }

  return (
    <div className="add-edit-section-container">
      <div className="section-form-card">
        <div className="section-form-header">
          <h1>
            {isEditing ? '✏️ Edit Section' : '➕ Add New Section'}
          </h1>
          <p className="form-subtitle">
            {isEditing 
              ? 'Update your section details' 
              : 'Create a new category for your questions'}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            ✅ {success}
          </div>
        )}

        {/* Section Stats (Editing Mode) */}
        {isEditing && sectionStats && (
          <div className="section-stats-preview">
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Questions:</span>
                <span className="stat-value">{sectionStats.questionCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Accuracy:</span>
                <span className="stat-value">{sectionStats.accuracy}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Last Activity:</span>
                <span className="stat-value">
                  {new Date(sectionStats.lastActivity).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}

        <form className="section-form" onSubmit={handleSubmit}>
          {/* Section Name */}
          <div className="form-group">
            <label htmlFor="name">Section Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., JavaScript, Anatomy, Hot Keys"
              required
              maxLength={50}
            />
            <div className="char-count">
              {formData.name.length}/50 characters
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              rows="3"
              placeholder="Describe what this section contains..."
              maxLength={200}
            />
            <div className="char-count">
              {formData.description.length}/200 characters
            </div>
          </div>

          {/* Color Selection */}
          <div className="form-group">
            <label>Color Theme</label>
            <div className="color-preview" style={{ backgroundColor: formData.color }}>
              <span className="preview-text">Preview</span>
            </div>
            
            <div className="color-palette">
              {colorPalette.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${formData.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                >
                  {formData.color === color && (
                    <span className="check-icon">✓</span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="color-input-group">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="color-hex-input"
                placeholder="#667eea"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/sections')}
              disabled={saving}
            >
              Cancel
            </button>
            
            {/* Editing Mode Actions */}
            {isEditing && (
              <>
                <button
                  type="button"
                  className="duplicate-btn"
                  onClick={handleDuplicate}
                  disabled={saving}
                >
                  📋 Duplicate
                </button>
                
                <button
                  type="button"
                  className="delete-btn"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  🗑️ Delete
                </button>
              </>
            )}
            
            <button
              type="submit"
              className="save-btn"
              disabled={saving || !formData.name.trim()}
            >
              {saving ? (
                <>
                  <span className="spinner-small"></span>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Section' : 'Create Section'
              )}
            </button>
          </div>
        </form>

        {/* Quick Tips */}
        <div className="quick-tips">
          <h3>💡 Tips for great sections:</h3>
          <ul>
            <li>Keep section names short and descriptive</li>
            <li>Use colors to visually categorize topics</li>
            <li>Add descriptions to remember the focus area</li>
            <li>Create sections for different difficulty levels</li>
            <li>Use tags within sections for finer organization</li>
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button 
            className="action-btn"
            onClick={() => navigate('/questions/add', {
              state: { sectionId: id || location.state?.section?._id }
            })}
          >
            ➕ Add Question to This Section
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/sessions/start', {
              state: { 
                sectionId: id || location.state?.section?._id,
                autoStart: true 
              }
            })}
          >
            🧠 Review This Section
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEditSectionPage;