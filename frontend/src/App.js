import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/login';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import CompanySupervisorDashboard from './components/CompanySupervisorDashboard';
import UniversitySupervisorDashboard from './components/UniversitySupervisorDashboard';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Restore session if "Keep me Signed in" was checked
  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      const parsed = JSON.parse(saved);
      setCurrentUser({ username: parsed.username });
      setUserRole(parsed.role);
    }
  }, []);

  const handleLogin = (user, role) => {
    setCurrentUser(user);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    setUserRole(null);
  };

  const renderDashboard = () => {
    switch (userRole) {
      case 'student':
        return <StudentDashboard user={currentUser} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
      case 'company_supervisor':
        return <CompanySupervisorDashboard user={currentUser} onLogout={handleLogout} />;
      case 'visiting_supervisor':        
        return <UniversitySupervisorDashboard user={currentUser} onLogout={handleLogout} />;
      default:
        return <Login onLogin={handleLogin} />;
    }
  };

  return (
    <div className="App">
      {!currentUser ? (
        <Login onLogin={handleLogin} />
      ) : (
        renderDashboard()
      )}
    </div>
  );
}

export default App;