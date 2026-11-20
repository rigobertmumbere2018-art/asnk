PRAGMA foreign_keys = ON;
CREATE TABLE user_roles_new (id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,role TEXT NOT NULL CHECK (role IN ('super_admin','admin','redacteur','editeur','membre','commissaire_district')),created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id, role));
INSERT INTO user_roles_new (id,user_id,role,created_at) SELECT id,user_id,role,created_at FROM user_roles;
DROP TABLE user_roles;
ALTER TABLE user_roles_new RENAME TO user_roles;
CREATE INDEX user_roles_user_id_idx ON user_roles(user_id);
CREATE TABLE district_commissioner_invites (id TEXT PRIMARY KEY,district_id TEXT NOT NULL REFERENCES districts(id),email TEXT NOT NULL COLLATE NOCASE,assigned_by TEXT NOT NULL REFERENCES users(id),status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','claimed','revoked')),claimed_by TEXT REFERENCES users(id),claimed_at TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX district_commissioner_invites_pending_email_idx ON district_commissioner_invites(email) WHERE status='pending';
CREATE INDEX district_commissioner_invites_district_idx ON district_commissioner_invites(district_id,status);
