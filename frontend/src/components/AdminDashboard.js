import React, { useState, useEffect } from 'react';
import AIFAQChatbot from './common/AIFAQChatbot';
import { API_BASE } from '../api';

const AdminDashboard = ({ user, onLogout }) => {
  const [activePage, setActivePage] = useState('assumptions');
  const [filterBy, setFilterBy] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [assumptions, setAssumptions] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [scoreSummary, setScoreSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showLecturerPassword, setShowLecturerPassword] = useState(false);
  const [showCsPassword, setShowCsPassword] = useState(false);

  const [lecturerName, setLecturerName] = useState('');
  const [lecturerPhone, setLecturerPhone] = useState('');
  const [lecturerEmail, setLecturerEmail] = useState('');
  const [lecturerDepartment, setLecturerDepartment] = useState('');
  const [lecturerSchool, setLecturerSchool] = useState('');
  const [lecturerRegion, setLecturerRegion] = useState('');
  const [lecturerPassword, setLecturerPassword] = useState('');
  const [lecturerFormError, setLecturerFormError] = useState('');
  const [lecturerFormSuccess, setLecturerFormSuccess] = useState('');
  const [addLecturerLoading, setAddLecturerLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignMessage, setAssignMessage] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [companySupervisors, setCompanySupervisors] = useState([]);
  const [csName, setCsName] = useState('');
  const [csCompany, setCsCompany] = useState('');
  const [csPhone, setCsPhone] = useState('');
  const [csEmail, setCsEmail] = useState('');
  const [csPassword, setCsPassword] = useState('');
  const [csFormError, setCsFormError] = useState('');
  const [csFormSuccess, setCsFormSuccess] = useState('');
  const [addCsLoading, setAddCsLoading] = useState(false);

  const lecturerDepartments = [
    'Computer Science',
    'Information Technology',
    'Electrical and Electronics Engineering',
    'Mechanical Engineering',
    'Humanities',
    'Social Sciences',
    'Civil and Building Engineering',
    'Human Resource Management',
    'Commerce',
    'Physical and Biological Science',
    'Mathematics and Actuarial Science',
    'Education and Technology',
    'Travel and Tourism Management',
    'Medical Laboratory and Pharmaceutical Sciences',
    'Nursing',
    'Public and Community Health',
    'Clinical Medicine',
  ];
  const lecturerSchools = ['SE', 'SCIT', 'SOE', 'SHSS', 'SPAHS', 'SET', 'SHTM'];

  const validateLecturerClient = () => {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRe = /^(\+254|254|0)?[17]\d{8}$/;
    if (!lecturerName.trim()) return 'Name is required.';
    if (!lecturerDepartment) return 'Please select a department.';
    if (!lecturerSchool) return 'Please select a school.';
    if (!lecturerRegion) return 'Please select a residence region.';
    const phone = lecturerPhone.replace(/\s+/g, '');
    if (!phoneRe.test(phone)) {
      return 'Enter a valid Kenya phone number (e.g. 07XXXXXXXX or +2547XXXXXXXX).';
    }
    const em = lecturerEmail.trim();
    if (!em) return 'Email is required.';
    if (!emailRe.test(em)) return 'Invalid email format.';
    if (lecturerPassword.trim() && lecturerPassword.length < 8) {
      return 'Password must be at least 8 characters, or leave blank to use the default.';
    }
    return null;
  };

  const handleAddLecturer = async (e) => {
    e.preventDefault();
    setLecturerFormError('');
    setLecturerFormSuccess('');
    const msg = validateLecturerClient();
    if (msg) {
      setLecturerFormError(msg);
      return;
    }
    setAddLecturerLoading(true);
    try {
      const body = {
        name: lecturerName.trim(),
        school: lecturerSchool,
        department: lecturerDepartment,
        phone: lecturerPhone.replace(/\s+/g, ''),
        email: lecturerEmail.trim(),
        residenceRegion: lecturerRegion,
      };
      if (lecturerPassword.trim()) body.password = lecturerPassword;
      const res = await fetch(`${API_BASE}/api/admin/add-lecturer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.success) throw new Error(data.message || 'Failed to add lecturer');
      setLecturerFormSuccess('Lecturer added successfully.');
      setLecturerName('');
      setLecturerPhone('');
      setLecturerEmail('');
      setLecturerDepartment('');
      setLecturerSchool('');
      setLecturerRegion('');
      setLecturerPassword('');
      const lr = await fetch(`${API_BASE}/api/admin/lecturers`);
      const lj = await lr.json();
      if (lj.success) setLecturers(lj.lecturers || []);
    } catch (err) {
      setLecturerFormError(err.message || 'Unable to add lecturer');
    } finally {
      setAddLecturerLoading(false);
    }
  };

  const refreshAssignments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/student-assignments`);
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Assignments: server returned non-JSON (${res.status}).`);
      }
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load assignments');
      setAssignments(data.assignments || []);
    } catch {
      // Keep UI usable even if assignments can't be loaded.
    }
  };

  const handleAssignRegion = async (region) => {
    setAssignError('');
    setAssignMessage('');
    setAssignLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/assign-university-supervisors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'region', region }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to assign supervisors');
      setAssignMessage(data.message || 'Supervisors assigned successfully.');
      await refreshAssignments();
    } catch (err) {
      setAssignError(err.message || 'Unable to assign supervisors.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssignSchool = async (school) => {
    setAssignError('');
    setAssignMessage('');
    setAssignLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/assign-university-supervisors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'school', school }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to assign supervisors');
      setAssignMessage(data.message || 'Supervisors assigned successfully.');
      await refreshAssignments();
    } catch (err) {
      setAssignError(err.message || 'Unable to assign supervisors.');
    } finally {
      setAssignLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [assumptionsRes, lecturersRes, scoresRes, assignmentsRes, companyCsRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/assumptions`),
          fetch(`${API_BASE}/api/admin/lecturers`),
          fetch(`${API_BASE}/api/admin/scores/summary`),
          fetch(`${API_BASE}/api/admin/student-assignments`),
          fetch(`${API_BASE}/api/admin/company-supervisors`),
        ]);

        const parseJson = async (res, label) => {
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch {
            throw new Error(
              `${label}: server returned non-JSON (${res.status}). Is the API running at ${API_BASE}?`
            );
          }
        };

        const assumptionsJson = await parseJson(assumptionsRes, 'Assumptions');
        const lecturersJson = await parseJson(lecturersRes, 'Lecturers');
        const scoresJson = await parseJson(scoresRes, 'Scores');
        const assignmentsJson = await parseJson(assignmentsRes, 'Assignments');
        const companyCsJson = await parseJson(companyCsRes, 'Company supervisors');

        if (!assumptionsJson.success) throw new Error(assumptionsJson.message || 'Failed to load assumptions');
        if (!lecturersJson.success) throw new Error(lecturersJson.message || 'Failed to load lecturers');
        if (!scoresJson.success) throw new Error(scoresJson.message || 'Failed to load scores');
        if (!assignmentsJson.success) throw new Error(assignmentsJson.message || 'Failed to load assignments');
        if (!companyCsJson.success) throw new Error(companyCsJson.message || 'Failed to load company supervisors');

        setAssumptions(assumptionsJson.assumptions || []);
        setLecturers(lecturersJson.lecturers || []);
        setScoreSummary(scoresJson.scores || []);
        setAssignments(assignmentsJson.assignments || []);
        setCompanySupervisors(companyCsJson.supervisors || []);
      } catch (err) {
        setError(err.message || 'Unable to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE]);

  useEffect(() => {
    // Reset search UI when switching between filterable pages.
    if (['assumptions', 'University', 'company'].includes(activePage)) {
      setFilterBy('all');
      setSearchTerm('');
    }
  }, [activePage]);

  const validateCompanySupervisorClient = () => {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRe = /^(\+254|254|0)?[17]\d{8}$/;
    if (!csName.trim()) return 'Name is required.';
    if (!csCompany.trim()) return 'Company name is required.';
    const phone = csPhone.replace(/\s+/g, '');
    if (!phoneRe.test(phone)) {
      return 'Enter a valid Kenya phone number (e.g. 07XXXXXXXX or +2547XXXXXXXX).';
    }
    const em = csEmail.trim();
    if (!em) return 'Email is required.';
    if (!emailRe.test(em)) return 'Invalid email format.';
    if (csPassword.trim() && csPassword.length < 8) {
      return 'Password must be at least 8 characters, or leave blank to use the default.';
    }
    return null;
  };

  const handleAddCompanySupervisor = async (e) => {
    e.preventDefault();
    setCsFormError('');
    setCsFormSuccess('');
    const msg = validateCompanySupervisorClient();
    if (msg) {
      setCsFormError(msg);
      return;
    }
    setAddCsLoading(true);
    try {
      const body = {
        name: csName.trim(),
        companyName: csCompany.trim(),
        phone: csPhone.replace(/\s+/g, ''),
        email: csEmail.trim(),
      };
      if (csPassword.trim()) body.password = csPassword;
      const res = await fetch(`${API_BASE}/api/admin/add-company-supervisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.success) throw new Error(data.message || 'Failed to add company supervisor');
      setCsFormSuccess('Company supervisor added. They log in with this email and password.');
      setCsName('');
      setCsCompany('');
      setCsPhone('');
      setCsEmail('');
      setCsPassword('');
      const listRes = await fetch(`${API_BASE}/api/admin/company-supervisors`);
      const listJson = await listRes.json();
      if (listJson.success) setCompanySupervisors(listJson.supervisors || []);
    } catch (err) {
      setCsFormError(err.message || 'Unable to add company supervisor');
    } finally {
      setAddCsLoading(false);
    }
  };

  const regions = ['Nairobi', 'Nyeri', 'Muranga', 'Kirinyaga', 'Kiambu', 'Embu', 'Machakos', 'Nyandarua', 'Laikipia', 'Nakuru'];
  const studentStats = [1, 2, 1, 0, 0, 0, 0, 0, 1, 0];

  const normalizedSearchTerm = (searchTerm || '').trim().toLowerCase();
  const effectiveFilterBy = filterBy || 'all';

  const filteredAssumptions = !normalizedSearchTerm
    ? assumptions
    : assumptions.filter((item) => {
        const studentName = `${item.first_name || ''} ${item.last_name || ''}`.trim().toLowerCase();
        const indexNumber = `${item.index_number || ''}`.trim().toLowerCase();
        const programme = `${item.programme || ''}`.trim().toLowerCase();
        const supervisorName = `${item.supervisor_name || ''}`.trim().toLowerCase();
        const supervisorEmail = `${item.supervisor_email || ''}`.trim().toLowerCase();
        const companyName = `${item.company_name || ''}`.trim().toLowerCase();
        const companyRegion = `${item.company_region || ''}`.trim().toLowerCase();
        const address = `${item.address || ''}`.trim().toLowerCase();
        const supervisorContact = `${item.supervisor_contact || ''}`.trim().toLowerCase();

        if (effectiveFilterBy === 'all') {
          return [
            studentName,
            indexNumber,
            programme,
            supervisorName,
            supervisorEmail,
            companyName,
            companyRegion,
            address,
            supervisorContact,
          ].some((v) => v.includes(normalizedSearchTerm));
        }

        switch (effectiveFilterBy) {
          case 'student_name':
            return studentName.includes(normalizedSearchTerm);
          case 'index_number':
            return indexNumber.includes(normalizedSearchTerm);
          case 'programme':
            return programme.includes(normalizedSearchTerm);
          case 'supervisor_name':
            return supervisorName.includes(normalizedSearchTerm);
          case 'supervisor_email':
            return supervisorEmail.includes(normalizedSearchTerm);
          case 'company_name':
            return companyName.includes(normalizedSearchTerm);
          case 'company_region':
            return companyRegion.includes(normalizedSearchTerm);
          default:
            return true;
        }
      });

  const filteredScoreSummary = !normalizedSearchTerm
    ? scoreSummary
    : scoreSummary.filter((student) => {
        const studentName = `${student.first_name || ''} ${student.last_name || ''}`.trim().toLowerCase();
        const registrationNumber = `${student.registration_number || student.index_number || ''}`.trim().toLowerCase();
        const programme = `${student.programme || ''}`.trim().toLowerCase();
        const universityTotal = `${student.university_total ?? ''}`.trim().toLowerCase();
        const companyTotal = `${student.company_total ?? ''}`.trim().toLowerCase();
        const overallTotal = `${student.overall_total ?? ''}`.trim().toLowerCase();

        if (effectiveFilterBy === 'all') {
          return [studentName, registrationNumber, programme, universityTotal, companyTotal, overallTotal].some((v) =>
            v.includes(normalizedSearchTerm)
          );
        }

        switch (effectiveFilterBy) {
          case 'student_name':
            return studentName.includes(normalizedSearchTerm);
          case 'registration_number':
          case 'index_number':
            return registrationNumber.includes(normalizedSearchTerm);
          case 'programme':
            return programme.includes(normalizedSearchTerm);
          case 'university_total':
            return universityTotal.includes(normalizedSearchTerm);
          case 'company_total':
            return companyTotal.includes(normalizedSearchTerm);
          case 'overall_total':
            return overallTotal.includes(normalizedSearchTerm);
          default:
            return true;
        }
      });

  const renderAssumptionsTable = () => (
    <div className="table-container">
      <div className="filter-section">
        <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
          <option value="all">All</option>
          <option value="student_name">Student Name</option>
          <option value="index_number">Registration Number</option>
          <option value="programme">Programme</option>
          <option value="supervisor_name">Supervisor Name</option>
          <option value="supervisor_email">Supervisor E-mail</option>
          <option value="company_name">Company Name</option>
          <option value="company_region">Company Region</option>
        </select>
        <input
          type="text"
          placeholder="Search term"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => setSearchTerm((v) => (v || '').trim())}>
          SEARCH
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Registration Number</th>
            <th>Programme</th>
            <th>Supervisor Name</th>
            <th>Supervisor Contact</th>
            <th>Supervisor E-mail</th>
            <th>Company Name</th>
            <th>Company Region</th>
            <th>Company Address</th>
          </tr>
        </thead>
        <tbody>
          {filteredAssumptions.map((item) => (
            <tr key={item.id}>
              <td>{`${item.first_name} ${item.last_name}`}</td>
              <td>{item.index_number}</td>
              <td>{item.programme}</td>
              <td>{item.supervisor_name}</td>
              <td>{item.supervisor_contact}</td>
              <td>{item.supervisor_email}</td>
              <td>{item.company_name}</td>
              <td>{item.company_region}</td>
              <td>{item.address}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAssignSupervisors = () => (
    <div>
      <div className="stats-grid">
        <h3 style={{ gridColumn: '1 / -1', marginBottom: '20px' }}>STUDENTS STATISTICS</h3>
        {regions.map((region, index) => (
          <div key={region} className="stat-card">
            <h3>{region}</h3>
            <div className="stat-value">{studentStats[index]}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '40px' }}>
        <div className="page-header">REGISTERED LECTURERS</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>School</th>
              <th>Department</th>
              <th>Phone Number</th>
              <th>Residence Region</th>
              <th>E-mail</th>
            </tr>
          </thead>
          <tbody>
            {lecturers.map((lecturer) => (
              <tr key={lecturer.id}>
                <td>{lecturer.name}</td>
                <td>{lecturer.school}</td>
                <td>{lecturer.department}</td>
                <td>{lecturer.phone}</td>
                <td>{lecturer.residence_region}</td>
                <td>{lecturer.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '40px' }}>
        <div className="page-header">COMPANY SUPERVISORS (LOGIN ACCOUNTS)</div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Phone</th>
              <th>Email (login username)</th>
            </tr>
          </thead>
          <tbody>
            {companySupervisors.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center' }}>
                  No company supervisor accounts yet. Add one below.
                </td>
              </tr>
            ) : (
              companySupervisors.map((cs) => (
                <tr key={cs.id}>
                  <td>{cs.name}</td>
                  <td>{cs.company_name}</td>
                  <td>{cs.phone}</td>
                  <td>{cs.email}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div style={{ marginTop: '24px' }}>
          <h3 style={{ marginBottom: '12px' }}>Add company supervisor</h3>
          <form className="form-container" onSubmit={handleAddCompanySupervisor} noValidate>
            {csFormError && (
              <div style={{ color: 'red', marginBottom: '12px' }} role="alert">{csFormError}</div>
            )}
            {csFormSuccess && (
              <div style={{ color: '#2e7d32', marginBottom: '12px' }} role="status">{csFormSuccess}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label htmlFor="cs-name">Name</label>
                <input id="cs-name" type="text" value={csName} onChange={(e) => setCsName(e.target.value)} autoComplete="name" />
              </div>
              <div className="form-group">
                <label htmlFor="cs-company">Company name</label>
                <input id="cs-company" type="text" value={csCompany} onChange={(e) => setCsCompany(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="cs-phone">Phone</label>
                <input id="cs-phone" type="tel" value={csPhone} onChange={(e) => setCsPhone(e.target.value)} autoComplete="tel" />
              </div>
              <div className="form-group">
                <label htmlFor="cs-email">Email (used to log in)</label>
                <input id="cs-email" type="email" value={csEmail} onChange={(e) => setCsEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="cs-password">Password (optional)</label>
                <input
                  id="cs-password"
                  type={showCsPassword ? 'text' : 'password'}
                  placeholder="Leave blank for default password (default123)"
                  value={csPassword}
                  onChange={(e) => setCsPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <div className="checkbox-group" style={{ marginTop: '8px', marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    id="showCsPassword"
                    checked={showCsPassword}
                    onChange={(e) => setShowCsPassword(e.target.checked)}
                  />
                  <label htmlFor="showCsPassword" style={{ marginBottom: 0 }}>Show password</label>
                </div>
              </div>
            </div>
            <div className="text-center mt-20">
              <button type="submit" className="btn btn-success" disabled={addCsLoading}>
                {addCsLoading ? 'ADDING...' : 'ADD COMPANY SUPERVISOR'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <div className="page-header">ADD LECTURER</div>
        <form className="form-container" onSubmit={handleAddLecturer} noValidate>
          {lecturerFormError && (
            <div style={{ color: 'red', marginBottom: '12px' }} role="alert">{lecturerFormError}</div>
          )}
          {lecturerFormSuccess && (
            <div style={{ color: '#2e7d32', marginBottom: '12px' }} role="status">{lecturerFormSuccess}</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label htmlFor="lecturer-name">Name</label>
              <input id="lecturer-name" type="text" placeholder="Enter name" value={lecturerName} onChange={(e) => setLecturerName(e.target.value)} autoComplete="name" />
            </div>
            <div className="form-group">
              <label htmlFor="lecturer-phone">Contact (0XXXXXXXXX)</label>
              <input id="lecturer-phone" type="tel" placeholder="Enter contact (0XXXXXXXXX)" value={lecturerPhone} onChange={(e) => setLecturerPhone(e.target.value)} autoComplete="tel" />
            </div>
            <div className="form-group">
              <label htmlFor="lecturer-email">Email</label>
              <input id="lecturer-email" type="email" placeholder="Enter email address" value={lecturerEmail} onChange={(e) => setLecturerEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="form-group">
              <label htmlFor="lecturer-dept">Department</label>
              <select id="lecturer-dept" value={lecturerDepartment} onChange={(e) => setLecturerDepartment(e.target.value)}>
                <option value="">-- Select Lecturer Department --</option>
                {lecturerDepartments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="lecturer-school">School</label>
              <select id="lecturer-school" value={lecturerSchool} onChange={(e) => setLecturerSchool(e.target.value)}>
                <option value="">-- Select Lecturer School --</option>
                {lecturerSchools.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="lecturer-region">Resident region</label>
              <select id="lecturer-region" value={lecturerRegion} onChange={(e) => setLecturerRegion(e.target.value)}>
                <option value="">-- Select Resident Region --</option>
                {regions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="lecturer-password">Password (optional)</label>
              <input
                id="lecturer-password"
                type={showLecturerPassword ? 'text' : 'password'}
                placeholder="Leave blank for default password (default123)"
                value={lecturerPassword}
                onChange={(e) => setLecturerPassword(e.target.value)}
                autoComplete="new-password"
              />
              <div className="checkbox-group" style={{ marginTop: '8px', marginBottom: 0 }}>
                <input
                  type="checkbox"
                  id="showLecturerPassword"
                  checked={showLecturerPassword}
                  onChange={(e) => setShowLecturerPassword(e.target.checked)}
                />
                <label htmlFor="showLecturerPassword" style={{ marginBottom: 0 }}>Show password</label>
              </div>
            </div>
          </div>
          <div className="text-center mt-20">
            <button type="submit" className="btn btn-success" disabled={addLecturerLoading}>
              {addLecturerLoading ? 'ADDING…' : 'ADD'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: '40px' }}>
        <div className="page-header">ASSIGN SUPERVISORS</div>
        <div className="table-container">
          <h3 style={{ marginBottom: '20px' }}>Regions</h3>
          <table className="data-table">
            <thead>
              <tr>
                {regions.map(region => (
                  <th key={region}>{region}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {regions.map((region) => (
                  <td key={region}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '12px' }}
                      disabled={assignLoading}
                      onClick={() => handleAssignRegion(region)}
                    >
                      {assignLoading ? 'Assigning...' : 'Assign'}
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          <h3 style={{ margin: '30px 0 20px' }}>SCHOOLS</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {lecturerSchools.map(school => (
              <div key={school} style={{ textAlign: 'center' }}>
                <strong>{school}</strong>
                <div style={{ marginTop: '10px' }}>
                  <button
                    className="btn btn-primary"
                    disabled={assignLoading}
                    onClick={() => handleAssignSchool(school)}
                  >
                    {assignLoading ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {assignError && (
            <div style={{ color: 'red', marginTop: '16px' }} role="alert">{assignError}</div>
          )}
          {assignMessage && (
            <div style={{ color: '#2e7d32', marginTop: '16px' }} role="status">{assignMessage}</div>
          )}

          <h3 style={{ margin: '40px 0 20px' }}>ASSIGNED UNIVERSITY SUPERVISORS</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Registration Number</th>
                <th>Programme</th>
                <th>Lecturer Name</th>
                <th>Lecturer School</th>
                <th>Lecturer Department</th>
                <th>Lecturer Contact</th>
                <th>Lecturer E-mail</th>
              </tr>
            </thead>
            <tbody>
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center' }}>
                    No university supervisor assignments yet.
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr key={`${a.student_id}-${a.supervisor_id}`}>
                    <td>{a.student_name}</td>
                    <td>{a.index_number}</td>
                    <td>{a.programme}</td>
                    <td>{a.supervisor_name}</td>
                    <td>{a.supervisor_school}</td>
                    <td>{a.supervisor_department}</td>
                    <td>{a.supervisor_phone}</td>
                    <td>{a.supervisor_email}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderUniversityScores = () => (
    <div className="table-container">
      <div className="filter-section">
        <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
          <option value="all">All</option>
          <option value="student_name">Student Name</option>
          <option value="index_number">Registration Number</option>
          <option value="programme">Programme</option>
          <option value="university_total">University Total (80)</option>
          <option value="overall_total">Overall Total (100)</option>
        </select>
        <input
          type="text"
          placeholder="Search term"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => setSearchTerm((v) => (v || '').trim())}>
          SEARCH
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Registration Number</th>
            <th>Programme</th>
            <th>University Total (80)</th>
          </tr>
        </thead>
        <tbody>
          {filteredScoreSummary.map((student) => (
            <tr key={student.id}>
              <td>{`${student.first_name} ${student.last_name}`}</td>
              <td>{student.registration_number || student.index_number}</td>
              <td>{student.programme}</td>
              <td>{student.university_total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCompanyScores = () => (
    <div className="table-container">
      <div className="filter-section">
        <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
          <option value="all">All</option>
          <option value="student_name">Student Name</option>
          <option value="index_number">Registration Number</option>
          <option value="programme">Programme</option>
          <option value="company_total">Company Total (20)</option>
          <option value="overall_total">Overall Total (100)</option>
        </select>
        <input
          type="text"
          placeholder="Search term"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-primary" onClick={() => setSearchTerm((v) => (v || '').trim())}>
          SEARCH
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Student Name</th>
            <th>Registration Number</th>
            <th>Programme</th>
            <th>Company Score</th>
            <th>Overall Total (100)</th>
          </tr>
        </thead>
        <tbody>
          {filteredScoreSummary.map((student) => (
            <tr key={student.id}>
              <td>{`${student.first_name} ${student.last_name}`}</td>
              <td>{student.registration_number || student.index_number}</td>
              <td>{student.programme}</td>
              <td>{student.company_total}</td>
              <td>{student.overall_total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPage = () => {
    switch (activePage) {
      case 'assumptions':
        return (
          <div>
            <div className="page-header">STUDENTS ASSUMPTION</div>
            {renderAssumptionsTable()}
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
              Submitted Assumptions of Duty Form
            </div>
          </div>
        );
      case 'assign':
        return (
          <div>
            <div className="page-header">ASSIGN SUPERVISORS</div>
            {renderAssignSupervisors()}
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
              Assign University Supervisors to students section
            </div>
          </div>
        );
      case 'University':
        return (
          <div>
            <div className="page-header">UNIVERSITY SUPERVISORS SCORE</div>
            {renderUniversityScores()}
          </div>
        );
      case 'company':
        return (
          <div>
            <div className="page-header">COMPANY SUPERVISORS SCORE</div>
            {renderCompanyScores()}
          </div>
        );
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
        <div className="welcome-user">Welcome, Admin</div>
      </div>

      <div className="dashboard-container">
        <div className="sidebar">
          <ul className="sidebar-menu">
            <li>
              <button
                className={activePage === 'assumptions' ? 'active' : ''}
                onClick={() => setActivePage('assumptions')}
              >
                Student Assumptions
              </button>
            </li>
            <li>
              <button
                className={activePage === 'assign' ? 'active' : ''}
                onClick={() => setActivePage('assign')}
              >
                Assign Supervisors
              </button>
            </li>
            <li>
              <button
                className={activePage === 'University' ? 'active' : ''}
                onClick={() => setActivePage('University')}
              >
                University Supervisors Score
              </button>
            </li>
            <li>
              <button
                className={activePage === 'company' ? 'active' : ''}
                onClick={() => setActivePage('company')}
              >
                Company Supervisor Score
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
          {error && (
            <div style={{ marginBottom: '16px', color: 'red' }}>
              {error}
            </div>
          )}
          {loading ? <div>Loading admin data</div> : renderPage()}
        </div>
      </div>
      <AIFAQChatbot role="admin" />
    </div>
  );
};

export default AdminDashboard;
