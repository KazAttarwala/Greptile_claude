// src/components/ChangelogPreview.js
import React from 'react';
import ReactMarkdown from 'react-markdown';
import './ChangelogPreview.css';

function ChangelogPreview({ title, version, content }) {
  return (
    <div className="changelog-preview">
      <h3>Preview</h3>
      <div className="preview-header">
        <h2>{title} <span className="version">v{version}</span></h2>
      </div>
      <div className="preview-content">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

export default ChangelogPreview;