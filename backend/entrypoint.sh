#!/bin/sh
set -eu
python - <<'PY'
import sys
import time
from db_util import connect

for attempt in range(40):
    try:
        conn = connect()
        conn.close()
        print('MySQL is reachable.')
        sys.exit(0)
    except Exception as exc:
        print(f'Waiting for MySQL ({attempt + 1}/40): {exc}')
        time.sleep(3)
print('MySQL did not become ready in time.', file=sys.stderr)
sys.exit(1)
PY
python init_db.py
exec gunicorn --workers 1 --threads 8 --timeout 120 -b "0.0.0.0:${PORT:-5000}" app:app
