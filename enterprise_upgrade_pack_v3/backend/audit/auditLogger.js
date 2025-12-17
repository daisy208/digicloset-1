export function auditLog(action, userId, meta = {}) {
  console.log(JSON.stringify({
    type: 'AUDIT',
    action,
    userId,
    meta,
    timestamp: new Date().toISOString()
  }));
}
