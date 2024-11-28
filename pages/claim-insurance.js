import { useState, useRef } from 'react';
import { useRouter } from 'next/router';

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Please select at least one file');
      return;
    }

    try {
      router.push('/loading');
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div className="container">
      <div className="upload-box">
        <h1 className="title">Document Upload</h1>
        <div 
          className={`dropzone ${dragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="file-input"
            onChange={handleFileSelect}
            multiple
            hidden
          />
          <div className="upload-icon"></div>
          <p className="upload-text">
            Drag and drop files here <br />
            or click to browse
          </p>
        </div>

        {files.length > 0 && (
          <div className="file-list">
            <h3 className="file-list-title">Selected Files</h3>
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <span className="file-name">{file.name}</span>
                <span className="file-size">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
                <button 
                  onClick={() => removeFile(index)}
                  className="remove-button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={handleUpload}
          className="upload-button"
          disabled={files.length === 0}
        >
          Upload Files
        </button>
      </div>
    </div>
  );
}