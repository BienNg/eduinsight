import { useState, useRef, useEffect } from 'react';

const ModernDropZone = ({ onFilesAdded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, processing, success
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
  };

  const processFiles = (files) => {
    setUploadStatus('processing');
    
    // Add slight delay for visual feedback
    setTimeout(() => {
      onFilesAdded(files);
      setUploadStatus('success');
      
      // Create ripple effect
      createRippleEffect();
      
      // Reset to idle after success animation
      setTimeout(() => {
        setUploadStatus('idle');
      }, 2000);
    }, 300);
  };

  const createRippleEffect = () => {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.3);
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
      left: 50%;
      top: 50%;
      width: 100px;
      height: 100px;
      margin-left: -50px;
      margin-top: -50px;
    `;
    
    if (dropZoneRef.current) {
      dropZoneRef.current.appendChild(ripple);
      setTimeout(() => {
        if (dropZoneRef.current && ripple.parentNode) {
          dropZoneRef.current.removeChild(ripple);
        }
      }, 600);
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
      processFiles(droppedFiles);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Add CSS animation for ripple effect
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const getDropZoneClass = () => {
    let className = 'modern-drop-zone';
    if (dragActive) className += ' drag-active';
    if (uploadStatus === 'processing') className += ' processing';
    if (uploadStatus === 'success') className += ' success';
    return className;
  };

  const getUploadIcon = () => {
    if (uploadStatus === 'processing') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="m9 12 2 2 4-4"/>
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="1s"
            repeatCount="indefinite"
          />
        </svg>
      );
    }
    
    if (uploadStatus === 'success') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    );
  };

  const getDropZoneText = () => {
    if (uploadStatus === 'processing') {
      return {
        title: "Processing Files...",
        subtitle: "Validating and preparing your data"
      };
    }
    
    if (uploadStatus === 'success') {
      return {
        title: "Files Added!",
        subtitle: "Your files have been queued for import"
      };
    }

    if (dragActive) {
      return {
        title: "Drop Your Files Here",
        subtitle: "Release to start the magic ✨"
      };
    }

    return {
      title: "Upload Excel Files",
      subtitle: "Drag & drop or click to browse"
    };
  };

  const text = getDropZoneText();

  return (
    <div
      ref={dropZoneRef}
      className={getDropZoneClass()}
      onClick={triggerFileInput}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
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
        className="hidden-file-input"
      />

      <div className="upload-icon">
        {getUploadIcon()}
      </div>

      <h3 className="drop-zone-title">{text.title}</h3>
      <p className="drop-zone-subtitle">{text.subtitle}</p>

      <div className="drop-zone-hint">
        <strong>Supported formats:</strong> Excel (.xlsx, .xls) and CSV files
        <br />
        <strong>What happens next:</strong> We'll validate your data structure and extract course information automatically
      </div>
    </div>
  );
};

export default ModernDropZone; 