CREATE TABLE IF NOT EXISTS consent_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL,
  consent_granted BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);
