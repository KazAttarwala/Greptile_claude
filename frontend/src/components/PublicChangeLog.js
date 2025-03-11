// src/components/PublicChangelog.js
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './PublicChangelog.css';

function PublicChangelog() {
  const [changelogs, setChangelogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPublishedChangelogs();
  }, []);

  const fetchPublishedChangelogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/changelogs/?published_only=true');
      const data = await response.json();
      setChangelogs(data);
    } catch (error) {
      console.error('Error fetching published changelogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="public-changelog">
      <div className="public-header">
        <h1>Product Changelog</h1>
        <p className="subtitle">Stay up to date with the latest features and improvements</p>
      </div>

      {isLoading ? (
        <div className="loading">Loading changelogs...</div>
      ) : changelogs.length === 0 ? (
        <div className="empty-changelog">
          <p>No changelogs have been published yet.</p>
        </div>
      ) : (
        <div className="changelog-entries">
          {changelogs.map(changelog => (
            <div key={changelog.id} className="changelog-entry">
              <div className="entry-header">
                <h2>{changelog.title} <span className="version">v{changelog.version}</span></h2>
                <div className="entry-date">
                  {new Date(changelog.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="entry-content">
                <ReactMarkdown>{changelog.generated_content}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PublicChangelog;