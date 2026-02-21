import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { questionService } from "../services/question";
import { sectionService } from "../services/sections";
import { detectCodeInQuestion } from "../utils/codeDetector";

const EditQuestionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    sectionId: "",
    tags: "",
  });

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check if we're editing an existing question or coming from sections
  const questionToEdit = location.state?.question;

  useEffect(() => {
    fetchSections();

    if (questionToEdit) {
      // If question was passed via state
      populateForm(questionToEdit);
    } else if (id) {
      // If we have an ID in URL, fetch the question
      fetchQuestion(id);
    }
  }, [id, questionToEdit]);

  const fetchSections = async () => {
    try {
      const response = await sectionService.getSections();
      setSections(response.data.data.sections);
    } catch (error) {
      console.error(error);
      setError("Failed to load sections");
    }
  };

  const fetchQuestion = async (questionId) => {
    try {
      setLoading(true);
      const response = await questionService.getQuestions();
      const allQuestions = response.data.data.questions;
      const question = allQuestions.find((q) => q._id === questionId);

      if (question) {
        populateForm(question);
      } else {
        setError("Question not found");
      }
    } catch (error) {
      console.error(error);
      setError("Failed to load question");
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (question) => {
    setFormData({
      question: question.question || "",
      answer: question.answer || "",
      sectionId: question.sectionId?._id || question.sectionId || "",
      tags: question.tags?.join(", ") || "",
    });
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Prepare tags array
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Auto-detect if question/answer contains code
      const detection = detectCodeInQuestion(formData.question, formData.answer);
      const isCode = detection.isCode;

      const questionData = {
        ...formData,
        tags: tagsArray,
        isCode: isCode,
      };

      if (id || questionToEdit) {
        // Update existing question
        const questionId = id || questionToEdit._id;
        await questionService.updateQuestion(questionId, questionData);
        setSuccess("Question updated successfully!");

        // Redirect after delay
        setTimeout(() => {
          navigate("/sections");
        }, 1500);
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this question? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const questionId = id || questionToEdit._id;
      await questionService.deleteQuestion(questionId);
      navigate("/sections");
    } catch (error) {
      console.error(error);
      setError("Failed to delete question");
    }
  };

  if (loading) {
    return (
      <div className="edit-question-loading">
        <div className="loading-spinner"></div>
        <p>Loading question...</p>
      </div>
    );
  }

  return (
    <div className="edit-question-container">
      <div className="edit-question-card">
        <div className="edit-question-header">
          <h1>✏️ Edit Question</h1>
          <p>Update your question details</p>
        </div>

        {error && <div className="error-message">❌ {error}</div>}

        {success && <div className="success-message">✅ {success}</div>}

        <form className="edit-question-form" onSubmit={handleSubmit}>
          {/* Question Input */}
          <div className="form-group">
            <label htmlFor="question">Question</label>
            <textarea
              id="question"
              name="question"
              value={formData.question}
              onChange={handleChange}
              className="form-textarea"
              rows="4"
              required
              placeholder="Enter your question here..."
            />
          </div>

          {/* Answer Input */}
          <div className="form-group">
            <label htmlFor="answer">Answer</label>
            <textarea
              id="answer"
              name="answer"
              value={formData.answer}
              onChange={handleChange}
              className="form-textarea"
              rows="4"
              required
              placeholder="Enter the answer here..."
            />
          </div>

          {/* Section Selection */}
          <div className="form-group">
            <label htmlFor="sectionId">Section</label>
            <select
              id="sectionId"
              name="sectionId"
              value={formData.sectionId}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select a section</option>
              {sections.map((section) => (
                <option key={section._id} value={section._id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags Input */}
          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., javascript, functions, async (comma separated)"
            />
            <small className="form-hint">Separate tags with commas</small>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="button"
              className="delete-btn"
              onClick={handleDelete}
              disabled={saving}
            >
              Delete Question
            </button>

            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Quick Navigation */}
        <div className="quick-nav">
          <button
            className="nav-btn"
            onClick={() => navigate("/questions/add")}
          >
            ➕ Add New Question
          </button>
          <button className="nav-btn" onClick={() => navigate("/sections")}>
            📂 Back to Sections
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditQuestionPage;
