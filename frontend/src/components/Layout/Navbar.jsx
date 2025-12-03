import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard" className="navbar-logo">
          EVERMIND
        </Link>
        <span className="navbar-tagline">memory, but upgraded</span>
      </div>

      <button
        className="navbar-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation"
      >
        <span className="hamburger"></span>
      </button>

      <nav className={`navbar-links ${menuOpen ? 'active' : ''}`}>
        <NavLink to="/dashboard" className="navbar-link">
          Dashboard
        </NavLink>
        <NavLink to="/session/review" className="navbar-link">
          Sessions
        </NavLink>
        <NavLink to="/sections" className="navbar-link">
          Sections
        </NavLink>
        <NavLink to="/settings" className="navbar-link">
          Settings
        </NavLink>
      </nav>

      <div className="navbar-user">
        {user ? (
          <>
            {!user.isVerified && (
              <Link to="/verify-email" className="navbar-pill">
                Verify email
              </Link>
            )}
            <span className="navbar-username">{user.username || user.email}</span>
            <button className="navbar-button" onClick={logout}>
              Log out
            </button>
          </>
        ) : (
          <Link to="/login" className="navbar-button ghost">
            Log in
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;
