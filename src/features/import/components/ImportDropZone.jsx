// src/features/import/components/ImportDropZone.jsx
import { useState, useRef } from 'react';

const ImportDropZone = ({ onFilesAdded }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      onFilesAdded(selectedFiles);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      onFilesAdded(droppedFiles);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div
      className="drag-drop-area"
      style={{
        border: `2px dashed ${dragActive ? '#1e88e5' : '#ccc'}`,
        borderRadius: '4px',
        padding: '40px 20px',
        textAlign: 'center',
        marginTop: '20px',
        backgroundColor: dragActive ? 'rgba(30, 136, 229, 0.05)' : '#f9f9f9',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onClick={triggerFileInput}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx, .xls, .csv"
        onChange={handleFileChange}
        multiple
        style={{ display: 'none' }}
      />

      <div style={{ marginBottom: '10px' }}>
        <svg
          width="50"
          height="50"
          viewBox="0 0 24 24"
          fill="none"
          stroke={dragActive ? '#1e88e5' : '#666'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
      </div>

      <p><strong>Drag and drop</strong> your Excel files here</p>
      <p>or click to browse files</p>
    </div>
  );
};

export default ImportDropZone;