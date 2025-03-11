// src/components/ChangelogForm.js
import React, { useState } from 'react';
import './ChangelogForm.css';

function ChangelogForm({ initialData = {}, onSubmit }) {
  const [formData, setFormData] = useState({
    version: initialData.version || '',
    title: initialData.title || '',
    description: initialData.description || '',
    git_diff: initialData.git_diff || '',
  });

  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.version.trim()) {
      newErrors.version = 'Version is required';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form className="changelog-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="version">Version *</label>
        <input
          type="text"
          id="version"
          name="version"
          value={formData.version}
          onChange={handleChange}
          placeholder="e.g., 1.0.0"
          className={errors.version ? 'error' : ''}
        />
        {errors.version && <div className="error-message">{errors.version}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., March Feature Release"
          className={errors.title ? 'error' : ''}
        />
        {errors.title && <div className="error-message">{errors.title}</div>}
      </div>
      
      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief description of this release (optional)"
          rows="3"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="git_diff">Git Diff (Optional)</label>
        <div className="git-diff-input-container">
          <textarea
            id="git_diff"
            name="git_diff"
            value={formData.git_diff}
            onChange={handleChange}
            placeholder="Paste git diff content to help the AI generate a better changelog..."
            rows="8"
            className="git-diff-input"
          />
        </div>
        <div className="help-text">
          Paste your git diff to help the AI understand the changes. This significantly improves the quality of the generated changelog.
        </div>
      </div>

      <button type="submit" className="submit-btn">
        Generate Changelog
      </button>
    </form>
  );
}

export default ChangelogForm;