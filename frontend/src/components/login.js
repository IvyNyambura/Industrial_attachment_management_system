import React, { useState } from 'react';
import StatusNotice from './common/StatusNotice';
import { API_BASE, DEMO_ACCOUNTS } from '../api';

const Login = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState('signin');
  const [role, setRole] = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const parseJson = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        `Server returned a non-JSON response (${res.status}). Is the API running at ${API_BASE || 'this origin'}?`
      );
    }
  };

  const signIn = async ({ loginRole, loginUsername, loginPassword }) => {
    setNotice(null);
    setLoading(true);
    try {
      if (loginRole === 'admin') {
        const res = await fetch(`${API_BASE}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: loginPassword }),
        });
        const data = await parseJson(res);
        if (!data.success) throw new Error(data.message || 'Invalid admin credentials');
        if (keepSignedIn) localStorage.setItem('user', JSON.stringify({ username: 'admin', role: 'admin' }));
        onLogin({ username: 'admin' }, 'admin');
        return;
      }

      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword, role: loginRole }),
      });
      const data = await parseJson(res);
      if (!data.success) throw new Error(data.message || 'Invalid credentials');
      if (keepSignedIn) localStorage.setItem('user', JSON.stringify({ username: loginUsername, role: data.user.role }));
      onLogin({ username: loginUsername }, data.user.role);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Connection error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signIn({ loginRole: role, loginUsername: username, loginPassword: password });
  };

  const fillDemoAccount = (account) => {
    const nextUsername = account.role === 'admin' ? 'admin' : account.username;
    setRole(account.role);
    setUsername(nextUsername);
    setPassword(account.password);
    signIn({
      loginRole: account.role,
      loginUsername: nextUsername,
      loginPassword: account.password,
    });
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img
            src="/logo.png"
            alt="MUT Logo"
            style={{
              display: 'block',
              margin: '0 auto 20px',
              width: '80px',
              height: '80px',
              objectFit: 'contain'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML =
                '<div class="logo" style="margin: 0 auto 20px; width: 80px; height: 80px; fontSize: 24px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #020202, #4CAF50); color: white; borderRadius: 50%; fontWeight: bold;">MU</div>';
            }}
          />
          <h1>MUT</h1>
          <h2>ATTACHMENT MANAGEMENT SYSTEM</h2>
        </div>

        <div className="login-tabs">
          <button
            className={activeTab === 'signin' ? 'active' : ''}
            onClick={() => { setActiveTab('signin'); setNotice(null); }}
          >
            SIGN IN
          </button>
          <button
            className={activeTab === 'signup' ? 'active' : ''}
            onClick={() => { setActiveTab('signup'); setNotice(null); }}
          >
            SIGN UP
          </button>
        </div>

        <StatusNotice notice={notice} onDismiss={() => setNotice(null)} />

        {/* ───────────────── SIGN IN ───────────────── */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>LOGIN AS</label>
              <select
                value={role}
                onChange={(e) => {
                  const next = e.target.value;
                  setRole(next);
                  if (next === 'admin') setUsername('admin');
                }}
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
                <option value="company_supervisor">Company Supervisor</option>
                <option value="visiting_supervisor">Visiting Supervisor</option>
              </select>
            </div>

            <div className="form-group">
              <label>{role === 'student' ? 'REGISTRATION NUMBER' : 'USERNAME / EMAIL'}</label>
              <input
                type="text"
                placeholder={role === 'student' ? 'Enter registration number' : 'Enter username or email'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={role !== 'admin'}
                disabled={role === 'admin'}
                readOnly={role === 'admin'}
              />
            </div>

            <div className="form-group">
              <label>PASSWORD</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="showSigninPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <label htmlFor="showSigninPassword" style={{ marginBottom: 0 }}>Show password</label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="keepSignedIn"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
              />
              <label htmlFor="keepSignedIn" style={{ marginBottom: 0 }}>Keep me Signed in</label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'SIGN IN'}
            </button>
          </form>
        )}

        {activeTab === 'signin' && (
          <div className="demo-accounts">
            <h3>Portfolio demo logins</h3>
            <p>Tap a role to sign in. Password for all accounts is <code>Demo@1234</code>.</p>
            <div className="demo-account-list">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.label}
                  type="button"
                  className="demo-account-btn"
                  disabled={loading}
                  onClick={() => fillDemoAccount(account)}
                >
                  <strong>{account.label}</strong>
                  <span>{account.usernameHint}: {account.username}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ───────────────── SIGN UP ───────────────── */}
        {activeTab === 'signup' && (
          <form onSubmit={(e) => {
            e.preventDefault();
            setNotice(null);
            const formData = new FormData(e.target);
            fetch(`${API_BASE}/api/student/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                registrationNumber: formData.get('registrationNumber'),
                department: formData.get('department'),
                school: formData.get('school'),
                password: formData.get('password')
              })
            })
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  setNotice({
                    type: 'success',
                    message: 'Registration successful! You can now sign in using your Registration Number and password.',
                  });
                  setActiveTab('signin');
                } else {
                  setNotice({ type: 'error', message: 'Registration failed: ' + data.message });
                }
              })
              .catch(err => setNotice({ type: 'error', message: 'Error: ' + err.message }));
          }}>
            <div className="form-group">
              <label>First Name</label>
              <input type="text" name="firstName" placeholder="Enter first name" required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" name="lastName" placeholder="Enter last name" required />
            </div>
            <div className="form-group">
              <label>Registration Number</label>
              <input
                type="text"
                name="registrationNumber"
                placeholder="e.g., sc232/0350/2022"
                required
              />
              <small style={{ color: '#555', fontSize: '12px' }}>
                This will be your username when signing in.
              </small>
            </div>
            <div className="form-group">
              <label>Department</label>
              <select name="department" required>
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
                <option value="Civil and Building Engineering">Civil and Building Engineering</option>
                <option value="Human Resource Management">Human Resource Management</option>
                <option value="Commerce">Commerce</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Physical and Biological Science">Physical and Biological Science</option>
                <option value="Mathematics and Actuarial Science">Mathematics and Actuarial Science</option>
                <option value="Education and Technology">Education and Technology</option>
                <option value="Travel and Tourism Management">Travel and Tourism Management</option>
                <option value="Humanities">Humanities</option>
                <option value="Medical Laboratory and Pharmaceutical Sciences">Medical Laboratory and Pharmaceutical Sciences</option>
                <option value="Nursing">Nursing</option>
                <option value="Public and Community Health">Public and Community Health</option>
                <option value="Clinical Medicine">Clinical Medicine</option>
              </select>
            </div>
            <div className="form-group">
              <label>School</label>
              <select name="school" required>
                <option value="">Select School</option>
                <option value="SE">SE</option>
                <option value="SHSS">SHSS</option>
                <option value="SBE">SBE</option>
                <option value="SPAHS">SPAHS</option>
                <option value="SCIT">SCIT</option>
                <option value="SET">SET</option>
                <option value="SHTM">SHTM</option>
                <option value="SHS">SHS</option>
              </select>
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type={showSignupPassword ? 'text' : 'password'}
                name="password"
                placeholder="Create password"
                required
              />
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="showSignupPassword"
                checked={showSignupPassword}
                onChange={(e) => setShowSignupPassword(e.target.checked)}
              />
              <label htmlFor="showSignupPassword" style={{ marginBottom: 0 }}>Show password</label>
            </div>

            <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
              REGISTER
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;