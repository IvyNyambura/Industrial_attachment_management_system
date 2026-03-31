-- Industrial Attachment Management System Database Schema

CREATE DATABASE IF NOT EXISTS iams;
USE iams;

-- Students Table
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    school VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Industrial Registrations Table
CREATE TABLE industrial_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    supervisor_name VARCHAR(100) NOT NULL,
    supervisor_contact VARCHAR(20) NOT NULL,
    supervisor_email VARCHAR(100) NOT NULL,
    company_region VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Assumption of Duty Table (student identity lives in students; join on student_id for names / registration number)
CREATE TABLE assumption_of_duty (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    supervisor_name VARCHAR(100) NOT NULL,
    supervisor_contact VARCHAR(20) NOT NULL,
    supervisor_email VARCHAR(100) NOT NULL,
    company_region VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_assumption (student_id)
);

-- E-Logbook Entries Table
CREATE TABLE logbook_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    week_number INT NOT NULL,
    day VARCHAR(20) NOT NULL,
    job_assigned TEXT,
    skills_acquired TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_week_day (student_id, week_number, day)
);

-- Visiting Supervisors (Lecturers) Table
CREATE TABLE visiting_supervisors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    school VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    residence_region VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Company Supervisors Table (login: email + password; link to student forms via assumption_of_duty.supervisor_email)
CREATE TABLE company_supervisors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Assignments (Visiting Supervisors to Students)
CREATE TABLE student_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    supervisor_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (supervisor_id) REFERENCES visiting_supervisors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_assignment (student_id)
);

-- Company Grades Table
CREATE TABLE company_grades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    grades JSON NOT NULL,
    total_score INT NOT NULL,
    comments TEXT,
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_company_grade (student_id)
);

-- Visiting Supervisor Grades Table
CREATE TABLE visiting_grades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    grades JSON NOT NULL,
    total_score INT NOT NULL,
    remarks TEXT,
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_visiting_grade (student_id)
);

-- Reports Table
CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_report (student_id)
);

-- Admins Table
CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Remove old/incorrect indexes if they exist
DROP INDEX IF EXISTS idx_student_index ON students;

-- Indexes for the 'students' table
CREATE INDEX idx_student_registration ON students(registration_number);
CREATE INDEX idx_student_department ON students(department);
CREATE INDEX idx_student_school ON students(school);

-- Indexes for performance across related tables
CREATE INDEX idx_logbook_student_week ON logbook_entries(student_id, week_number);
CREATE INDEX idx_assignment_student ON student_assignments(student_id);
CREATE INDEX idx_grades_student ON company_grades(student_id);
CREATE INDEX idx_visiting_grades_student ON visiting_grades(student_id);