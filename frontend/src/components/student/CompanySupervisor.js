import React, { useState } from 'react';
import StatusNotice from '../common/StatusNotice';

const CompanySupervisor = () => {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password) {
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <div>
        <div className="page-header">LOGIN - COMPANY SUPERVISOR</div>
        
        <div className="form-container" style={{maxWidth: '500px'}}>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>PASSWORD</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="showCompanySupPassword"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                <label htmlFor="showCompanySupPassword" style={{ marginBottom: 0 }}>Show password</label>
              </div>
            </div>
            
            <div className="text-center">
              <button type="submit" className="btn btn-primary">
                LOGIN
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">COMPANY SUPERVISOR - GRADE STUDENT</div>
      
      <div className="grading-section">
        <div className="grading-instructions">
          <strong>DIRECTIONS:</strong> Please indicate by clicking the options below to indicate the degree to which the student best measures up to the competencies stated below
          <div style={{marginTop: '10px'}}>
            <strong>Grade Points:</strong> 0 - ABSENT | 1 - WEAK | 2 - BELOW AVERAGE | 3 - AVERAGE | 4 - GOOD | 5 - OUTSTANDING
          </div>
        </div>
        
        <table className="grading-table">
          <thead>
            <tr>
              <th style={{width: '40%'}}>COMPETENCIES</th>
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
              <td colSpan="7" style={{background: '#f0f0f0', fontWeight: 'bold'}}>
                A. SPECIFIC SKILLS (Skills related to work assigned to student)
              </td>
            </tr>
            {[1, 2, 3, 4, 5].map(num => (
              <tr key={`skill-${num}`}>
                <td>
                  <input
                    type="text"
                    className="skill-input"
                    placeholder={`Enter ${num === 1 ? 'first' : num === 2 ? 'second' : num === 3 ? 'third' : num === 4 ? 'fourth' : 'fifth'} specific skill`}
                  />
                </td>
                {[0, 1, 2, 3, 4, 5].map(grade => (
                  <td key={grade}>
                    <input type="radio" name={`skill-${num}`} value={grade} />
                  </td>
                ))}
              </tr>
            ))}
            
            <tr>
              <td colSpan="7" style={{background: '#f0f0f0', fontWeight: 'bold', paddingTop: '15px'}}>
                B. GENERAL EMPLOYABLE SKILLS
              </td>
            </tr>
            <tr>
              <td>Ability to complete work on time</td>
              {[0, 1, 2, 3, 4, 5].map(grade => (
                <td key={grade}>
                  <input type="radio" name="complete-work" value={grade} />
                </td>
              ))}
            </tr>
            <tr>
              <td>Ability to follow instructions carefully</td>
              {[0, 1, 2, 3, 4, 5].map(grade => (
                <td key={grade}>
                  <input type="radio" name="follow-instructions" value={grade} />
                </td>
              ))}
            </tr>
            <tr>
              <td>Ability to make initiatives</td>
              {[0, 1, 2, 3, 4, 5].map(grade => (
                <td key={grade}>
                  <input type="radio" name="make-initiatives" value={grade} />
                </td>
              ))}
            </tr>
            <tr>
              <td>Ability to work well in a team</td>
              {[0, 1, 2, 3, 4, 5].map(grade => (
                <td key={grade}>
                  <input type="radio" name="teamwork" value={grade} />
                </td>
              ))}
            </tr>
            <tr>
              <td>Communication skills</td>
              {[0, 1, 2, 3, 4, 5].map(grade => (
                <td key={grade}>
                  <input type="radio" name="communication" value={grade} />
                </td>
              ))}
            </tr>
            <tr>
              <td>Punctuality</td>
              {[0, 1, 2, 3, 4, 5].map(grade => (
                <td key={grade}>
                  <input type="radio" name="punctuality" value={grade} />
                </td>
              ))}
            </tr>
            <tr>
              <td>Appearance</td>
              {[0, 1, 2, 3, 4, 5].map(grade => (
                <td key={grade}>
                  <input type="radio" name="appearance" value={grade} />
                </td>
              ))}
            </tr>
            <tr>
              <td>Attitude to work</td>
              {[0, 1, 2, 3, 4, 5].map(grade => (
                <td key={grade}>
                  <input type="radio" name="attitude" value={grade} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        
        <div className="form-group mt-20">
          <label><strong>Additional Comments (Optional)</strong></label>
          <textarea
            rows="4"
            placeholder="Enter any additional comments about the student's performance..."
          />
        </div>
        
        <StatusNotice notice={notice} onDismiss={() => setNotice(null)} />
        <div className="text-center mt-20">
          <button
            className="btn btn-success"
            onClick={() => setNotice({ type: 'success', message: 'Grading submitted successfully!' })}
          >
            SUBMIT GRADING
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
        Companies supervisors grades section
      </div>
    </div>
  );
};

export default CompanySupervisor;