"""Create (or reset) public demo accounts used on the login page."""
import json
import os
import sys

from werkzeug.security import generate_password_hash

from db_util import connect

DEMO_PASSWORD = os.getenv('DEMO_PASSWORD', 'Demo@1234')

STUDENT_REG = 'SC232/DEMO/2022'
ADMIN_USERNAME = 'admin'
COMPANY_EMAIL = 'company.demo@iams.dev'
LECTURER_EMAIL = 'lecturer.demo@iams.dev'


def upsert(cursor, sql, params):
    cursor.execute(sql, params)


def seed(connection=None):
    own = connection is None
    conn = connection or connect()
    try:
        cursor = conn.cursor()
        hashed = generate_password_hash(DEMO_PASSWORD)

        upsert(
            cursor,
            """
            INSERT INTO admins (username, password, full_name, email)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
              password = VALUES(password),
              full_name = VALUES(full_name),
              email = VALUES(email)
            """,
            (ADMIN_USERNAME, hashed, 'IAMS Demo Admin', 'admin.demo@iams.dev'),
        )

        upsert(
            cursor,
            """
            INSERT INTO students (
              first_name, last_name, registration_number, department, school, password
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
              first_name = VALUES(first_name),
              last_name = VALUES(last_name),
              department = VALUES(department),
              school = VALUES(school),
              password = VALUES(password)
            """,
            ('Amina', 'Otieno', STUDENT_REG, 'Computer Science', 'SCIT', hashed),
        )

        upsert(
            cursor,
            """
            INSERT INTO visiting_supervisors
              (name, school, department, phone, residence_region, email, password)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              school = VALUES(school),
              department = VALUES(department),
              phone = VALUES(phone),
              residence_region = VALUES(residence_region),
              password = VALUES(password)
            """,
            (
                'Dr. Jane Mwangi',
                'SCIT',
                'Computer Science',
                '0712345678',
                'Nairobi',
                LECTURER_EMAIL,
                hashed,
            ),
        )

        upsert(
            cursor,
            """
            INSERT INTO company_supervisors (name, company_name, phone, email, password)
            VALUES (%s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name),
              company_name = VALUES(company_name),
              phone = VALUES(phone),
              password = VALUES(password)
            """,
            ('Peter Kamau', 'Horizon Tech Ltd', '0723456789', COMPANY_EMAIL, hashed),
        )

        cursor.execute(
            "SELECT id FROM students WHERE registration_number = %s",
            (STUDENT_REG,),
        )
        student = cursor.fetchone()
        cursor.execute(
            "SELECT id FROM visiting_supervisors WHERE email = %s",
            (LECTURER_EMAIL,),
        )
        lecturer = cursor.fetchone()
        if not student or not lecturer:
            raise RuntimeError('Failed to resolve demo student or lecturer ids')

        student_id = student['id']
        lecturer_id = lecturer['id']

        upsert(
            cursor,
            """
            INSERT INTO assumption_of_duty (
              student_id, company_name, supervisor_name, supervisor_contact,
              supervisor_email, company_region, address
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
              company_name = VALUES(company_name),
              supervisor_name = VALUES(supervisor_name),
              supervisor_contact = VALUES(supervisor_contact),
              supervisor_email = VALUES(supervisor_email),
              company_region = VALUES(company_region),
              address = VALUES(address)
            """,
            (
                student_id,
                'Horizon Tech Ltd',
                'Peter Kamau',
                '0723456789',
                COMPANY_EMAIL,
                'Nairobi',
                'Kenya National Library, Nairobi',
            ),
        )

        upsert(
            cursor,
            """
            INSERT INTO student_assignments (student_id, supervisor_id)
            VALUES (%s, %s)
            ON DUPLICATE KEY UPDATE supervisor_id = VALUES(supervisor_id)
            """,
            (student_id, lecturer_id),
        )

        logbook_days = [
            ('Monday', 'Onboarded to the intern portal and reviewed coding standards.', 'Git, team workflow'),
            ('Tuesday', 'Fixed login validation bugs on the student dashboard.', 'Debugging, REST APIs'),
            ('Wednesday', 'Wrote weekly logbook UI states and empty-state copy.', 'React, UX writing'),
            ('Thursday', 'Paired on supervisor grading totals out of 20 and 80.', 'Testing, scoring rules'),
            ('Friday', 'Presented intern progress to the company supervisor.', 'Communication'),
        ]
        for day, job, skill in logbook_days:
            upsert(
                cursor,
                """
                INSERT INTO logbook_entries
                  (student_id, week_number, day, job_assigned, skills_acquired)
                VALUES (%s, 1, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                  job_assigned = VALUES(job_assigned),
                  skills_acquired = VALUES(skills_acquired)
                """,
                (student_id, day, job, skill),
            )

        upsert(
            cursor,
            """
            INSERT INTO company_grades (student_id, grades, total_score, comments)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
              grades = VALUES(grades),
              total_score = VALUES(total_score),
              comments = VALUES(comments)
            """,
            (
                student_id,
                json.dumps({'punctuality': 4, 'communication': 4, 'technical': 4}),
                16,
                'Reliable intern. Strong communication with the team.',
            ),
        )

        upsert(
            cursor,
            """
            INSERT INTO visiting_grades (student_id, grades, total_score, remarks)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
              grades = VALUES(grades),
              total_score = VALUES(total_score),
              remarks = VALUES(remarks)
            """,
            (
                student_id,
                json.dumps({'logbook': 4, 'report': 4, 'presentation': 4}),
                64,
                'Logbook is complete. Ready for final report review.',
            ),
        )

        conn.commit()
        print('Demo accounts ready:')
        print(f'  Admin                 username={ADMIN_USERNAME}           password={DEMO_PASSWORD}')
        print(f'  Student               username={STUDENT_REG}  password={DEMO_PASSWORD}')
        print(f'  Company supervisor    username={COMPANY_EMAIL}  password={DEMO_PASSWORD}')
        print(f'  Visiting supervisor   username={LECTURER_EMAIL} password={DEMO_PASSWORD}')
    except Exception:
        conn.rollback()
        raise
    finally:
        if own:
            conn.close()


if __name__ == '__main__':
    try:
        seed()
    except Exception as exc:
        print(f'Demo seed failed: {exc}', file=sys.stderr)
        sys.exit(1)
