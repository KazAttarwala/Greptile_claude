// src/components/ChangelogList.js
import React from 'react';
import './ChangelogList.css';

function ChangelogList({ changelogs, selectedId, onSelect }) {
  if (changelogs.length === 0) {
    return (
      <div className="empty-changelog-list">
        <p>No changelogs created yet</p>
      </div>
    );
  }

  return (
    <div className="changelog-list">
      <h3>Your Changelogs</h3>
      <ul>
        {changelogs.map(changelog => (
          <li
            key={changelog.id}
            className={`changelog-item ${selectedId === changelog.id ? 'selected' : ''} ${changelog.published ? 'published' : ''}`}
            onClick={() => onSelect(changelog)}
          >
            <div className="changelog-item-title">v{changelog.version} - {changelog.title}</div>
            <div className="changelog-item-meta">
              <span className="changelog-date">
                {new Date(changelog.created_at).toLocaleDateString()}
              </span>
              {changelog.published && <span className="publish-badge">Published</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChangelogList;