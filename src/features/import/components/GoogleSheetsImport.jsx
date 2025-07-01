// src/features/import/components/GoogleSheetsImport.jsx
import { useState } from 'react';
import { toast } from 'sonner';

const GoogleSheetsImport = ({ onSheetSubmitted }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url || !url.includes('docs.google.com/spreadsheets')) {
      toast.error('Please enter a valid Google Sheets URL');
      return;
    }
    
    setLoading(true);
    
    try {
      await onSheetSubmitted(url);
      setUrl('');
      toast.success('Google Sheet added to queue');
    } catch (error) {
      toast.error(`Error adding Google Sheet: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="google-sheets-primary">
      <div className="google-sheets-content">
        <p style={{ 
          color: 'var(--import-text-light)', 
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.5'
        }}>
          Paste your Google Sheets URL below. Make sure the sheet is publicly accessible or shared with view permissions.
          This method keeps your data synchronized and allows for real-time updates.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="sheets-primary-input-container">
            <div className="sheets-input-wrapper">
              <div className="sheets-input-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                  <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H6.5C3.46 7 1 9.46 1 12.5S3.46 18 6.5 18H10v-2.1H6.5c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9.5-6H14v1.9h3.5c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1H14V18h3.5c3.04 0 5.5-2.46 5.5-5.5S20.54 7 17.5 7z"/>
                </svg>
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="sheets-primary-input"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url}
              className="sheets-primary-btn"
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                    <circle cx="12" cy="12" r="10"/>
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
                  Processing...
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Import Sheet
                </div>
              )}
            </button>
          </div>
        </form>

        <div className="google-sheets-benefits">
          <div className="benefit-item">
            <div className="benefit-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <div className="benefit-text">
              <strong>Real-time Sync</strong>
              <small>Changes in Google Sheets automatically sync to your courses</small>
            </div>
          </div>
          
          <div className="benefit-item">
            <div className="benefit-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                <path d="m9 14 2 2 4-4"/>
              </svg>
            </div>
            <div className="benefit-text">
              <strong>Multi-Sheet Support</strong>
              <small>Import multiple courses from one Google Sheets document</small>
            </div>
          </div>
          
          <div className="benefit-item">
            <div className="benefit-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="benefit-text">
              <strong>Live Updates</strong>
              <small>Course data stays current with teacher schedule changes</small>
            </div>
          </div>
        </div>

        <div className="google-sheets-tip">
          <div className="tip-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <path d="M12 17h.01"/>
            </svg>
          </div>
          <div className="tip-content">
            <strong>Pro tip:</strong> For multiple sheets, name your document with group info like "G1 Online DE" to automatically extract group and language information.
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleSheetsImport;