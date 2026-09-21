const isProd = process.env.NODE_ENV === 'production';

/** Empty string in production so the UI talks to the same origin Flask serves. */
export const API_BASE =
  process.env.REACT_APP_API_BASE !== undefined
    ? process.env.REACT_APP_API_BASE
    : isProd
      ? ''
      : 'http://localhost:5000';

export const DEMO_ACCOUNTS = [
  {
    role: 'student',
    label: 'Student',
    username: 'SC232/DEMO/2022',
    password: 'Demo@1234',
    usernameHint: 'Registration number',
  },
  {
    role: 'admin',
    label: 'Admin',
    username: 'admin',
    password: 'Demo@1234',
    usernameHint: 'Username',
  },
  {
    role: 'company_supervisor',
    label: 'Company Supervisor',
    username: 'company.demo@iams.dev',
    password: 'Demo@1234',
    usernameHint: 'Email',
  },
  {
    role: 'visiting_supervisor',
    label: 'Visiting Supervisor',
    username: 'lecturer.demo@iams.dev',
    password: 'Demo@1234',
    usernameHint: 'Email',
  },
];
