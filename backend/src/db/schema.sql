CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_mn TEXT NOT NULL,
  category TEXT NOT NULL,
  period TEXT NOT NULL,
  province TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  model_url TEXT,
  model_embed_url TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'нийтлэгдсэн',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'visitor',
  organization TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS institution_email TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS department_name TEXT,
  ADD COLUMN IF NOT EXISTS position_title TEXT,
  ADD COLUMN IF NOT EXISTS employee_code TEXT,
  ADD COLUMN IF NOT EXISTS research_focus TEXT,
  ADD COLUMN IF NOT EXISTS verification_document_name TEXT,
  ADD COLUMN IF NOT EXISTS verification_document_url TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'submitted';

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id
  ON email_verifications (user_id);

ALTER TABLE artifacts
  ADD COLUMN IF NOT EXISTS created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS model_url TEXT;

UPDATE artifacts
  SET status = 'APPROVED'
  WHERE status IN ('нийтлэгдсэн', 'published', 'approved');

UPDATE artifacts
  SET status = 'NEW'
  WHERE status NOT IN ('NEW', 'PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE artifacts ALTER COLUMN status SET DEFAULT 'NEW';

ALTER TABLE artifacts DROP CONSTRAINT IF EXISTS artifacts_status_check;
ALTER TABLE artifacts
  ADD CONSTRAINT artifacts_status_check
  CHECK (status IN ('NEW', 'PENDING', 'APPROVED', 'REJECTED'));

ALTER TABLE artifacts
  ADD COLUMN IF NOT EXISTS reviewed_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_note TEXT;

CREATE INDEX IF NOT EXISTS idx_artifacts_slug ON artifacts (slug);
CREATE INDEX IF NOT EXISTS idx_artifacts_category ON artifacts (category);
CREATE INDEX IF NOT EXISTS idx_artifacts_province ON artifacts (province);
CREATE INDEX IF NOT EXISTS idx_artifacts_status ON artifacts (status);
CREATE INDEX IF NOT EXISTS idx_artifacts_created_by ON artifacts (created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions (user_id);

CREATE TABLE IF NOT EXISTS photo_sets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  capture_notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'шинэ',
  image_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photo_images (
  id TEXT PRIMARY KEY,
  photo_set_id TEXT NOT NULL REFERENCES photo_sets(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reconstruction_jobs (
  id TEXT PRIMARY KEY,
  photo_set_id TEXT NOT NULL REFERENCES photo_sets(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queue',
  stage TEXT NOT NULL DEFAULT 'upload_complete',
  progress_percent INTEGER NOT NULL DEFAULT 0,
  engine TEXT NOT NULL DEFAULT 'photogrammetry-placeholder',
  engine_mode TEXT NOT NULL DEFAULT 'mvp-simulation',
  estimated_quality TEXT NOT NULL DEFAULT 'үнэлээгүй',
  result_summary TEXT NOT NULL DEFAULT '',
  generated_model_url TEXT,
  generated_format TEXT,
  processing_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photo_images_photo_set_id ON photo_images (photo_set_id);
CREATE INDEX IF NOT EXISTS idx_reconstruction_jobs_photo_set_id ON reconstruction_jobs (photo_set_id);
CREATE INDEX IF NOT EXISTS idx_reconstruction_jobs_status ON reconstruction_jobs (status);
