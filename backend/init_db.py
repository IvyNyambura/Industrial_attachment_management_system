"""Create the IAMS schema if tables are missing, then seed demo accounts."""
import os
import re
import sys

from db_util import connect, mysql_settings
from seed_demo import seed

SCHEMA_FILE = os.path.join(os.path.dirname(__file__), 'database.sql')


def _statements(sql_text):
    cleaned = []
    for line in sql_text.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith('--'):
            continue
        upper = stripped.upper()
        if upper.startswith('CREATE DATABASE') or upper.startswith('USE '):
            continue
        if upper.startswith('DROP INDEX'):
            continue
        cleaned.append(line)
    blob = '\n'.join(cleaned)
    blob = re.sub(r'CREATE TABLE\s+(?!IF NOT EXISTS)', 'CREATE TABLE IF NOT EXISTS ', blob, flags=re.IGNORECASE)
    parts = [p.strip() for p in blob.split(';') if p.strip()]
    return parts


def init_schema():
    cfg = mysql_settings()
    db_name = cfg['database']
    if not re.fullmatch(r'[A-Za-z0-9_]+', db_name or ''):
        raise ValueError('MYSQL_DB must be letters, numbers, or underscore only')
    bootstrap = connect(with_database=False)
    try:
        cursor = bootstrap.cursor()
        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
        bootstrap.commit()
    finally:
        bootstrap.close()

    with open(SCHEMA_FILE, encoding='utf-8') as fh:
        sql_text = fh.read()
    conn = connect()
    try:
        cursor = conn.cursor()
        for stmt in _statements(sql_text):
            try:
                cursor.execute(stmt)
            except Exception as exc:
                msg = str(exc).lower()
                if 'index' in stmt.lower() and ('duplicate' in msg or 'exists' in msg):
                    continue
                raise
        conn.commit()
        print('Database schema is ready.')
        seed(conn)
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    try:
        init_schema()
    except Exception as exc:
        print(f'Database init failed: {exc}', file=sys.stderr)
        sys.exit(1)
