# config/security/audit_logger.py
import json, os, datetime

AUDIT_LOG_PATH = os.getenv("AUDIT_LOG_PATH", "./audit.log")

def audit_log(action: str, details: dict):
    entry = {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "action": action,
        "details": details,
    }
    with open(AUDIT_LOG_PATH, "a") as f:
        f.write(json.dumps(entry) + "\n")
    print("AUDIT:", json.dumps(entry))