// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DeveloperDashboard from './components/DeveloperDashboard';
import PublicChangelog from './components/PublicChangelog';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <div className="content">
          <Routes>
            <Route path="/dev" element={<DeveloperDashboard />} />
            <Route path="/" element={<PublicChangelog />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;