CREATE EXTENSION IF NOT EXISTS postgis;

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

ALTER TABLE artifacts
  ADD COLUMN IF NOT EXISTS geom geography(POINT, 4326);

UPDATE artifacts
  SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  WHERE geom IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_artifacts_slug ON artifacts (slug);
CREATE INDEX IF NOT EXISTS idx_artifacts_category ON artifacts (category);
CREATE INDEX IF NOT EXISTS idx_artifacts_province ON artifacts (province);
CREATE INDEX IF NOT EXISTS idx_artifacts_status ON artifacts (status);
CREATE INDEX IF NOT EXISTS idx_artifacts_created_by ON artifacts (created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_geom ON artifacts USING GIST (geom);
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

-- ============================================
-- ERD-тэй нийцүүлэх migration
-- (locations, media_files хүснэгтүүд + photo_sets.created_by_user_id)
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL UNIQUE REFERENCES artifacts(id) ON DELETE CASCADE,
  province TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geom geography(POINT, 4326),
  description TEXT
);

CREATE INDEX IF NOT EXISTS idx_locations_geom ON locations USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_locations_artifact_id ON locations (artifact_id);

CREATE TABLE IF NOT EXISTS media_files (
  id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_files_artifact_id ON media_files (artifact_id);
CREATE INDEX IF NOT EXISTS idx_media_files_artifact_type ON media_files (artifact_id, file_type);

ALTER TABLE photo_sets
  ADD COLUMN IF NOT EXISTS created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_photo_sets_created_by ON photo_sets (created_by_user_id);

-- ============================================
-- Data migration: artifacts → locations (хуучин өгөгдлийг устгахгүйгээр шилжүүлэх)
-- ============================================
INSERT INTO locations (id, artifact_id, province, location, latitude, longitude, geom, description)
SELECT
  gen_random_uuid()::text,
  a.id,
  a.province,
  a.location,
  a.latitude,
  a.longitude,
  a.geom,
  NULL
FROM artifacts a
ON CONFLICT (artifact_id) DO NOTHING;

-- artifacts.image_url → media_files (primary image)
INSERT INTO media_files (id, artifact_id, file_url, file_type, is_primary, sort_order, uploaded_at)
SELECT
  gen_random_uuid()::text,
  a.id,
  a.image_url,
  'image',
  TRUE,
  0,
  COALESCE(a.created_at, NOW())
FROM artifacts a
WHERE a.image_url IS NOT NULL AND a.image_url <> ''
  AND NOT EXISTS (
    SELECT 1 FROM media_files mf
    WHERE mf.artifact_id = a.id
      AND mf.file_type = 'image'
      AND mf.is_primary = TRUE
  );

-- artifacts.gallery → media_files (нэмэлт зургууд)
INSERT INTO media_files (id, artifact_id, file_url, file_type, is_primary, sort_order, uploaded_at)
SELECT
  gen_random_uuid()::text,
  a.id,
  url::text,
  'image',
  FALSE,
  ROW_NUMBER() OVER (PARTITION BY a.id ORDER BY (SELECT NULL)),
  COALESCE(a.created_at, NOW())
FROM artifacts a, jsonb_array_elements_text(a.gallery) AS url
WHERE NOT EXISTS (
  SELECT 1 FROM media_files mf
  WHERE mf.artifact_id = a.id
    AND mf.file_url = url::text
);

-- artifacts.model_url → media_files (3D загвар)
INSERT INTO media_files (id, artifact_id, file_url, file_type, is_primary, sort_order, uploaded_at)
SELECT
  gen_random_uuid()::text,
  a.id,
  COALESCE(a.model_url, a.model_embed_url),
  'model',
  TRUE,
  0,
  COALESCE(a.created_at, NOW())
FROM artifacts a
WHERE COALESCE(a.model_url, a.model_embed_url) IS NOT NULL
  AND COALESCE(a.model_url, a.model_embed_url) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM media_files mf
    WHERE mf.artifact_id = a.id
      AND mf.file_type = 'model'
  );

-- artifacts хуучин багануудыг nullable болгох (өгөгдөл хадгалагдаж үлдэнэ)
ALTER TABLE artifacts ALTER COLUMN province DROP NOT NULL;
ALTER TABLE artifacts ALTER COLUMN location DROP NOT NULL;
ALTER TABLE artifacts ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE artifacts ALTER COLUMN longitude DROP NOT NULL;
ALTER TABLE artifacts ALTER COLUMN image_url DROP NOT NULL;
ALTER TABLE artifacts ALTER COLUMN model_embed_url DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_photo_images_photo_set_id ON photo_images (photo_set_id);
CREATE INDEX IF NOT EXISTS idx_reconstruction_jobs_photo_set_id ON reconstruction_jobs (photo_set_id);
CREATE INDEX IF NOT EXISTS idx_reconstruction_jobs_status ON reconstruction_jobs (status);
