import React, { useState } from 'react';
import AIFAQChatbot from './common/AIFAQChatbot';
import StatusNotice from './common/StatusNotice';

import { API_BASE } from '../api';

const MAX_RAW = 45; // 9 graded items × max 5 points each
const MAX_SCORE = 80;

const UniversitySupervisorDashboard = ({ user, onLogout }) => {
  const [grades, setGrades] = useState({});
  const [indexNumber, setIndexNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const handleGradeChange = (key, value) => {
    setGrades(prev => ({ ...prev, [key]: Number(value) }));
  };

  // Scale raw score (0–45) to out of 80
  const rawScore = Object.values(grades).reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);
  const scaledScore = parseFloat(((rawScore / MAX_RAW) * MAX_SCORE).toFixed(2));

  const handleSubmit = async () => {
    if (!indexNumber) {
      setNotice({ type: 'error', message: 'Please enter the student registration number before submitting.' });
      return;
    }

    try {
      setNotice(null);
      setSubmitting(true);
      const response = await fetch(`${API_BASE}/api/grade/visiting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indexNumber,
          grades,
          totalScore: scaledScore, // submitted as a value out of 80
          remarks: '',
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit grading');
      }

      setNotice({ type: 'success', message: 'Grading submitted successfully!' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'An error occurred while submitting grading.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="header">
        <div className="header-left">
          <img src="/logo.png" alt="MUT Logo" className="logo" />
          <div className="system-title">
            <h1>MUT IAMS</h1>
            <p>Industrial Attachment Management System</p>
          </div>
        </div>
        <div className="welcome-user">Welcome, UNIVERSITY Supervisor</div>
      </div>

      <div className="dashboard-container">
        <div className="sidebar">
          <ul className="sidebar-menu">
            <li>
              <button className="active">
                Score Students
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
          <div className="page-header">UNIVERSITY SUPERVISOR - GRADE STUDENT</div>
          <StatusNotice notice={notice} onDismiss={() => setNotice(null)} />

          <div className="grading-section">
            <div className="grading-instructions">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Student Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. SC232/0001/2022"
                  value={indexNumber}
                  onChange={(e) => setIndexNumber(e.target.value)}
                />
              </div>
              <strong>DIRECTIONS:</strong> Please indicate by clicking the options below to indicate the degree to which the student best measures up to the competencies stated below
              <div style={{ marginTop: '10px' }}>
                <strong>Grade Points:</strong> 0 - ABSENT | 1 - WEAK | 2 - BELOW AVERAGE | 3 - AVERAGE | 4 - GOOD | 5 - OUTSTANDING
              </div>
            </div>

            <table className="grading-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>COMPETENCIES</th>
                  <th>0</th>
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>5</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="7" style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                    A. SPECIFIC SKILLS (Skills related to work assigned to student)
                  </td>
                </tr>
                {[1, 2, 3, 4, 5].map(num => (
                  <tr key={`skill-${num}`}>
                    <td>
                      <input
                        type="text"
                        className="skill-input"
                        placeholder={`Enter specific skill ${num}`}
                      />
                    </td>
                    {[0, 1, 2, 3, 4, 5].map(grade => (
                      <td key={grade}>
                        <input
                          type="radio"
                          name={`vs-skill-${num}`}
                          value={grade}
                          onChange={(e) => handleGradeChange(`vs-skill-${num}`, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                <tr>
                  <td colSpan="7" style={{ background: '#f0f0f0', fontWeight: 'bold', paddingTop: '15px' }}>
                    B. GENERAL EMPLOYABLE SKILLS
                  </td>
                </tr>
                <tr>
                  <td>Ability to complete work on time</td>
                  {[0, 1, 2, 3, 4, 5].map(grade => (
                    <td key={grade}>
                      <input
                        type="radio"
                        name="vs-complete-work"
                        value={grade}
                        onChange={(e) => handleGradeChange('vs-complete-work', e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Ability to follow instructions carefully</td>
                  {[0, 1, 2, 3, 4, 5].map(grade => (
                    <td key={grade}>
                      <input
                        type="radio"
                        name="vs-follow-instructions"
                        value={grade}
                        onChange={(e) => handleGradeChange('vs-follow-instructions', e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Ability to make initiatives</td>
                  {[0, 1, 2, 3, 4, 5].map(grade => (
                    <td key={grade}>
                      <input
                        type="radio"
                        name="vs-make-initiatives"
                        value={grade}
                        onChange={(e) => handleGradeChange('vs-make-initiatives', e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Logbook consistency</td>
                  {[0, 1, 2, 3, 4, 5].map(grade => (
                    <td key={grade}>
                      <input
                        type="radio"
                        name="vs-logbook"
                        value={grade}
                        onChange={(e) => handleGradeChange('vs-logbook', e.target.value)}
                      />
                    </td>
                  ))}
                </tr>

                {/* Score summary row */}
                <tr style={{ borderTop: '2px solid #333', background: '#f9f9f9', fontWeight: 'bold' }}>
                  <td colSpan="7" style={{ padding: '12px 16px' }}>
                    <span>Total Score (out of 80): </span>
                    <span style={{ fontSize: '1.1em', color: '#2a7a2a' }}>
                      {scaledScore} / 80
                    </span>
                    <span style={{ marginLeft: '20px', color: '#666', fontWeight: 'normal', fontSize: '0.85em' }}>
                      (Raw: {rawScore} / 45)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="text-center mt-20">
              <button
                className="btn btn-success"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'SUBMIT GRADING'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <AIFAQChatbot role="visiting_supervisor" />
    </div>
  );
};

export default UniversitySupervisorDashboard;
