import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sectionService } from "../services/sections";
import { sessionService } from "../services/sessions";
import { useSession } from '../hooks/useSession'
import { FaQuestionCircle } from "react-icons/fa";


const ReviewSessionPage = () => {
  const [sections, setSections] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [sessionType, setSessionType] = useState("review"); // "review" or "elimination"
  const [cardMode, setCardMode] = useState("normal"); // "normal" or "flashcard"
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState(null); // tracks which card is flipped 

  
  const { setActiveSession } = useSession()
  const navigate = useNavigate();

  // Helper function to convert hex color to rgba with opacity
  const hexToRgba = (hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  useEffect(() => {
    loadSections();
  }, []);

  useEffect(() => {
  const cards = document.querySelectorAll('.section-card');
  cards.forEach(card => {
    card.addEventListener('click', function() {
      if (this.classList.contains('selected')) {
        this.classList.add('selected-remove');
        setTimeout(() => this.classList.remove('selected-remove'), 300);
      } else {
        this.classList.add('selected-add');
        setTimeout(() => this.classList.remove('selected-add'), 300);
      }
    });
  });
}, [sections]);

  const loadSections = async () => {
    try {
      const response = await sectionService.getSections();
      setSections(response.data.data.sections);
    } catch (error) {
      console.error("Failed to load sections:", error);
    }
  };

  const toggleSection = (sectionId) => {
    setSelectedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const startSession = async () => {
    if (selectedSections.length === 0) {
      alert("Please select at least one section");
      return;
    }

    setLoading(true);
    try {
      // If elimination mode, navigate directly to elimination page
      if (sessionType === "elimination") {
        navigate("/elimination", {
          state: { sectionIds: selectedSections }
        });
        setLoading(false);
        return;
      }


      console.log("[REVIEW] Starting session with cardMode:", cardMode);
      const response = await sessionService.startSession({
        sectionIds: selectedSections,
        cardMode,
      });

      console.log("[REVIEW] Session created, response:", response.data.data.session);
      // STORE THE SESSION DATA FOR ACTIVE SESSION
      setActiveSession(response.data.data.session);

      // Navigate to active session page
      navigate("/session/start");
    } catch (error) {
      console.error("Failed to start session:", error);
      alert(
        "Failed to start session: " +
          (error.response?.data?.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-session-page">
      <h1>Start Revision Session</h1>

      <div className="mode-selection">
        <h2>Select Session Type</h2>
        <div className="mode-options">
          {[
            { value: "review", label: "Review Session", description: "Smart spaced repetition review with confidence-based scheduling" },
            { value: "elimination", label: "Elimination Mode", description: "Eliminate questions you know well to focus on what needs practice" }
          ].map((type) => (
            <div
              key={type.value}
              className={`mode-card ${flipped === type.value ? "flipped" : ""}`}
            >
              <div className="mode-card-front">
                <label className="mode-option">
                  <input
                    type="radio"
                    value={type.value}
                    checked={sessionType === type.value}
                    onChange={(e) => setSessionType(e.target.value)}
                  />
                  <span>{type.label}</span>
                 
                  <FaQuestionCircle
                    className="question-icon"
                    onClick={() => setFlipped(flipped === type.value ? null : type.value)}
                  />
                </label>
              </div>

              <div className="mode-card-back">
                <div className="mode-description">
                  <h3>{type.label}</h3>
                  <p>{type.description}</p>
                  <button onClick={() => setFlipped(null)}>Close</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {sessionType === "review" && (
        <div className="mode-selection">
          <h2>Select Card Style</h2>
        <div className="mode-options">
          {["normal", "flashcard"].map((cardModeName) => (
            <div
              key={cardModeName}
              className={`mode-card ${flipped === cardModeName ? "flipped" : ""}`}
            >
              <div className="mode-card-front">
                <label className="mode-option">
                  <input
                    type="radio"
                    value={cardModeName}
                    checked={cardMode === cardModeName}
                    onChange={(e) => setCardMode(e.target.value)}
                  />
                  <span>{cardModeName === "normal" ? "Normal Cards" : "Flashcard Style"}</span>
                 
                  <FaQuestionCircle
                    className="question-icon"
                    onClick={() => setFlipped(flipped === cardModeName ? null : cardModeName)}
                  />
                </label>
              </div>

              <div className="mode-card-back">
                <div className="mode-description">
                  <h3>{cardModeName === "normal" ? "Normal Cards" : "Flashcard Style"}</h3>
                  <p>
                    {cardModeName === "normal"
                      ? "Traditional question and answer format with swipe gestures."
                      : "Interactive flip cards with keyboard shortcuts."}
                  </p>
                  <button onClick={() => setFlipped(null)}>Close</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      <div className="section-selection">
        <h2>Select Sections</h2>
        <div className="sections-grid">
          {sections.map((section) => (
            <div
              key={section._id}
              className={`section-card ${
                selectedSections.includes(section._id) ? "selected" : ""
              }`}
              onClick={() => toggleSection(section._id)}
              style={{ 
                borderLeftColor: section.color,
                background: `linear-gradient(135deg, 
                  ${hexToRgba(section.color, 0.2)}, 
                  ${hexToRgba(section.color, 0.1)})`
              }}
            >
              <h3>{section.name}</h3>
              <p>{section.description}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        className="start-button"
        onClick={startSession}
        disabled={loading || selectedSections.length === 0}
      >
        {loading
          ? "Starting Session..."
          : `Start Session (${selectedSections.length} sections)`}
      </button>
    </div>
  );
};

export default ReviewSessionPage;
