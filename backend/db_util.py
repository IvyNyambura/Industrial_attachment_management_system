import os

import pymysql
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))


def mysql_settings():
    return {
        'host': os.getenv('MYSQL_HOST', 'localhost'),
        'user': os.getenv('MYSQL_USER', 'root'),
        'password': os.getenv('MYSQL_PASSWORD', ''),
        'database': os.getenv('MYSQL_DB', 'iams'),
        'port': int(os.getenv('MYSQL_PORT', '3306')),
        'charset': 'utf8mb4',
        'cursorclass': pymysql.cursors.DictCursor,
        'autocommit': False,
    }


def connect(with_database=True):
    cfg = mysql_settings()
    if not with_database:
        cfg = {k: v for k, v in cfg.items() if k != 'database'}
    return pymysql.connect(**cfg)
