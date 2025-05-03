// src/features/import/components/GoogleSheetsImport.jsx
import { useState } from 'react';

const GoogleSheetsImport = ({ onSheetSubmitted }) => {
    const [sheetsUrl, setSheetsUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!sheetsUrl) {
            setError('Please enter a Google Sheets URL');
            return;
        }

        // Validate URL format
        if (!isValidGoogleSheetsUrl(sheetsUrl)) {
            setError('Please enter a valid Google Sheets URL');
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            const sheetId = getSheetId(sheetsUrl);
            let filename = `GoogleSheet_${sheetId}.xlsx`; // Default fallback
            
            try {
                // Try to fetch the HTML page to extract the title
                const htmlResponse = await fetch(sheetsUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/html',
                    },
                    // Required to avoid CORS issues
                    mode: 'cors',
                });
                
                if (htmlResponse.ok) {
                    const htmlContent = await htmlResponse.text();
                    // Extract title from HTML content
                    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
                    if (titleMatch && titleMatch[1]) {
                        // Clean up the title (remove " - Google Sheets" part)
                        let sheetTitle = titleMatch[1].replace(/ - Google Sheets$/, '');
                        // Ensure the filename ends with .xlsx
                        filename = sheetTitle.endsWith('.xlsx') ? sheetTitle : `${sheetTitle}.xlsx`;
                    }
                }
            } catch (titleError) {
                // If title extraction fails, continue with the default filename
                console.warn('Could not extract Google Sheet title:', titleError);
            }

            // Now fetch the actual sheet content
            const exportUrl = getExportUrl(sheetsUrl);
            const response = await fetch(exportUrl);

            if (!response.ok) {
                throw new Error('Unable to access this Google Sheet. Make sure it\'s shared with "Anyone with the link can view"');
            }

            // Get the array buffer from the response
            const arrayBuffer = await response.arrayBuffer();

            // Pass the data to parent component for processing
            await onSheetSubmitted(arrayBuffer, filename);

            setSheetsUrl('');
        } catch (err) {
            setError(err.message || 'Failed to import Google Sheet');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValidGoogleSheetsUrl = (url) => {
        return /https:\/\/(docs\.google\.com\/spreadsheets|sheets\.google\.com)/.test(url);
    };

    const getSheetId = (url) => {
        const regex = /\/d\/([a-zA-Z0-9-_]+)/;
        const match = url.match(regex);
        return match ? match[1] : '';
    };

    const getExportUrl = (url) => {
        const sheetId = getSheetId(url);
        return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
    };

    return (
        <div style={{
            marginTop: '20px',
            padding: '15px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            backgroundColor: '#f9f9f9'
        }}>
            <h4 style={{ marginTop: 0 }}>Import from Google Sheets</h4>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <input
                        type="text"
                        value={sheetsUrl}
                        onChange={(e) => setSheetsUrl(e.target.value)}
                        placeholder="Paste Google Sheets URL here"
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: error ? '1px solid #c62828' : '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                        disabled={isSubmitting}
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            marginLeft: '10px',
                            padding: '10px 15px',
                            backgroundColor: '#1e88e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {isSubmitting ? 'Importing...' : 'Import'}
                    </button>
                </div>
                {error && (
                    <p style={{ color: '#c62828', fontSize: '14px', marginTop: '5px' }}>
                        {error}
                    </p>
                )}
            </form>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '10px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>Instructions:</p>
                <ol style={{ margin: '0', paddingLeft: '20px' }}>
                    <li><strong>Important:</strong> Your Google Sheet must be named following the format: <code>G1 B1.2 Online</code></li>
                    <li>Must include: Group code (G1, A2, etc.), Level (A1, B2.1, etc.), and Mode (Online/Offline)</li>
                    <li>Open your Google Sheet</li>
                    <li>Click "Share" in the top right corner</li>
                    <li>Set access to "Anyone with the link can view"</li>
                    <li>Copy the URL and paste it above</li>
                </ol>
            </div>
        </div>
    );
};

export default GoogleSheetsImport;