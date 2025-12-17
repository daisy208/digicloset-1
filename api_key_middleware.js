// config/security/api_key_middleware.js
import { createClient } from '@supabase/supabase-js';
import { auditLog } from './audit_logger.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function apiKeyMiddleware(req, res, next) {
  try {
    const key = req.headers['x-api-key'];
    if (!key) return res.status(401).json({ error: 'Missing API key' });

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key', key)
      .eq('revoked', false)
      .single();

    if (error || !data) return res.status(403).json({ error: 'Invalid or expired API key' });

    req.apiUser = data.owner_id;
    auditLog('ACCESS', { user: data.owner_id, endpoint: req.originalUrl });
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}