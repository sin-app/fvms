-- Persistent rate-limit store (replaces in-memory Map so limits survive
-- across serverless invocations on Vercel).
CREATE TABLE IF NOT EXISTS rate_limits (
  key            text PRIMARY KEY,
  count          integer NOT NULL DEFAULT 1,
  first_at      timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz NOT NULL DEFAULT '1970-01-01T00:00:00Z'
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked
  ON rate_limits (blocked_until);

-- Periodic cleanup of expired entries (optional, keeps table small).
-- RLS is disabled: only the service-role (server) writes/reads this table.
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
