import React, { useState } from 'react';
import StatusNotice from '../common/StatusNotice';

const SKILL_LABELS = ['first', 'second', 'third', 'fourth', 'fifth'];

const GENERAL_ITEMS = [
  { key: 'complete_work', label: 'Ability to complete work on time' },
  { key: 'follow_instructions', label: 'Ability to follow instructions carefully' },
  { key: 'initiative', label: 'Ability to make initiatives' },
  { key: 'teamwork', label: 'Ability to work well in a team' },
  { key: 'communication', label: 'Communication skills' },
  { key: 'punctuality', label: 'Punctuality' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'attitude', label: 'Attitude to work' },
];

const LOGBOOK_ITEMS = [
  { key: 'logbook_consistency', label: 'Consistency in updating logbook' },
  { key: 'logbook_quality', label: 'Quality of entries' },
];

const VisitingSupervisor = () => {
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [supervisorId, setSupervisorId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Reports list state
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Grading form state
  const [skillNames, setSkillNames] = useState(['', '', '', '', '']);
  const [grades, setGrades] = useState({});
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [notice, setNotice] = useState(null);

  // ── Login ──────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setNotice(null);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password, role: 'visiting_supervisor' }),
      });
      const data = await res.json();
      if (!data.success) {
        setNotice({ type: 'error', message: data.message || 'Invalid credentials' });
        return;
      }
      setSupervisorId(data.user.id);
      setIsLoggedIn(true);
      fetchReports(data.user.id);
    } catch (err) {
      setNotice({ type: 'error', message: 'Could not reach the server. Try again.' });
    }
  };

  // ── Fetch reports assigned to this supervisor ──
  const fetchReports = async (id) => {
    setLoadingReports(true);
    try {
      const res = await fetch(`/api/supervisor/visiting/reports?supervisorId=${id}`);
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
      } else {
        setNotice({ type: 'error', message: data.message || 'Could not load reports' });
      }
    } catch (err) {
      setNotice({ type: 'error', message: 'Could not reach the server while loading reports.' });
    } finally {
      setLoadingReports(false);
    }
  };

  const openGradingFor = (report) => {
    setSelectedReport(report);
    setSkillNames(['', '', '', '', '']);
    setGrades({});
    setRemarks('');
    setNotice(null);
  };

  const backToReports = () => {
    setSelectedReport(null);
    fetchReports(supervisorId);
  };

  const setGrade = (name, value) => {
    setGrades((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const totalScore = Object.values(grades).reduce((sum, v) => sum + (v || 0), 0);

  // ── Submit grading ─────────────────────────
  const handleSubmitGrading = async () => {
    if (!selectedReport) return;
    setSubmitting(true);
    setNotice(null);
    try {
      const res = await fetch('/api/grades/visiting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationNumber: selectedReport.registration_number,
          supervisorId,
          grades: {
            specificSkills: skillNames.map((name, i) => ({
              name,
              score: grades[`skill-${i}`] || 0,
            })),
            general: GENERAL_ITEMS.map((item) => ({
              key: item.key,
              score: grades[item.key] || 0,
            })),
            logbook: LOGBOOK_ITEMS.map((item) => ({
              key: item.key,
              score: grades[item.key] || 0,
            })),
          },
          totalScore,
          remarks,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ type: 'success', message: 'Grading submitted successfully!' });
      } else {
        setNotice({ type: 'error', message: data.message || 'Failed to submit grading' });
      }
    } catch (err) {
      setNotice({ type: 'error', message: 'Could not reach the server while submitting.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Login screen ───────────────────────────
  if (!isLoggedIn) {
    return (
      <div>
        <div className="page-header">LOGIN - VISITING SUPERVISOR</div>

        <div className="form-container" style={{ maxWidth: '500px' }}>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>EMAIL</label>
              <input
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
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
                  id="showVisitingSupPassword"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                <label htmlFor="showVisitingSupPassword" style={{ marginBottom: 0 }}>Show password</label>
              </div>
            </div>

            <StatusNotice notice={notice} onDismiss={() => setNotice(null)} />

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

  // ── Reports list screen ────────────────────
  if (!selectedReport) {
    return (
      <div>
        <div className="page-header">VISITING SUPERVISOR - REPORTS TO GRADE</div>

        <StatusNotice notice={notice} onDismiss={() => setNotice(null)} />

        {loadingReports ? (
          <p>Loading reports...</p>
        ) : reports.length === 0 ? (
          <p>No reports from your assigned students yet.</p>
        ) : (
          <table className="grading-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Reg. Number</th>
                <th>File</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>{r.first_name} {r.last_name}</td>
                  <td>{r.registration_number}</td>
                  <td>{r.filename}</td>
                  <td>{new Date(r.uploaded_at).toLocaleString()}</td>
                  <td>
                    <a
                      href={`/api/reports/download/${r.id}?supervisorId=${supervisorId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary"
                      style={{ marginRight: '8px' }}
                    >
                      View
                    </a>
                    <button className="btn btn-primary" onClick={() => openGradingFor(r)}>
                      Grade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  // ── Grading screen ─────────────────────────
  return (
    <div>
      <div className="page-header">
        VISITING SUPERVISOR - GRADE STUDENT ({selectedReport.first_name} {selectedReport.last_name}, {selectedReport.registration_number})
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button className="btn btn-secondary" onClick={backToReports}>&larr; Back to reports</button>
        <a
          href={`/api/reports/download/${selectedReport.id}?supervisorId=${supervisorId}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
          style={{ marginLeft: '8px' }}
        >
          Open report
        </a>
      </div>

      <div className="grading-section">
        <div className="grading-instructions">
          <strong>DIRECTIONS:</strong> Please indicate by clicking the options below to indicate the degree to which the student best measures up to the competencies stated below
          <div style={{ marginTop: '10px' }}>
            <strong>Grade Points:</strong> 0 - ABSENT | 1 - WEAK | 2 - BELOW AVERAGE | 3 - AVERAGE | 4 - GOOD | 5 - OUTSTANDING
          </div>
        </div>

        <table className="grading-table">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>COMPETENCIES</th>
              <th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="7" style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                A. SPECIFIC SKILLS (Skills related to work assigned to student)
              </td>
            </tr>
            {[0, 1, 2, 3, 4].map((i) => (
              <tr key={`skill-${i}`}>
                <td>
                  <input
                    type="text"
                    className="skill-input"
                    placeholder={`Enter ${SKILL_LABELS[i]} specific skill`}
                    value={skillNames[i]}
                    onChange={(e) => {
                      const next = [...skillNames];
                      next[i] = e.target.value;
                      setSkillNames(next);
                    }}
                  />
                </td>
                {[0, 1, 2, 3, 4, 5].map((grade) => (
                  <td key={grade}>
                    <input
                      type="radio"
                      name={`vs-skill-${i}`}
                      value={grade}
                      checked={grades[`skill-${i}`] === grade}
                      onChange={(e) => setGrade(`skill-${i}`, e.target.value)}
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
            {GENERAL_ITEMS.map((item) => (
              <tr key={item.key}>
                <td>{item.label}</td>
                {[0, 1, 2, 3, 4, 5].map((grade) => (
                  <td key={grade}>
                    <input
                      type="radio"
                      name={`vs-${item.key}`}
                      value={grade}
                      checked={grades[item.key] === grade}
                      onChange={(e) => setGrade(item.key, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}

            <tr>
              <td colSpan="7" style={{ background: '#f0f0f0', fontWeight: 'bold', paddingTop: '15px' }}>
                C. LOGBOOK EVALUATION
              </td>
            </tr>
            {LOGBOOK_ITEMS.map((item) => (
              <tr key={item.key}>
                <td>{item.label}</td>
                {[0, 1, 2, 3, 4, 5].map((grade) => (
                  <td key={grade}>
                    <input
                      type="radio"
                      name={`vs-${item.key}`}
                      value={grade}
                      checked={grades[item.key] === grade}
                      onChange={(e) => setGrade(item.key, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="form-group mt-20">
          <label><strong>Supervisor's Remarks</strong></label>
          <textarea
            rows="4"
            placeholder="Enter your observations and recommendations..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <div style={{ marginTop: '10px' }}>
          <strong>Running total: {totalScore}</strong>
        </div>

        <StatusNotice notice={notice} onDismiss={() => setNotice(null)} />
        <div className="text-center mt-20">
          <button
            className="btn btn-success"
            disabled={submitting}
            onClick={handleSubmitGrading}
          >
            {submitting ? 'SUBMITTING...' : 'SUBMIT GRADING'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitingSupervisor;