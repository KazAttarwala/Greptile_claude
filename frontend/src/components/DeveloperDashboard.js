// src/components/DeveloperDashboard.js
import React, { useState, useEffect } from 'react';
import ChangelogForm from './ChangelogForm';
import ChangelogPreview from './ChangelogPreview';
import ChangelogList from './ChangelogList';
import './DeveloperDashboard.css';

function DeveloperDashboard() {
  const [changelogs, setChangelogs] = useState([]);
  const [selectedChangelog, setSelectedChangelog] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchChangelogs();
  }, []);

  const fetchChangelogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/changelogs/');
      const data = await response.json();
      setChangelogs(data);
    } catch (error) {
      console.error('Error fetching changelogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateChangelog = async (changelogData) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/changelogs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changelogData),
      });

      if (!response.ok) {
        throw new Error('Failed to create changelog');
      }

      const newChangelog = await response.json();
      setChangelogs([newChangelog, ...changelogs]);
      setSelectedChangelog(newChangelog);
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating changelog:', error);
      alert('Failed to create changelog. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateChangelog = async (id, changelogData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/changelogs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changelogData),
      });

      if (!response.ok) {
        throw new Error('Failed to update changelog');
      }
      
      const updatedChangelog = await response.json();
      setChangelogs(changelogs.map(cl => cl.id === id ? updatedChangelog : cl));
      setSelectedChangelog(updatedChangelog);
    } catch (error) {
      console.error('Error updating changelog:', error);
      alert('Failed to update changelog. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishChangelog = async (id, publishState) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/changelogs/${id}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ published: publishState }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update publish status');
      }
      
      const updatedChangelog = await response.json();
      setChangelogs(changelogs.map(cl => cl.id === id ? updatedChangelog : cl));
      setSelectedChangelog(updatedChangelog);
    } catch (error) {
      console.error('Error updating publish status:', error);
      alert('Failed to update publish status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChangelog = async (id) => {
    if (!window.confirm('Are you sure you want to delete this changelog?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/changelogs/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete changelog');
      }
      
      setChangelogs(changelogs.filter(cl => cl.id !== id));
      if (selectedChangelog && selectedChangelog.id === id) {
        setSelectedChangelog(null);
      }
    } catch (error) {
      console.error('Error deleting changelog:', error);
      alert('Failed to delete changelog. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dev-dashboard">
      <div className="dashboard-header">
        <h2>Developer Dashboard</h2>
        <button 
          className="new-changelog-btn"
          onClick={() => {
            setIsCreating(true);
            setSelectedChangelog(null);
          }}
        >
          New Changelog
        </button>
      </div>
      
      {isLoading && <div className="loading-indicator">Loading...</div>}
      
      <div className="dashboard-content">
        <div className="sidebar">
          <ChangelogList 
            changelogs={changelogs}
            selectedId={selectedChangelog?.id}
            onSelect={(changelog) => {
              setSelectedChangelog(changelog);
              setIsCreating(false);
            }}
          />
        </div>

        <div className="main-content">
          {isCreating ? (
            <div className="editor-section">
              <h3>Create New Changelog</h3>
              <ChangelogForm onSubmit={handleCreateChangelog} />
            </div>
          ) : selectedChangelog ? (
            <div className="editor-section">
              <div className="editor-header">
                <h3>Edit Changelog</h3>
                <div className="editor-actions">
                  <button 
                    className={`publish-btn ${selectedChangelog.published ? 'unpublish' : 'publish'}`}
                    onClick={() => handlePublishChangelog(selectedChangelog.id, !selectedChangelog.published)}
                  >
                    {selectedChangelog.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteChangelog(selectedChangelog.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <ChangelogForm
                initialData={{
                  version: selectedChangelog.version,
                  title: selectedChangelog.title,
                  description: selectedChangelog.description,
                  git_diff: selectedChangelog.raw_git_diff,
                }}
                onSubmit={(data) => handleUpdateChangelog(selectedChangelog.id, data)}
              />
              <ChangelogPreview
                title={selectedChangelog.title}
                version={selectedChangelog.version}
                content={selectedChangelog.generated_content}
              />
            </div>
          ) : (
            <div className="empty-state">
              <p>Select a changelog to edit or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeveloperDashboard;