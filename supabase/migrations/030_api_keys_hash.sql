-- Migrate api_keys from storing plaintext keys to SHA-256 hashes.
-- Existing plaintext keys (if any) are hashed in place so they keep working.

ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_hash text;

UPDATE api_keys
SET key_hash = encode(digest(key, 'sha256'), 'hex')
WHERE key_hash IS NULL AND key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

ALTER TABLE api_keys DROP COLUMN IF EXISTS key;
DROP INDEX IF EXISTS idx_api_keys_key;

-- New column was initially nullable for migration; tighten it now.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'api_keys' AND column_name = 'key_hash' AND is_nullable = 'YES') THEN
    ALTER TABLE api_keys ALTER COLUMN key_hash SET NOT NULL;
  END IF;
END $$;