-- ============================================================
-- StorePrint Phase 2 Migration
-- Modules: Campaigns, Visual Merchandising, Signage & POS
-- ============================================================

-- ── Campaigns ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id      UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  type          TEXT NOT NULL CHECK (type IN ('brand','promotional','seasonal')),
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','active','closed')),
  start_date    DATE,
  end_date      DATE,
  brief_url     TEXT,
  cover_image_url TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_assets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_type     TEXT,
  size_bytes    BIGINT,
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_store_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by   UUID REFERENCES users(id),
  UNIQUE(campaign_id, store_id)
);

CREATE TABLE IF NOT EXISTS campaign_confirmations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  confirmed_by  UUID REFERENCES users(id),
  photo_url     TEXT,
  gps_lat       NUMERIC(10,7),
  gps_lng       NUMERIC(10,7),
  gps_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  notes         TEXT,
  confirmed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, store_id)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id   ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status     ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_assets_campaign_id ON campaign_assets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_csa_campaign_id      ON campaign_store_assignments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_csa_store_id         ON campaign_store_assignments(store_id);
CREATE INDEX IF NOT EXISTS idx_cc_campaign_id       ON campaign_confirmations(campaign_id);

-- ── Visual Merchandising ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS vm_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id      UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  zone_name     TEXT,
  planogram_url TEXT,
  instructions  TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vm_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id      UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  template_id   UUID REFERENCES vm_templates(id) ON DELETE SET NULL,
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  assigned_to   UUID REFERENCES users(id),
  title         TEXT NOT NULL,
  due_date      DATE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','submitted','approved','rejected')),
  priority      TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vm_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID NOT NULL REFERENCES vm_tasks(id) ON DELETE CASCADE,
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  submitted_by    UUID REFERENCES users(id),
  compliance_score INT,
  notes           TEXT,
  gps_lat         NUMERIC(10,7),
  gps_lng         NUMERIC(10,7),
  gps_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  status          TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','approved','rejected')),
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by     UUID REFERENCES users(id),
  reviewed_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS vm_submission_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES vm_submissions(id) ON DELETE CASCADE,
  photo_url     TEXT NOT NULL,
  zone_label    TEXT,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vm_templates_brand_id ON vm_templates(brand_id);
CREATE INDEX IF NOT EXISTS idx_vm_tasks_brand_id     ON vm_tasks(brand_id);
CREATE INDEX IF NOT EXISTS idx_vm_tasks_store_id     ON vm_tasks(store_id);
CREATE INDEX IF NOT EXISTS idx_vm_tasks_status       ON vm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_vm_tasks_assigned_to  ON vm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_vm_submissions_task_id ON vm_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_vm_submission_photos_submission_id ON vm_submission_photos(submission_id);

-- ── Signage & POS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS signage_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id      UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL CHECK (category IN ('window','in-store','pos','digital')),
  dimensions    TEXT,
  file_url      TEXT,
  thumbnail_url TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS print_requests (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id             UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  store_id             UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  template_id          UUID REFERENCES signage_templates(id) ON DELETE SET NULL,
  requested_by         UUID REFERENCES users(id),
  quantity             INT NOT NULL DEFAULT 1,
  special_instructions TEXT,
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','in_production','delivered','cancelled')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signage_installations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id       UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  template_id    UUID REFERENCES signage_templates(id) ON DELETE SET NULL,
  installed_by   UUID REFERENCES users(id),
  photo_url      TEXT,
  placement_zone TEXT,
  gps_lat        NUMERIC(10,7),
  gps_lng        NUMERIC(10,7),
  gps_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  notes          TEXT,
  installed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signage_templates_brand_id  ON signage_templates(brand_id);
CREATE INDEX IF NOT EXISTS idx_signage_templates_category  ON signage_templates(category);
CREATE INDEX IF NOT EXISTS idx_print_requests_brand_id     ON print_requests(brand_id);
CREATE INDEX IF NOT EXISTS idx_print_requests_store_id     ON print_requests(store_id);
CREATE INDEX IF NOT EXISTS idx_print_requests_status       ON print_requests(status);
CREATE INDEX IF NOT EXISTS idx_signage_installations_store ON signage_installations(store_id);
CREATE INDEX IF NOT EXISTS idx_signage_installations_tmpl  ON signage_installations(template_id);
