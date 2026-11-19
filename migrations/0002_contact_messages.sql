-- Allow public contact-form messages to share the existing ASNK inbox.
-- Existing inscription rows are preserved.
CREATE TABLE inscriptions_new (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('membre','groupe','donateur','partenaire','contact')),
  status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente','validee','refusee')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  message TEXT,
  data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO inscriptions_new (id,type,status,full_name,email,phone,city,message,data,created_at,updated_at)
SELECT id,type,status,full_name,email,phone,city,message,data,created_at,updated_at FROM inscriptions;
DROP TABLE inscriptions;
ALTER TABLE inscriptions_new RENAME TO inscriptions;
