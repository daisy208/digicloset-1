// config/security/audit_logger.js
import fs from 'fs';

const AUDIT_LOG_PATH = process.env.AUDIT_LOG_PATH || './audit.log';

export function auditLog(action, details) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    details,
  };
  fs.appendFileSync(AUDIT_LOG_PATH, JSON.stringify(logEntry) + '\n');
  console.log('AUDIT:', JSON.stringify(logEntry));
}