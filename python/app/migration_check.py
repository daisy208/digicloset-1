#!/usr/bin/env python3
"""Check Alembic migration head vs DB head and report differences."""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print('Please set DATABASE_URL in .env')
    sys.exit(1)

engine = create_engine(DATABASE_URL)

def get_db_alembic_version(conn):
    try:
        result = conn.execute(text("SELECT version_num FROM alembic_version"))
        row = result.fetchone()
        return row[0] if row else None
    except Exception as e:
        print('Could not read alembic_version table:', e)
        return None

def main():
    with engine.connect() as conn:
        db_version = get_db_alembic_version(conn)
        print('DB alembic version:', db_version)
        # Note: this script assumes your repository contains alembic env -- not checking repo here.
        # For a stronger check, compare local alembic/script.py.mako heads with DB.
        print('If DB version differs from code migrations, run `alembic upgrade head` after review.')

if __name__ == '__main__':
    main()
