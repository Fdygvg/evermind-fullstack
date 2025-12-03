import React from 'react';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <p className="footer-text">
          © {new Date().getFullYear()} EVERMIND. Train smarter, remember longer.
        </p>
        <div className="footer-links">
          <a href="mailto:evermind@gmail.com" className="footer-link">Contact</a>
          <a href="#" className="footer-link">Privacy</a>
          <a href="#" className="footer-link">Changelog</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
