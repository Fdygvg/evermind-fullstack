import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="nav-shell">
      <div className="nav-brand">
        <Link to="/dashboard" className="nav-logo">
          EVERMIND
        </Link>
        <span className="nav-tagline">memory, but upgraded</span>
      </div>
      <nav className="nav-links">
        <NavLink to="/dashboard" className="nav-link">
          Dashboard
        </NavLink>
        <NavLink to="/sessions/review" className="nav-link">
          Sessions
        </NavLink>
        <NavLink to="/sections" className="nav-link">
          Sections
        </NavLink>
      </nav>
      <div className="nav-user">
        {user ? (
          <>
            {!user.isVerified && (
              <Link to="/verify-email" className="nav-pill">
                Verify email
              </Link>
            )}
            <span className="nav-username">{user.username || user.email}</span>
            <button type="button" className="nav-button" onClick={logout}>
              Log out
            </button>
          </>
        ) : (
          <Link to="/login" className="nav-button ghost">
            Log in
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;

