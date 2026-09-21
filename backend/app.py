import os

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

import pymysql
pymysql.install_as_MySQLdb()

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_mysqldb import MySQL
from werkzeug.security import generate_password_hash, check_password_hash

from validation import (
    validate_assumption_duty,
    validate_company_supervisor_payload,
    validate_lecturer_payload,
    validate_login_payload,
    validate_score_int,
    validate_student_register,
)

app = Flask(__name__, static_folder=None)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'iams-change-me')

_cors_origins = os.getenv('CORS_ORIGINS', '*')
CORS(app, origins=[o.strip() for o in _cors_origins.split(',')] if _cors_origins != '*' else '*')

# MySQL Configuration
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', '')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'iams')
app.config['MYSQL_PORT'] = int(os.getenv('MYSQL_PORT', '3306'))
app.config['MYSQL_CURSORCLASS'] = 'DictCursor'

mysql = MySQL(app)

FRONTEND_BUILD = os.getenv(
    'FRONTEND_BUILD',
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build')),
)

# ─────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────

def get_cursor():
    return mysql.connection.cursor()


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'success': True, 'status': 'ok'})


# ─────────────────────────────────────────────
# Authentication Routes
# ─────────────────────────────────────────────

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    err, creds = validate_login_payload(data, require_username=True)
    if err:
        return jsonify({'success': False, 'message': err}), 400
    username = creds['username']
    password = creds['password']
    role = data.get('role', 'student')

    cursor = None
    try:
        cursor = get_cursor()
        if role == 'admin':
            cursor.execute("SELECT * FROM admins WHERE username = %s", (username,))
        elif role == 'company_supervisor':
            cursor.execute("SELECT * FROM company_supervisors WHERE email = %s", (username,))
        elif role == 'visiting_supervisor':
            cursor.execute("SELECT * FROM visiting_supervisors WHERE email = %s", (username,))
        else:
            cursor.execute("SELECT * FROM students WHERE registration_number = %s", (username,))

        user = cursor.fetchone()

        if user and check_password_hash(user['password'], password):
            return jsonify({'success': True, 'user': {'id': user['id'], 'username': username, 'role': role}})
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json or {}
    err, creds = validate_login_payload(data, require_username=False)
    if err:
        return jsonify({'success': False, 'message': err}), 400
    password = creds['password']
    ADMIN_USERNAME = 'admin'

    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute("SELECT * FROM admins WHERE username = %s", (ADMIN_USERNAME,))
        admin = cursor.fetchone()

        if admin and check_password_hash(admin['password'], password):
            return jsonify({'success': True, 'user': {'id': admin['id'], 'username': ADMIN_USERNAME, 'role': 'admin'}})
        return jsonify({'success': False, 'message': 'Invalid admin credentials'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# ─────────────────────────────────────────────
# Student Routes
# ─────────────────────────────────────────────

@app.route('/api/student/register', methods=['POST'])
def register_student():
    data = request.json or {}
    err, v = validate_student_register(data)
    if err:
        return jsonify({'success': False, 'message': err}), 400

    cursor = None
    try:
        cursor = get_cursor()
        password_hash = generate_password_hash(v['password'])

        cursor.execute(
            """INSERT INTO students (
                 first_name, last_name, registration_number, department, school, password
               )
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (
                v['firstName'],
                v['lastName'],
                v['registrationNumber'],
                v['department'],
                v['school'],
                password_hash,
            )
        )
        mysql.connection.commit()
        return jsonify({'success': True, 'message': 'Student registered successfully'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/student/profile/<registration_number>', methods=['GET'])
def get_student_profile(registration_number):
    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute("SELECT * FROM students WHERE registration_number = %s", (registration_number,))
        student = cursor.fetchone()
        if student:
            student.pop('password', None)  # never send password back
            return jsonify({'success': True, 'student': student})
        return jsonify({'success': False, 'message': 'Student not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# ─────────────────────────────────────────────
# Industrial Attachment / Assumption Letter
# ─────────────────────────────────────────────

@app.route('/api/student/assumption', methods=['POST'])
def save_assumption():
    """Save student industrial attachment (assumption) details."""
    data = request.json or {}
    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            """INSERT INTO student_assumptions
               (student_id, company_name, company_address, supervisor_name,
                supervisor_phone, start_date, end_date)
               VALUES (
                 (SELECT id FROM students WHERE registration_number = %s),
                 %s, %s, %s, %s, %s, %s
               )
               ON DUPLICATE KEY UPDATE
                 company_name      = VALUES(company_name),
                 company_address   = VALUES(company_address),
                 supervisor_name   = VALUES(supervisor_name),
                 supervisor_phone  = VALUES(supervisor_phone),
                 start_date        = VALUES(start_date),
                 end_date          = VALUES(end_date)""",
            (
                data['registrationNumber'],
                data['companyName'],
                data['companyAddress'],
                data['supervisorName'],
                data['supervisorPhone'],
                data['startDate'],
                data['endDate'],
            )
        )
        mysql.connection.commit()
        return jsonify({'success': True, 'message': 'Assumption details saved successfully'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/student/assumption/<registration_number>', methods=['GET'])
def get_assumption(registration_number):
    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            """SELECT sa.* FROM student_assumptions sa
               JOIN students s ON s.id = sa.student_id
               WHERE s.registration_number = %s""",
            (registration_number,)
        )
        assumption = cursor.fetchone()
        return jsonify({'success': True, 'assumption': assumption})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/student/assumption-duty', methods=['POST'])
def save_assumption_duty():
    """Frontend-compatible endpoint: save Assumption of Duty form."""
    data = request.json or {}
    err, v = validate_assumption_duty(data)
    if err:
        return jsonify({'success': False, 'message': err}), 400

    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            """INSERT INTO assumption_of_duty (
                 student_id,
                 company_name,
                 supervisor_name,
                 supervisor_contact,
                 supervisor_email,
                 company_region,
                 address
               )
               VALUES (
                 (SELECT id FROM students WHERE registration_number = %s),
                 %s, %s, %s, %s, %s, %s
               )
               ON DUPLICATE KEY UPDATE
                 company_name       = VALUES(company_name),
                 supervisor_name    = VALUES(supervisor_name),
                 supervisor_contact = VALUES(supervisor_contact),
                 supervisor_email   = VALUES(supervisor_email),
                 company_region     = VALUES(company_region),
                 address            = VALUES(address)""",
            (
                v['indexNumber'],
                v['companyName'],
                v['supervisorName'],
                v['supervisorContact'],
                v['supervisorEmail'],
                v['companyRegion'],
                v['address'],
            )
        )

        mysql.connection.commit()
        return jsonify({'success': True, 'message': 'Assumption of duty saved successfully'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# ─────────────────────────────────────────────
# E-Logbook
# ─────────────────────────────────────────────

@app.route('/api/student/logbook', methods=['POST'])
def save_logbook():
    data = request.json or {}
    cursor = None
    try:
        cursor = get_cursor()
        index_number = data.get('indexNumber') or data.get('registrationNumber')
        week_number = data.get('weekNumber')

        if not index_number or week_number is None:
            return jsonify({'success': False, 'message': 'Missing indexNumber or weekNumber'}), 400

        for day, entries in data.get('weekData', {}).items():
            cursor.execute(
                """INSERT INTO logbook_entries
                   (student_id, week_number, day, job_assigned, skills_acquired)
                   VALUES (
                     (SELECT id FROM students WHERE registration_number = %s),
                     %s, %s, %s, %s
                   )
                   ON DUPLICATE KEY UPDATE
                     job_assigned     = VALUES(job_assigned),
                     skills_acquired  = VALUES(skills_acquired)""",
                (
                    index_number,
                    week_number,
                    day,
                    entries.get('job', ''),
                    entries.get('skill', ''),
                )
            )
        mysql.connection.commit()
        return jsonify({'success': True, 'message': 'Logbook saved successfully'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/student/logbook/<registration_number>', methods=['GET'])
def get_logbook(registration_number):
    """Fetch all logbook entries for a student."""
    cursor = None
    try:
        cursor = get_cursor()
        week = request.args.get('week')
        if week:
            cursor.execute(
                """SELECT le.* FROM logbook_entries le
                   JOIN students s ON s.id = le.student_id
                   WHERE s.registration_number = %s AND le.week_number = %s
                   ORDER BY le.day""",
                (registration_number, week)
            )
        else:
            cursor.execute(
                """SELECT le.* FROM logbook_entries le
                   JOIN students s ON s.id = le.student_id
                   WHERE s.registration_number = %s
                   ORDER BY le.week_number, le.day""",
                (registration_number,)
            )
        entries = cursor.fetchall()
        return jsonify({'success': True, 'entries': entries})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# ─────────────────────────────────────────────
# Reports Upload / Retrieval
# ─────────────────────────────────────────────

@app.route('/api/student/report', methods=['POST'])
def save_report():
    """Save a student report file."""
    cursor = None
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file provided'}), 400

        file = request.files['file']
        index_number = request.form.get('indexNumber') or request.form.get('registrationNumber')

        if not index_number:
            return jsonify({'success': False, 'message': 'Missing indexNumber'}), 400

        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'}), 400

        upload_folder = os.getenv('UPLOAD_FOLDER', 'uploads/reports')
        os.makedirs(upload_folder, exist_ok=True)

        # Registration numbers may contain '/' which would be interpreted as folders.
        safe_index_number = str(index_number).replace('/', '_')
        filename = f"{safe_index_number}_{file.filename}"
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)

        cursor = get_cursor()
        cursor.execute(
            """INSERT INTO reports (student_id, filename, filepath)
               VALUES (
                 (SELECT id FROM students WHERE registration_number = %s),
                 %s, %s
               )
               ON DUPLICATE KEY UPDATE
                 filename = VALUES(filename),
                 filepath = VALUES(filepath)""",
            (index_number, filename, filepath)
        )

        mysql.connection.commit()
        return jsonify({'success': True, 'message': 'Report uploaded successfully'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/student/reports/<registration_number>', methods=['GET'])
def get_reports(registration_number):
    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            """SELECT r.* FROM reports r
               JOIN students s ON s.id = r.student_id
               WHERE s.registration_number = %s
               ORDER BY r.uploaded_at DESC""",
            (registration_number,)
        )
        reports = cursor.fetchall()
        return jsonify({'success': True, 'reports': reports})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# ─────────────────────────────────────────────
# NEW: Reports visible to a visiting supervisor's assigned students
# ─────────────────────────────────────────────

@app.route('/api/supervisor/visiting/reports', methods=['GET'])
def get_visiting_supervisor_reports():
    """
    Return the reports uploaded by every student who is assigned
    (via student_assignments) to this visiting supervisor.
    Query param: supervisorId
    """
    supervisor_id = request.args.get('supervisorId')
    if not supervisor_id:
        return jsonify({'success': False, 'message': 'Missing supervisorId'}), 400

    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            """SELECT r.id, r.filename, r.filepath, r.uploaded_at,
                      s.id AS student_id, s.registration_number,
                      s.first_name, s.last_name
               FROM reports r
               JOIN student_assignments sa ON sa.student_id = r.student_id
               JOIN students s ON s.id = r.student_id
               WHERE sa.supervisor_id = %s
               ORDER BY r.uploaded_at DESC""",
            (supervisor_id,)
        )
        reports = cursor.fetchall()
        return jsonify({'success': True, 'reports': reports})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# ─────────────────────────────────────────────
# NEW: Serve an uploaded report file (view/download)
# ─────────────────────────────────────────────

@app.route('/api/reports/download/<int:report_id>', methods=['GET'])
def download_report(report_id):
    """
    Serve a report file for viewing/downloading. Only lets a visiting
    supervisor download it if they are actually assigned to that report's
    student (via student_assignments) - same ownership check pattern as
    the reports-list and grading routes above.
    Query param: supervisorId
    """
    supervisor_id = request.args.get('supervisorId')
    if not supervisor_id:
        return jsonify({'success': False, 'message': 'Missing supervisorId'}), 400

    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            """SELECT r.filepath, r.filename
               FROM reports r
               JOIN student_assignments sa ON sa.student_id = r.student_id
               WHERE r.id = %s AND sa.supervisor_id = %s""",
            (report_id, supervisor_id)
        )
        report = cursor.fetchone()
        if not report:
            return jsonify({'success': False, 'message': 'Report not found or not authorized'}), 404

        directory = os.path.dirname(os.path.abspath(report['filepath']))
        filename = os.path.basename(report['filepath'])
        return send_from_directory(
            directory, filename, as_attachment=True, download_name=report['filename']
        )
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# ─────────────────────────────────────────────
# Company/Visiting Grades (Frontend-compatible endpoints)
# ─────────────────────────────────────────────

@app.route('/api/grade/company', methods=['POST'])
def save_company_grade():
    """Company supervisor submits a total company score out of 20."""
    import json

    data = request.json or {}
    cursor = None
    try:
        index_number = data.get('indexNumber') or data.get('registrationNumber')
        if not index_number:
            return jsonify({'success': False, 'message': 'Missing indexNumber'}), 400

        err, total_score = validate_score_int(data.get('totalScore'), 'Company total score', 0, 20)
        if err:
            return jsonify({'success': False, 'message': err}), 400

        cursor = get_cursor()
        cursor.execute(
            """INSERT INTO company_grades (
                 student_id, grades, total_score, comments
               )
               VALUES (
                 (SELECT id FROM students WHERE registration_number = %s),
                 %s, %s, %s
               )
               ON DUPLICATE KEY UPDATE
                 grades      = VALUES(grades),
                 total_score = VALUES(total_score),
                 comments    = VALUES(comments)""",
            (
                index_number,
                json.dumps(data.get('grades', {})),
                total_score,
                data.get('comments', '')
            )
        )

        mysql.connection.commit()
        return jsonify({'success': True, 'message': 'Company grade saved successfully'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/grade/visiting', methods=['POST'])
def save_visiting_grade():
    """University (visiting) supervisor submits total university score out of 80."""
    import json

    data = request.json or {}
    cursor = None
    try:
        index_number = data.get('indexNumber') or data.get('registrationNumber')
        if not index_number:
            return jsonify({'success': False, 'message': 'Missing indexNumber'}), 400

        err, total_score = validate_score_int(data.get('totalScore'), 'University total score', 0, 80)
        if err:
            return jsonify({'success': False, 'message': err}), 400

        cursor = get_cursor()
        cursor.execute(
            """INSERT INTO visiting_grades (
                 student_id, grades, total_score, remarks
               )
               VALUES (
                 (SELECT id FROM students WHERE registration_number = %s),
                 %s, %s, %s
               )
               ON DUPLICATE KEY UPDATE
                 grades      = VALUES(grades),
                 total_score = VALUES(total_score),
                 remarks     = VALUES(remarks)""",
            (
                index_number,
                json.dumps(data.get('grades', {})),
                total_score,
                data.get('remarks', data.get('comments', ''))
            )
        )

        mysql.connection.commit()
        return jsonify({'success': True, 'message': 'Visiting grade saved successfully'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/grades/company', methods=['POST'])
def save_company_grades():
    """Company supervisor submits grades for a student."""
    data = request.json or {}
    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            """INSERT INTO company_grades
               (student_id, supervisor_id, punctuality, dress_code,
                technical_skills, communication, total_score, comments)
               VALUES (
                 (SELECT id FROM students WHERE registration_number = %s),
                 %s, %s, %s, %s, %s, %s, %s
               )
               ON DUPLICATE KEY UPDATE
                 punctuality      = VALUES(punctuality),
                 dress_code       = VALUES(dress_code),
                 technical_skills = VALUES(technical_skills),
                 communication    = VALUES(communication),
                 total_score      = VALUES(total_score),
                 comments         = VALUES(comments)""",
            (
                data['registrationNumber'],
                data.get('supervisorId'),
                data.get('punctuality', 0),
                data.get('dressCode', 0),
                data.get('technicalSkills', 0),
                data.get('communication', 0),
                data.get('totalScore', 0),
                data.get('comments', ''),
            )
        )
        mysql.connection.commit()
        return jsonify({'success': True, 'message': 'Company grades saved successfully'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/grades/company/<registration_number>', methods=['GET'])
def get_company_grades(registration_number):
    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            """SELECT cg.* FROM company_grades cg
               JOIN students s ON s.id = cg.student_id
               WHERE s.registration_number = %s""",
            (registration_number,)
        )
        grades = cursor.fetchone()
        return jsonify({'success': True, 'grades': grades})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# ─────────────────────────────────────────────
# Visiting / University Supervisor Grades
# ─────────────────────────────────────────────

@app.route('/api/grades/visiting', methods=['POST'])
def save_visiting_grades():
    """
    Visiting supervisor submits grades for a student.

    Writes to the ACTUAL visiting_grades columns (student_id, grades,
    total_score, remarks) - the previous version of this route referenced
    columns (supervisor_id, logbook_score, report_score, presentation_score,
    comments) that don't exist on this table and would have failed at
    runtime. Detailed per-criterion scores now go inside the `grades` JSON
    blob instead of separate columns.

    Also verifies the supervisor is actually the one assigned to this
    student (via student_assignments) before writing the grade.
    """
    import json

    data = request.json or {}
    cursor = None
    try:
        supervisor_id = data.get('supervisorId')
        registration_number = data.get('registrationNumber')

        if not registration_number or not supervisor_id:
            return jsonify({'success': False, 'message': 'Missing registrationNumber or supervisorId'}), 400

        cursor = get_cursor()

        # Ownership check: this supervisor must be assigned to this student.
        cursor.execute(
            """SELECT 1 FROM student_assignments sa
               JOIN students s ON s.id = sa.student_id
               WHERE s.registration_number = %s AND sa.supervisor_id = %s""",
            (registration_number, supervisor_id)
        )
        if not cursor.fetchone():
            return jsonify({'success': False, 'message': 'Not your assigned student'}), 403

        grades_payload = data.get('grades', {})
        total_score = data.get('totalScore', 0)
        remarks = data.get('remarks', data.get('comments', ''))

        cursor.execute(
            """INSERT INTO visiting_grades (student_id, grades, total_score, remarks)
               VALUES (
                 (SELECT id FROM students WHERE registration_number = %s),
                 %s, %s, %s
               )
               ON DUPLICATE KEY UPDATE
                 grades      = VALUES(grades),
                 total_score = VALUES(total_score),
                 remarks     = VALUES(remarks)""",
            (
                registration_number,
                json.dumps(grades_payload),
                total_score,
                remarks,
            )
        )
        mysql.connection.commit()
        return jsonify({'success': True, 'message': 'Visiting grades saved successfully'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/grades/visiting/<registration_number>', methods=['GET'])
def get_visiting_grades(registration_number):
    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            """SELECT vg.* FROM visiting_grades vg
               JOIN students s ON s.id = vg.student_id
               WHERE s.registration_number = %s""",
            (registration_number,)
        )
        grades = cursor.fetchone()
        return jsonify({'success': True, 'grades': grades})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# ─────────────────────────────────────────────
# Admin: Lecturer (Visiting Supervisor) Management
# ─────────────────────────────────────────────

@app.route('/api/admin/lecturers', methods=['GET'])
def get_lecturers():
    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            "SELECT id, name, school, department, phone, residence_region, email FROM visiting_supervisors"
        )
        lecturers = cursor.fetchall()
        return jsonify({'success': True, 'lecturers': lecturers})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/admin/add-lecturer', methods=['POST'])
def add_lecturer():
    data = request.json or {}
    err, v = validate_lecturer_payload(data)
    if err:
        return jsonify({'success': False, 'message': err}), 400

    cursor = None
    try:
        pw = v['password'] if v['password'] is not None else 'default123'
        hashed_password = generate_password_hash(pw)
        cursor = get_cursor()
        cursor.execute(
            """INSERT INTO visiting_supervisors
               (name, school, department, phone, residence_region, email, password)
               VALUES (%s, %s, %s, %s, %s, %s, %s)""",
            (
                v['name'],
                v['school'],
                v['department'],
                v['phone'],
                v['residenceRegion'],
                v['email'],
                hashed_password,
            )
        )
        mysql.connection.commit()
        return jsonify({'success': True, 'message': 'Lecturer added successfully'}), 201
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'message': str(e)}), 400
    finally:
        if cursor:
            cursor.close()


@app.route('/api/admin/lecturer/<int:lecturer_id>', methods=['PUT'])
def update_lecturer(lecturer_id):
    data = request.json or {}
    err, v = validate_lecturer_payload(data)
    if err:
        return jsonify({'success': False, 'message': err}), 400

    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            """UPDATE visiting_supervisors
               SET name=%s,school=%s,department=%s,phone=%s,residence_region=%s,email=%s
               WHERE id=%s""",
            (
                v['name'], v['school'], v['department'],
                v['phone'], v['residenceRegion'], v['email'],
                lecturer_id,
            )
        )
        mysql.connection.commit()
        return jsonify({'success': True, 'message': 'Lecturer updated successfully'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/admin/lecturer/<int:lecturer_id>', methods=['DELETE'])
def delete_lecturer(lecturer_id):
    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute("DELETE FROM visiting_supervisors WHERE id = %s", (lecturer_id,))
        mysql.connection.commit()
        return jsonify({'success': True, 'message': 'Lecturer deleted successfully'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/admin/company-supervisors', methods=['GET'])
def get_company_supervisors():
    """List company supervisor accounts (no passwords)."""
    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            "SELECT id, name, company_name, phone, email FROM company_supervisors ORDER BY name"
        )
        rows = cursor.fetchall()
        return jsonify({'success': True, 'supervisors': rows})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/admin/add-company-supervisor', methods=['POST'])
def add_company_supervisor():
    """
    Create a company supervisor login. Password is stored in company_supervisors.password (hashed).
    Students' assumption_of_duty.supervisor_email should match this email so they can be linked for dashboards/APIs.
    """
    data = request.json or {}
    err, v = validate_company_supervisor_payload(data)
    if err:
        return jsonify({'success': False, 'message': err}), 400

    cursor = None
    try:
        pw = v['password'] if v['password'] is not None else 'default123'
        hashed = generate_password_hash(pw)
        cursor = get_cursor()
        cursor.execute(
            """INSERT INTO company_supervisors (name, company_name, phone, email, password)
               VALUES (%s, %s, %s, %s, %s)""",
            (v['name'], v['companyName'], v['phone'], v['email'], hashed),
        )
        mysql.connection.commit()
        return jsonify({'success': True, 'message': 'Company supervisor added successfully'}), 201
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'message': str(e)}), 400
    finally:
        if cursor:
            cursor.close()


@app.route('/api/admin/assign-university-supervisors', methods=['POST'])
def assign_university_supervisors():
    """
    Assign visiting supervisors (lecturers) to students.

    mode=region  -> lecturer.residence_region must match `region`
    mode=school  -> lecturer.school must match `school`
    """
    data = request.json or {}
    mode = data.get('mode')

    cursor = None
    try:
        cursor = get_cursor()

        if mode == 'region':
            region = data.get('region')
            if not region:
                return jsonify({'success': False, 'message': 'region is required'}), 400

            cursor.execute(
                "SELECT id FROM visiting_supervisors WHERE residence_region = %s",
                (region,)
            )
            lecturers = cursor.fetchall()
            lecturer_ids = [l['id'] for l in lecturers]
            if not lecturer_ids:
                return jsonify({'success': False, 'message': f'No lecturers found for residence region: {region}'}), 400

            cursor.execute(
                """SELECT student_id
                   FROM (
                     SELECT student_id FROM assumption_of_duty WHERE company_region = %s
                     UNION
                     SELECT student_id FROM industrial_registrations WHERE company_region = %s
                   ) t""",
                (region, region)
            )
            rows = cursor.fetchall()
            student_ids = [r['student_id'] for r in rows]
            if not student_ids:
                return jsonify({'success': False, 'message': f'No students found with company region: {region}'}), 400

            assigned_count = 0
            for i, student_id in enumerate(student_ids):
                supervisor_id = lecturer_ids[i % len(lecturer_ids)]
                cursor.execute(
                    """INSERT INTO student_assignments (student_id, supervisor_id)
                       VALUES (%s, %s)
                       ON DUPLICATE KEY UPDATE
                         supervisor_id = VALUES(supervisor_id)""",
                    (student_id, supervisor_id)
                )
                assigned_count += 1

            mysql.connection.commit()
            return jsonify({
                'success': True,
                'message': f'Assigned university supervisors to {assigned_count} students for region {region}.',
                'assignedCount': assigned_count
            })

        if mode == 'school':
            school = data.get('school')
            if not school:
                return jsonify({'success': False, 'message': 'school is required'}), 400

            cursor.execute(
                "SELECT id FROM visiting_supervisors WHERE school = %s",
                (school,)
            )
            lecturers = cursor.fetchall()
            lecturer_ids = [l['id'] for l in lecturers]
            if not lecturer_ids:
                return jsonify({'success': False, 'message': f'No lecturers found for school: {school}'}), 400

            cursor.execute(
                "SELECT id FROM students WHERE school = %s",
                (school,)
            )
            rows = cursor.fetchall()
            student_ids = [r['id'] for r in rows]
            if not student_ids:
                return jsonify({'success': False, 'message': f'No students found for school: {school}'}), 400

            assigned_count = 0
            for i, student_id in enumerate(student_ids):
                supervisor_id = lecturer_ids[i % len(lecturer_ids)]
                cursor.execute(
                    """INSERT INTO student_assignments (student_id, supervisor_id)
                       VALUES (%s, %s)
                       ON DUPLICATE KEY UPDATE
                         supervisor_id = VALUES(supervisor_id)""",
                    (student_id, supervisor_id)
                )
                assigned_count += 1

            mysql.connection.commit()
            return jsonify({
                'success': True,
                'message': f'Assigned university supervisors to {assigned_count} students for school {school}.',
                'assignedCount': assigned_count
            })

        return jsonify({'success': False, 'message': 'Invalid mode. Use mode=\"region\" or mode=\"school\".'}), 400

    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/admin/student-assignments', methods=['GET'])
def get_student_assignments():
    """Return (student -> visiting supervisor) assignments for admin UI."""
    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            """SELECT
                 s.id AS student_id,
                 CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                 s.registration_number AS index_number,
                 s.department AS programme,
                 vs.id AS supervisor_id,
                 vs.name AS supervisor_name,
                 vs.phone AS supervisor_phone,
                 vs.email AS supervisor_email,
                 vs.school AS supervisor_school,
                 vs.department AS supervisor_department,
                 vs.residence_region AS supervisor_residence_region
               FROM student_assignments sa
               JOIN students s ON s.id = sa.student_id
               JOIN visiting_supervisors vs ON vs.id = sa.supervisor_id
               ORDER BY s.registration_number"""
        )
        assignments = cursor.fetchall()
        return jsonify({'success': True, 'assignments': assignments})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# ─────────────────────────────────────────────
# Admin: Students Management
# ─────────────────────────────────────────────

@app.route('/api/admin/students', methods=['GET'])
def get_all_students():
    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            """SELECT
                 s.id,
                 s.first_name,
                 s.last_name,
                 s.registration_number AS index_number,
                 s.department AS programme,
                 CASE
                   WHEN ir.id IS NOT NULL THEN 'Industrial Registration'
                   ELSE 'Vira Registration'
                 END AS registration_type
               FROM students s
               LEFT JOIN industrial_registrations ir ON s.id = ir.student_id"""
        )
        students = cursor.fetchall()
        return jsonify({'success': True, 'students': students})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/admin/assumptions', methods=['GET'])
def get_assumptions_for_admin():
    """Fetch student assumptions of duty for the admin dashboard."""
    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            """SELECT
                 s.id,
                 s.first_name,
                 s.last_name,
                 s.registration_number AS index_number,
                 s.department AS programme,
                 COALESCE(a.supervisor_name, ir.supervisor_name)    AS supervisor_name,
                 COALESCE(a.supervisor_contact, ir.supervisor_contact) AS supervisor_contact,
                 COALESCE(a.supervisor_email, ir.supervisor_email) AS supervisor_email,
                 COALESCE(a.company_name, ir.company_name)         AS company_name,
                 COALESCE(a.company_region, ir.company_region)     AS company_region,
                 COALESCE(a.address, ir.address)                   AS address
               FROM students s
               LEFT JOIN assumption_of_duty a ON s.id = a.student_id
               LEFT JOIN industrial_registrations ir ON s.id = ir.student_id
               WHERE a.id IS NOT NULL OR ir.id IS NOT NULL"""
        )
        assumptions = cursor.fetchall()
        return jsonify({'success': True, 'assumptions': assumptions})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


@app.route('/api/admin/student/<int:student_id>', methods=['DELETE'])
def delete_student(student_id):
    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute("DELETE FROM students WHERE id = %s", (student_id,))
        mysql.connection.commit()
        return jsonify({'success': True, 'message': 'Student deleted successfully'})
    except Exception as e:
        mysql.connection.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# ─────────────────────────────────────────────
# Admin: Scores Summary
# ─────────────────────────────────────────────

@app.route('/api/admin/scores/summary', methods=['GET'])
def get_scores_summary():
    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            """SELECT
                 s.id,
                 s.first_name,
                 s.last_name,
                 s.registration_number AS index_number,
                 s.registration_number AS registration_number,
                 s.department AS programme,
                 COALESCE(vg.total_score, 0)                                  AS university_total,
                 COALESCE(cg.total_score, 0)                                  AS company_total,
                 (COALESCE(vg.total_score, 0) + COALESCE(cg.total_score, 0))  AS overall_total
               FROM students s
               LEFT JOIN visiting_grades vg ON s.id = vg.student_id
               LEFT JOIN company_grades  cg ON s.id = cg.student_id"""
        )
        scores = cursor.fetchall()
        return jsonify({'success': True, 'scores': scores})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# ─────────────────────────────────────────────
# Company Supervisor Routes
# ─────────────────────────────────────────────

@app.route('/api/supervisor/students', methods=['GET'])
def get_supervisor_students():
    """Get students whose assumption_of_duty supervisor email matches this company supervisor account."""
    supervisor_id = request.args.get('supervisorId')
    cursor = None
    try:
        cursor = get_cursor()
        cursor.execute(
            """SELECT s.id, s.first_name, s.last_name, s.registration_number, s.department
               FROM students s
               JOIN assumption_of_duty a ON a.student_id = s.id
               JOIN company_supervisors cs ON cs.id = %s
               WHERE LOWER(TRIM(a.supervisor_email)) = LOWER(TRIM(cs.email))""",
            (supervisor_id,)
        )
        students = cursor.fetchall()
        return jsonify({'success': True, 'students': students})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if cursor:
            cursor.close()


# ─────────────────────────────────────────────
# Frontend (production build) + Entry Point
# ─────────────────────────────────────────────

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path.startswith('api/'):
        return jsonify({'success': False, 'message': 'Not found'}), 404
    if os.path.isdir(FRONTEND_BUILD):
        file_path = os.path.join(FRONTEND_BUILD, path)
        if path and os.path.isfile(file_path):
            return send_from_directory(FRONTEND_BUILD, path)
        index = os.path.join(FRONTEND_BUILD, 'index.html')
        if os.path.isfile(index):
            return send_from_directory(FRONTEND_BUILD, 'index.html')
    return jsonify({
        'success': False,
        'message': 'API is running. Build the React app or set FRONTEND_BUILD.',
    }), 404


if __name__ == '__main__':
    os.makedirs(os.getenv('UPLOAD_FOLDER', 'uploads/reports'), exist_ok=True)
    debug = os.getenv('DEBUG', 'true').lower() in ('1', 'true', 'yes')
    port = int(os.getenv('PORT', '5000'))
    app.run(debug=debug, host='0.0.0.0', port=port)