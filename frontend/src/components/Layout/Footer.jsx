import React from 'react';

const Footer = () => {
  return (
    <footer className="site-footer">
      <p>© {new Date().getFullYear()} EVERMIND. Train smarter, remember longer.</p>
      <div className="footer-links">
        <a href="mailto:hello@evermind.ai">Contact</a>
        <a href="#">Privacy</a>
        <a href="#">Changelog</a>
      </div>
    </footer>
  );
};

export default Footer;

