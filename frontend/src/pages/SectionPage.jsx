import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { sectionService } from "../services/sections";
import { questionService } from "../services/question";
import { useNavigate } from "react-router-dom";

const Sections = () => {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await sectionService.getSections();
      setSections(response.data.data.sections);
    } catch (error) {
      console.error(error);
      setError("Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionQuestions = async (sectionId) => {
    try {
      setLoading(true);
      const response = await questionService.getQuestions({ sectionId });
      setQuestions(response.data.data.questions);
      setSelectedSection(sectionId);
    } catch (error) {
      console.error(error);
      setError("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;

    try {
      await questionService.deleteQuestion(questionId);
      setQuestions(questions.filter((q) => q._id !== questionId));
    } catch (error) {
      console.error(error);
      setError("Failed to delete question");
    }
  };

  if (loading && sections.length === 0) {
    return <div className="loading">Loading sections...</div>;
  }

  return (
    <div className="sections-container">
      <div className="sections-header">
        <h1>My Sections</h1>
        <div className="sections-header-actions">
          <Link to="/sections/add" className="add-section-btn">
            ➕ Add New Section
          </Link>
         
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="sections-layout">
        {/* Sections Sidebar */}
        <div className="sections-sidebar">
          <h3>Your Sections</h3>
          <div className="sections-list">
            {sections.map((section) => (
              <div
                key={section._id}
                className={`section-item ${
                  selectedSection === section._id ? "active" : ""
                }`}
                onClick={() => fetchSectionQuestions(section._id)}
                style={{ borderLeft: `4px solid ${section.color}` }}
              >
                <div className="section-info">
                  <h4>{section.name}</h4>
                  <p>{section.description}</p>
                </div>
                <div className="section-stats">
                  <span className="question-count">
                    {section.questionCount || 0} questions
                    {/* Section Question Count */}
                  </span>
                   <button 
  className="edit-btn"
  onClick={() => navigate(`/sections/edit/${section._id}`, { 
    state: { section } 
  })}
>
  Edit
</button> 
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Questions Panel */}
        <div className="questions-panel">
          {selectedSection ? (
            <>
              <div className="questions-header">
                <h2>
                  Questions in{" "}
                  {sections.find((s) => s._id === selectedSection)?.name}
                </h2>
                <div className="questions-header-actions">
                  <Link
                    to={`/questions/add?sectionId=${selectedSection}`}
                    className="add-question-btn"
                  >
                    + Add Question
                  </Link>
                  <Link
                    to="/questions/bulk-import"
                    className="add-question-btn secondary"
                  >
                    📥 Bulk Import
                  </Link>
                  <Link
                    to="/questions/export"
                    className="add-question-btn secondary"
                  >
                    📤 Export
                  </Link>
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="empty-state">
                  <p>No questions in this section yet.</p>
                  <Link
                    to={`/add-question?sectionId=${selectedSection}`}
                    className="add-question-link"
                  >
                    Add your first question
                  </Link>
                </div>
              ) : (
                <div className="questions-list">
                  {questions.map((question) => (
                    <div key={question._id} className="question-card">
                      <div className="question-content">
                        <h4>Q: {question.question}</h4>
                        <p>A: {question.answer}</p>
                        <div className="question-stats">
                          <span className="correct-stat">
                            ✅ {question.totalCorrect || 0}
                          </span>
                          <span className="wrong-stat">
                            ❌ {question.totalWrong || 0}
                          </span>
                          <span className="review-date">
                            Last:{" "}
                            {question.lastReviewed
                              ? new Date(
                                  question.lastReviewed
                                ).toLocaleDateString()
                              : "Never"}
                          </span>
                        </div>
                      </div>
                      <div className="question-actions">
                        <button
                          className="edit-btn"
                          onClick={() =>
                            navigate(`/questions/edit/${question._id}`, {
                              state: { question },
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => deleteQuestion(question._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="no-section-selected">
              <h3>Select a section to view questions</h3>
              <p>Choose a section from the sidebar to see its questions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sections;



