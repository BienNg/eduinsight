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
    <div className="google-sheets-import" style={{ marginTop: '20px' }}>
      <h4>Import from Google Sheets</h4>
      <p>Enter a Google Sheets URL to import data directly.</p>
      <p className="text-info">
        <small>Note: For multiple sheets, the document name should include group info (e.g., "G1 Online DE")</small>
      </p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          style={{ 
            flex: 1, 
            padding: '8px 12px', 
            borderRadius: '4px',
            border: '1px solid #ccc' 
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px 16px',
            borderRadius: '4px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            cursor: loading ? 'wait' : 'pointer'
          }}
        >
          {loading ? 'Processing...' : 'Import'}
        </button>
      </form>
    </div>
  );
};

export default GoogleSheetsImport;