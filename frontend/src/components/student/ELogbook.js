import React, { useState } from 'react';
import StatusNotice from '../common/StatusNotice';

import { API_BASE } from '../../api';

const ELogbook = ({ indexNumber }) => {
  const [notice, setNotice] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [weekData, setWeekData] = useState({
    1: {
      Monday: { job: '', skill: '' },
      Tuesday: { job: '', skill: '' },
      Wednesday: { job: '', skill: '' },
      Thursday: { job: '', skill: '' },
      Friday: { job: '', skill: '' }
    }
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const MAX_WEEKS = 12; // Maximum number of weeks

  const handleInputChange = (day, field, value) => {
    setWeekData({
      ...weekData,
      [currentWeek]: {
        ...weekData[currentWeek],
        [day]: {
          ...weekData[currentWeek][day],
          [field]: value
        }
      }
    });
  };

  const goToPreviousWeek = () => {
    if (currentWeek > 1) {
      setCurrentWeek(currentWeek - 1);
    }
  };

  const goToNextWeek = () => {
    if (currentWeek >= MAX_WEEKS) {
      setNotice({
        type: 'error',
        message: 'You have reached the maximum number of weeks (12). Industrial attachment period is complete.',
      });
      return;
    }
    
    const nextWeek = currentWeek + 1;
    if (!weekData[nextWeek]) {
      setWeekData({
        ...weekData,
        [nextWeek]: {
          Monday: { job: '', skill: '' },
          Tuesday: { job: '', skill: '' },
          Wednesday: { job: '', skill: '' },
          Thursday: { job: '', skill: '' },
          Friday: { job: '', skill: '' }
        }
      });
    }
    setCurrentWeek(nextWeek);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/student/logbook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          indexNumber,
          weekNumber: currentWeek,
          weekData: weekData[currentWeek],
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to save logbook');
      }

      setNotice({ type: 'success', message: 'Week ' + currentWeek + ' logbook saved successfully!' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'An error occurred while saving the logbook.' });
    }
  };

  return (
    <div>
      <div className="page-header">E-LOGBOOK</div>
      <StatusNotice notice={notice} onDismiss={() => setNotice(null)} />
      
      <div className="logbook-week">
        <div className="week-header">
          <h3>Week {currentWeek} of {MAX_WEEKS}</h3>
          <div className="week-navigation">
            <button
              className="btn btn-primary"
              onClick={goToPreviousWeek}
              disabled={currentWeek === 1}
              style={{opacity: currentWeek === 1 ? 0.5 : 1}}
            >
              ← PREVIOUS
            </button>
            <button
              className="btn btn-warning"
              onClick={goToNextWeek}
              disabled={currentWeek >= MAX_WEEKS}
              style={{opacity: currentWeek >= MAX_WEEKS ? 0.5 : 1}}
            >
              NEXT →
            </button>
          </div>
        </div>
        
        {currentWeek === MAX_WEEKS && (
          <div style={{
            background: '#fff3cd',
            border: '1px solid #0a0a0a',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#0a0a0a'
          }}>
            <strong>⚠️ Final Week:</strong> This is the last week of your industrial attachment. 
            Make sure all entries are complete before submission.
          </div>
        )}
        
        <table className="logbook-table">
          <thead>
            <tr>
              <th style={{width: '15%'}}>Day</th>
              <th style={{width: '50%'}}>Job Assigned To Student</th>
              <th style={{width: '35%'}}>Special Skill Acquired</th>
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <tr key={day}>
                <td><strong>{day}</strong></td>
                <td>
                  <textarea
                    placeholder={`Enter job assigned on ${day}`}
                    value={weekData[currentWeek][day].job}
                    onChange={(e) => handleInputChange(day, 'job', e.target.value)}
                    rows="3"
                  />
                </td>
                <td>
                  <textarea
                    placeholder={`Enter skills acquired on ${day}`}
                    value={weekData[currentWeek][day].skill}
                    onChange={(e) => handleInputChange(day, 'skill', e.target.value)}
                    rows="3"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="text-center mt-20">
          <button className="btn btn-success" onClick={handleSubmit}>
            SAVE WEEK {currentWeek}
          </button>
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
        E-Logbook section • Week {currentWeek}/{MAX_WEEKS}
      </div>
    </div>
  );
};

export default ELogbook;