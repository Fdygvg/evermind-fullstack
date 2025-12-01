import React from "react";
import { Link } from "react-router-dom";
import { FaBrain } from "react-icons/fa";


const NotFound = () => {
  return (
    <div className="xmas404-page">
      <div className="xmas404-snow"></div>

      <div className="xmas404-card">
        <FaBrain className="xmas404-icon" aria-hidden="true" />

        <h1>Page Lost in the Winter Cortex</h1>

        <p>
          Looks like this memory got buried under a snowstorm.  
          Let’s reroute those neurons back to somewhere real.
        </p>

        <div className="xmas404-actions">
          <Link to="/dashboard" className="xmas404-btn primary">
            🎄 Dashboard
          </Link>

          <Link to="/login" className="xmas404-btn secondary">
            🧠 Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
