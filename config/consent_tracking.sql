CREATE TABLE IF NOT EXISTS consent_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL,
  consent_granted BOOLEAN DEFAULT TRUE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT chk_consent_revoked_after_granted
    CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);

CREATE INDEX IF NOT EXISTS idx_consent_tracking_user_type_granted_at
  ON consent_tracking (user_id, consent_type, granted_at DESC);

CREATE INDEX IF NOT EXISTS idx_consent_tracking_revoked_at
  ON consent_tracking (revoked_at);
