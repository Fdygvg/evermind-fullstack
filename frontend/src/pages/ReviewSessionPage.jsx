import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sectionService } from "../services/sections";
import { sessionService } from "../services/sessions";
import { useSession } from '../hooks/useSession'

const ReviewSessionPage = () => {
  const [sections, setSections] = useState([]);
  const [selectedSections, setSelectedSections] = useState([]);
  const [mode, setMode] = useState("buffer");
  const [loading, setLoading] = useState(false);
  
  const { setActiveSession } = useSession()
  const navigate = useNavigate();

  useEffect(() => {
    loadSections();
  }, []);

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
      const response = await sessionService.startSession({
        sectionIds: selectedSections,
        mode,
      });

      // STORE THE SESSION DATA FOR ACTIVE SESSION
      setActiveSession(response.data.data.session);

      // Navigate to active session page
      navigate("/session/active");
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
        <h2>Select Mode</h2>
        <div className="mode-options">
          <label className="mode-option">
            <input
              type="radio"
              value="buffer"
              checked={mode === "buffer"}
              onChange={(e) => setMode(e.target.value)}
            />
            <span>Buffer Mode</span>
            <small>Wrong answers reappear after other questions</small>
          </label>

          <label className="mode-option">
            <input
              type="radio"
              value="random"
              checked={mode === "random"}
              onChange={(e) => setMode(e.target.value)}
            />
            <span>Random Mode</span>
            <small>Wrong answers reappear randomly</small>
          </label>
        </div>
      </div>

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
              style={{ borderLeftColor: section.color }}
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
