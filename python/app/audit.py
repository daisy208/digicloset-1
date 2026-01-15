# backend/app/audit.py
import json
import asyncpg
import os

async def log_audit(actor_id, actor_email, action, resource_type=None, resource_id=None, details=None):
    conn = await asyncpg.connect(os.getenv("DATABASE_URL"))
    await conn.execute("""
        INSERT INTO audit_logs (actor_id, actor_email, action, resource_type, resource_id, details)
        VALUES ($1, $2, $3, $4, $5, $6)
    """, actor_id, actor_email, action, resource_type, resource_id, json.dumps(details) if details else None)
    await conn.close()
