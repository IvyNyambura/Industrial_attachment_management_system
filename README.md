 Overview
IASMS is a full-stack web application designed to streamline the entire industrial attachment process for university students. The system manages everything from initial company registration to final grading and report submission.
Key Objectives:

1. Digitize the industrial attachment workflow
2. Enable real-time tracking of student progress
3. Facilitate communication between students, company supervisors, and university lecturers
4. Provide GPS-verified company locations for site visits
5. Automate grading and report submission


Features
Student Features

Self-registration with secure authentication
Assumption of Duty form submission
Weekly E-Logbook (12 weeks tracking)
GPS location pinning with Google Maps integration
View grades from company and visiting supervisors
Final report upload

Company Supervisor Features

Auto-created account when student submits Assumption form
View assigned students
Grade student performance
Provide feedback and comments

Visiting Supervisor (Lecturer) Features

View assigned students with company locations
Get directions to company sites via Google Maps
Review student logbooks
Grade student performance
Add remarks and recommendations

Admin Features

Manage student records
Add visiting supervisors (lecturers)
Assign supervisors to students
Generate reports and analytics
System configuration


Tech Stack
Frontend

React 18.2.0 - Component-based UI library
JavaScript (ES6+) - Programming language
HTML5 & CSS3 - Markup and styling
Google Maps Embed API - Location mapping
Geolocation API - GPS coordinates

Backend

Flask 2.3.3 - Python web framework
Python 3.8+ - Server-side programming
Flask-CORS - Cross-origin resource sharing
Flask-MySQLdb - MySQL database connector
Werkzeug - Password hashing (scrypt)
python-dotenv - Environment variable management

Database

MySQL 8.0 - Relational database management system
11 Tables - Normalized schema design

APIs & Services

Google Maps Embed API - Interactive maps
OpenStreetMap Nominatim - Reverse geocoding
RESTful API - JSON-based communication
