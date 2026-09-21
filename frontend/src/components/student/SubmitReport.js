import React, { useState } from 'react';
import StatusNotice from '../common/StatusNotice';

import { API_BASE } from '../../api';

const SubmitReport = ({ indexNumber }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [notice, setNotice] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is .doc or .docx
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
        setSelectedFile(file);
        setNotice(null);
      } else {
        setNotice({ type: 'error', message: 'Please select a Microsoft Word document (.doc or .docx)' });
        e.target.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setNotice({ type: 'error', message: 'Please select a file first' });
      return;
    }

    if (!indexNumber) {
      setNotice({ type: 'error', message: 'Missing registration number. Please sign in again.' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('indexNumber', indexNumber);

      const response = await fetch(`${API_BASE}/api/student/report`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload report');
      }

      setNotice({ type: 'success', message: 'Report uploaded successfully!' });
      setSelectedFile(null);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'An error occurred while uploading the report.' });
    }
  };

  return (
    <div>
      <div className="page-header">SUBMIT REPORT</div>
      <StatusNotice notice={notice} onDismiss={() => setNotice(null)} />
      
      <div className="upload-section">
        <h2>Upload Report</h2>
        
        <div className="upload-area">
          <input
            type="file"
            accept=".doc,.docx"
            onChange={handleFileChange}
            style={{display: 'none'}}
            id="fileInput"
          />
          <label htmlFor="fileInput" style={{cursor: 'pointer'}}>
            <div style={{
              padding: '20px',
              border: '2px dashed #ccc',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}>
              <svg
                style={{width: '48px', height: '48px', margin: '0 auto', display: 'block', fill: '#999'}}
                viewBox="0 0 24 24"
              >
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,19L8,15H10.5V12H13.5V15H16L12,19Z" />
              </svg>
              <p style={{marginTop: '15px', color: '#666'}}>
                {selectedFile ? selectedFile.name : 'Choose Files'}
              </p>
              <p style={{fontSize: '12px', color: '#999', marginTop: '5px'}}>
                No file chosen
              </p>
            </div>
          </label>
        </div>
        
        <button
          className="upload-btn"
          onClick={handleUpload}
        >
          Upload
        </button>
        
        <div className="upload-note">
          Please Ensure That your report is in a Microsoft Word format with your registration number as its name before uploading it
        </div>
        
        <div className="upload-warning">
          Any work not in Microsoft Word format would be discarded
        </div>
      </div>
      
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#4CAF50',
        color: 'white',
        padding: '12px 30px',
        borderRadius: '25px',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)'
      }}>
        Submit Report section
      </div>
    </div>
  );
};

export default SubmitReport;