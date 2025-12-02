import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { sectionService } from '../services/sections'
import { questionService } from '../services/question'
import { detectCodeInQuestion } from '../utils/codeDetector'

const AddQuestion = () => {
  const [sections, setSections] = useState([])
  const [selectedSection, setSelectedSection] = useState('')
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    tags: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const navigate = useNavigate()

  useEffect(() => {
    loadSections()
  }, [])

  const loadSections = async () => {
    try {
      const response = await sectionService.getSections()
      setSections(response.data.data.sections)
      if (response.data.data.sections.length > 0) {
        setSelectedSection(response.data.data.sections[0]._id)
      }
    } catch (error) {
      console.error('Failed to load sections:', error)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSection) {
      setMessage('Please select a section')
      return
    }

    setLoading(true)
    try {
      // Auto-detect if question/answer contains code
      const isCode = detectCodeInQuestion(formData.question, formData.answer);
      
      await questionService.createQuestion({
        sectionId: selectedSection,
        question: formData.question,
        answer: formData.answer,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        isCode: isCode
      })

      setMessage('Question added successfully!')
      setFormData({ question: '', answer: '', tags: '' })
      
      // Clear success message after 2 seconds
      setTimeout(() => setMessage(''), 2000)
    } catch (error) {
      setMessage('Failed to add question: ' + (error.response?.data?.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add-question-page">
      <div className="page-header">
        <h1>Add New Question</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          ← Back to Dashboard
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form className="question-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="section">Section *</label>
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

        <div className="form-group">
          <label htmlFor="question">Question *</label>
          <textarea
            id="question"
            name="question"
            value={formData.question}
            onChange={handleChange}
            placeholder="Enter your question..."
            required
            rows="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="answer">Answer *</label>
          <textarea
            id="answer"
            name="answer"
            value={formData.answer}
            onChange={handleChange}
            placeholder="Enter the answer..."
            required
            rows="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g., javascript, functions, arrays (comma separated)"
          />
          <small>Separate tags with commas</small>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Adding Question...' : 'Add Question'}
          </button>
          
          <button 
            type="button"
            className="secondary-button"
            onClick={() => navigate('/questions/bulk')}
          >
            Bulk Import
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddQuestion