// src/components/Navigation.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navigation() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="logo">
        <h1>ChangelogAI</h1>
      </div>
      <div className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Public Changelog
        </Link>
        <Link to="/dev" className={location.pathname === '/dev' ? 'active' : ''}>
          Developer Dashboard
        </Link>
      </div>
    </nav>
  );
}

export default Navigation;