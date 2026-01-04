import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/logo.png';
import '../css/navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navbarRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <header className="navbar" ref={navbarRef}>
      <div className="navbar-brand">
        <Link to="/dashboard" className="navbar-logo">
          <img src={logo} alt="Evermind Logo" className="navbar-logo-icon" />
          <span className="navbar-logo-text">
            {"EVERMIND".split("").map((letter, index) => (
              <span
                key={index}
                className="breathe-letter"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {letter}
              </span>
            ))}
          </span>
        </Link>
      </div>

      <button
        className={`navbar-toggle ${menuOpen ? 'active' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
      >
        <span className="hamburger"></span>
      </button>

      <nav className={`navbar-links ${menuOpen ? 'active' : ''}`}>
        <NavLink to="/dashboard" className="navbar-link" onClick={handleLinkClick}>
          Dashboard
        </NavLink>
        <NavLink to="/session/review" className="navbar-link" onClick={handleLinkClick}>
          Sessions
        </NavLink>
        <NavLink to="/sections" className="navbar-link" onClick={handleLinkClick}>
          Sections
        </NavLink>
        <NavLink to="/settings" className="navbar-link" onClick={handleLinkClick}>
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
