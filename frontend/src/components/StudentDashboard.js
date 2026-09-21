import React, { useState } from 'react';
import AssumptionOfDuty from './student/AssumptionOfDuty';
import ELogbook from './student/ELogbook';
import SubmitReport from './student/SubmitReport';
import AIFAQChatbot from './common/AIFAQChatbot';

const StudentDashboard = ({ user, onLogout }) => {
  const [activePage, setActivePage] = useState('instructions');

  const renderPage = () => {
    switch(activePage) {
      case 'instructions':
        return (
          <div>
            <div className="page-header">INSTRUCTIONS</div>
            <div style={{background: '#fff', padding: '30px', borderRadius: '8px'}}>
              <h2 style={{color: '#4CAF50', marginBottom: '20px'}}>Welcome to Industrial Attachment Management System</h2>
              <div style={{lineHeight: '1.8'}}>
                <h3 style={{color: '#02061f', marginTop: '20px', marginBottom: '10px'}}>Student Guidelines:</h3>
                <ol style={{paddingLeft: '20px'}}>
                  <li>Submit your Assumption of Duty (registration) form within the first week</li>
                  <li>Update your E-Logbook weekly with your activities and skills acquired</li>
                  <li>Ensure your company supervisor evaluates your performance</li>
                  <li>Submit your final report before the deadline</li>
                </ol>
                
                <h3 style={{color: '#02061', marginTop: '30px', marginBottom: '10px'}}>Important Notes:</h3>
                <ul style={{paddingLeft: '20px'}}>
                  <li>All forms must be filled accurately and completely</li>
                  <li>Your E-Logbook should be updated every week</li>
                  <li>Maintain professional communication with your supervisors</li>
                  <li>Report any issues to the University supervisor immediately</li>
                  <li>Your final report should be in Microsoft Word format with your Registration number as the filename</li>
                </ul>
                
                <div style={{background: '#E8F5E9', padding: '15px', marginTop: '30px', borderRadius: '5px', borderLeft: '4px solid #4CAF50'}}>
                  <strong>Need Help?</strong> Contact your University supervisor or the Industrial Attachment coordinator.
                </div>
              </div>
            </div>
          </div>
        );
      case 'assumption':
        return <AssumptionOfDuty indexNumber={user.username} />;
      case 'logbook':
        return <ELogbook indexNumber={user.username} />;
      case 'report':
        return <SubmitReport indexNumber={user.username} />;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div>
      <div className="header" style={{
        background: 'linear-gradient(135deg, #070707 0%, #012c08 50%, #4CAF50 100%)',
        color: 'white',
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img 
            src="/logo.png" 
            alt="MUT Logo" 
            style={{ 
              width: '60px', 
              height: '60px', 
              objectFit: 'contain',
              background: 'white',
              padding: '5px',
              borderRadius: '50%',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
            onError={(e) => {
              e.target.outerHTML = '<div style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; background: white; color: #3f51b5; border-radius: 50%; font-weight: bold; font-size: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">MUT</div>';
            }}
          />
          <div>
            <h1>MUT IAMS</h1>
            <p>Industrial Attachment Management System</p>
          </div>
        </div>
        <div className="welcome-user">Welcome, {user.username}</div>
      </div>
      
      <div className="dashboard-container">
        <div className="sidebar">
          <ul className="sidebar-menu">
            <li>
              <button
                className={activePage === 'instructions' ? 'active' : ''}
                onClick={() => setActivePage('instructions')}
              >
                Instructions
              </button>
            </li>
            <li>
              <button
                className={activePage === 'assumption' ? 'active' : ''}
                onClick={() => setActivePage('assumption')}
              >
                Submit Assumption
              </button>
            </li>
            <li>
              <button
                className={activePage === 'logbook' ? 'active' : ''}
                onClick={() => setActivePage('logbook')}
              >
                E-Logbook
              </button>
            </li>
            <li>
              <button
                className={activePage === 'report' ? 'active' : ''}
                onClick={() => setActivePage('report')}
              >
                Submit Report
              </button>
            </li>
            <li>
              <button onClick={onLogout}>
                Logout
              </button>
            </li>
          </ul>
        </div>
        
        <div className="main-content">
          {renderPage()}
        </div>
      </div>
      <AIFAQChatbot role="student" />
    </div>
  );
};

export default StudentDashboard;