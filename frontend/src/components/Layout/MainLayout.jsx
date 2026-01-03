import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Footer only visible on Dashboard (HomePage is outside MainLayout)
  const showFooter = currentPath === '/dashboard';

  // Navbar hidden on specific review pages
  const hideNavbarPaths = ['/session/start', '/elimination', '/tiktok-review'];
  const showNavbar = !hideNavbarPaths.includes(currentPath);

  return (
    <div className="app-shell">
      {showNavbar && <Navbar />}
      <main className="app-content">
        <Outlet />
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default MainLayout;

