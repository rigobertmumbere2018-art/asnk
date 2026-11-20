-- Assign one active district commissioner to a district while preserving past assignments.
-- This is additive: it does not alter existing district, group, user, or role records.
CREATE TABLE IF NOT EXISTS district_commissioners (
  id TEXT PRIMARY KEY,
  district_id TEXT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_district_commissioners_active_district
  ON district_commissioners(district_id) WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS idx_district_commissioners_active_user
  ON district_commissioners(user_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_district_commissioners_user_id
  ON district_commissioners(user_id);
