-- ============================================================
-- StorePrint — PostgreSQL Schema
-- Phase 1: Admin, Brand Hub, Compliance Auditing, Field Presence
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- for GPS geo queries

-- ============================================================
-- SECTION 10: ADMIN — Core Entities
-- ============================================================

CREATE TABLE brands (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  domain        VARCHAR(255) UNIQUE,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  logo_url      TEXT,
  app_name      VARCHAR(100),
  splash_url    TEXT,
  modules_enabled TEXT[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE countries (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id   UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  code       VARCHAR(5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE regions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE areas (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id  UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id        UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  area_id         UUID REFERENCES areas(id),
  name            VARCHAR(255) NOT NULL,
  code            VARCHAR(50) UNIQUE,
  format          VARCHAR(50),          -- flagship, standard, pop-up, franchise
  address         TEXT,
  city            VARCHAR(100),
  country         VARCHAR(100),
  lat             DECIMAL(10, 8),
  lng             DECIMAL(11, 8),
  geofence_radius INT DEFAULT 100,      -- metres
  opening_hours   JSONB,                -- { mon: {open:'09:00', close:'21:00'}, ... }
  photos          TEXT[] DEFAULT '{}',
  status          VARCHAR(20) DEFAULT 'active', -- active, inactive, renovating
  tags            TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  is_system   BOOLEAN DEFAULT FALSE,   -- system roles cannot be deleted
  permissions JSONB DEFAULT '{}',      -- { module: { create, read, update, delete, export } }
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id        UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  role_id         UUID REFERENCES roles(id),
  email           VARCHAR(255) NOT NULL UNIQUE,
  name            VARCHAR(255) NOT NULL,
  phone           VARCHAR(30),
  avatar_url      TEXT,
  status          VARCHAR(20) DEFAULT 'active',  -- active, inactive, pending
  sso_id          VARCHAR(255),
  invited_at      TIMESTAMPTZ,
  last_active_at  TIMESTAMPTZ,
  password_hash   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_stores (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id   UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, store_id)
);

CREATE TABLE user_sessions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id    VARCHAR(255),
  device_name  VARCHAR(255),
  ip_address   VARCHAR(45),
  user_agent   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ
);

CREATE TABLE login_history (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  device_id  VARCHAR(255),
  status     VARCHAR(20),  -- success, failed, locked
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id     UUID REFERENCES brands(id),
  user_id      UUID REFERENCES users(id),
  action       VARCHAR(100) NOT NULL,
  entity_type  VARCHAR(100),
  entity_id    UUID,
  before_state JSONB,
  after_state  JSONB,
  ip_address   VARCHAR(45),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(100) NOT NULL,
  channel    VARCHAR(20) DEFAULT 'in_app',  -- in_app, push, email
  title      VARCHAR(255),
  body       TEXT,
  data       JSONB,
  read       BOOLEAN DEFAULT FALSE,
  sent_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_rules (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id         UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  event_type       VARCHAR(100) NOT NULL,
  roles            TEXT[] DEFAULT '{}',
  channels         TEXT[] DEFAULT '{}',
  digest_frequency VARCHAR(20) DEFAULT 'immediate'  -- immediate, hourly, daily
);

CREATE TABLE integrations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id            UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  type                VARCHAR(50) NOT NULL,  -- hris, pos, erp, email, bi
  credentials_enc     TEXT,                 -- AES-encrypted
  webhooks            JSONB DEFAULT '[]',
  status              VARCHAR(20) DEFAULT 'inactive',
  last_synced_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 01: BRAND IDENTITY & ASSET HUB
-- ============================================================

CREATE TABLE brand_manuals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id     UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  version      VARCHAR(20) NOT NULL,
  published_at TIMESTAMPTZ,
  is_current   BOOLEAN DEFAULT FALSE,
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE brand_manual_chapters (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manual_id UUID NOT NULL REFERENCES brand_manuals(id) ON DELETE CASCADE,
  title     VARCHAR(255) NOT NULL,
  body      TEXT,
  sort_order INT DEFAULT 0,
  assets    TEXT[] DEFAULT '{}'
);

CREATE TABLE logos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  variant     VARCHAR(50) NOT NULL,  -- primary, reversed, mono, stacked
  formats     TEXT[] DEFAULT '{}',
  min_size_px INT,
  clear_space VARCHAR(50),
  file_url    TEXT NOT NULL,
  usage_notes TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE colours (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name     VARCHAR(100) NOT NULL,
  hex      VARCHAR(7) NOT NULL,
  rgb      JSONB,   -- { r, g, b }
  cmyk     JSONB,   -- { c, m, y, k }
  pantone  VARCHAR(50),
  role     VARCHAR(30),   -- primary, secondary, accent, neutral
  wcag_aa  BOOLEAN,
  wcag_aaa BOOLEAN
);

CREATE TABLE fonts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id      UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  family        VARCHAR(100) NOT NULL,
  weights       TEXT[] DEFAULT '{}',
  scale         JSONB,   -- [{ name, size_px, line_height }]
  usage_context VARCHAR(50)  -- heading, body, ui
);

CREATE TABLE assets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  type        VARCHAR(30) NOT NULL,  -- image, video, pdf, template
  name        VARCHAR(255) NOT NULL,
  file_url    TEXT NOT NULL,
  file_size   BIGINT,
  mime_type   VARCHAR(100),
  tags        TEXT[] DEFAULT '{}',
  expiry      DATE,
  rights      TEXT,
  territory   TEXT[] DEFAULT '{}',
  version     INT DEFAULT 1,
  is_archived BOOLEAN DEFAULT FALSE,
  uploaded_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asset_versions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id   UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  version    INT NOT NULL,
  file_url   TEXT NOT NULL,
  notes      TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asset_collections (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id   UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asset_collection_items (
  collection_id UUID NOT NULL REFERENCES asset_collections(id) ON DELETE CASCADE,
  asset_id      UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, asset_id)
);

-- ============================================================
-- SECTION 07: BRAND COMPLIANCE AUDITING
-- ============================================================

CREATE TABLE audit_templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_template_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES audit_templates(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,  -- VM, Signage, Cleanliness, Staff, Digital
  weight      DECIMAL(5,2) DEFAULT 1.0,
  sort_order  INT DEFAULT 0
);

CREATE TABLE audit_template_questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id     UUID NOT NULL REFERENCES audit_template_categories(id) ON DELETE CASCADE,
  text            TEXT NOT NULL,
  type            VARCHAR(20) DEFAULT 'yes_no',  -- yes_no, score, text, photo
  required_photo  BOOLEAN DEFAULT FALSE,
  is_critical     BOOLEAN DEFAULT FALSE,         -- critical fail = auto-fail audit
  pass_criteria   TEXT,
  sort_order      INT DEFAULT 0
);

CREATE TABLE audit_schedules (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id  UUID NOT NULL REFERENCES audit_templates(id),
  store_id     UUID NOT NULL REFERENCES stores(id),
  frequency    VARCHAR(20) NOT NULL,  -- weekly, monthly, quarterly, adhoc
  next_due     DATE,
  assigned_to  UUID REFERENCES users(id),
  type         VARCHAR(20) DEFAULT 'scheduled',  -- scheduled, spot, self
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id     UUID NOT NULL REFERENCES audit_templates(id),
  schedule_id     UUID REFERENCES audit_schedules(id),
  store_id        UUID NOT NULL REFERENCES stores(id),
  auditor_id      UUID NOT NULL REFERENCES users(id),
  status          VARCHAR(20) DEFAULT 'in_progress',  -- in_progress, submitted, reviewed
  score           DECIMAL(5,2),
  passed          BOOLEAN,
  brand_threshold DECIMAL(5,2),
  -- GPS presence verification (mandatory)
  check_in_lat    DECIMAL(10,8),
  check_in_lng    DECIMAL(11,8),
  check_in_time   TIMESTAMPTZ,
  device_id       VARCHAR(255),
  gps_verified    BOOLEAN DEFAULT FALSE,
  report_url      TEXT,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  submitted_at    TIMESTAMPTZ,
  synced_at       TIMESTAMPTZ
);

CREATE TABLE audit_responses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id     UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  question_id  UUID NOT NULL REFERENCES audit_template_questions(id),
  response     VARCHAR(20),   -- yes, no, na, or numeric score
  notes        TEXT,
  photo_url    TEXT,
  photo_lat    DECIMAL(10,8),
  photo_lng    DECIMAL(11,8),
  photo_ts     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(audit_id, question_id)
);

CREATE TABLE corrective_actions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id         UUID NOT NULL REFERENCES audits(id),
  question_id      UUID REFERENCES audit_template_questions(id),
  store_id         UUID NOT NULL REFERENCES stores(id),
  description      TEXT NOT NULL,
  assigned_to      UUID REFERENCES users(id),
  sla_hours        INT DEFAULT 48,
  due_at           TIMESTAMPTZ,
  status           VARCHAR(20) DEFAULT 'open',  -- open, in_progress, resolved, escalated
  resolution_notes TEXT,
  resolved_at      TIMESTAMPTZ,
  escalation_chain UUID[] DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SECTION 11: FIELD PRESENCE, ATTENDANCE & ROSTER
-- ============================================================

CREATE TABLE gps_check_ins (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id),
  store_id    UUID NOT NULL REFERENCES stores(id),
  lat         DECIMAL(10,8) NOT NULL,
  lng         DECIMAL(11,8) NOT NULL,
  accuracy_m  DECIMAL(7,2),
  verified    BOOLEAN DEFAULT FALSE,
  distance_m  DECIMAL(8,2),           -- distance from store at time of check-in
  module      VARCHAR(50),            -- audit, vm, signage, campaign, environment, attendance
  ref_id      UUID,                   -- ID of the submission this check-in is tied to
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id),
  store_id        UUID NOT NULL REFERENCES stores(id),
  shift_id        UUID,               -- FK to shifts (below)
  clock_in_at     TIMESTAMPTZ,
  clock_in_lat    DECIMAL(10,8),
  clock_in_lng    DECIMAL(11,8),
  clock_in_verified BOOLEAN DEFAULT FALSE,
  clock_out_at    TIMESTAMPTZ,
  clock_out_lat   DECIMAL(10,8),
  clock_out_lng   DECIMAL(11,8),
  is_late         BOOLEAN DEFAULT FALSE,
  late_minutes    INT,
  early_exit      BOOLEAN DEFAULT FALSE,
  status          VARCHAR(20) DEFAULT 'present',  -- present, absent, late, partial
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roster_schedules (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id     UUID NOT NULL REFERENCES stores(id),
  name         VARCHAR(100),          -- e.g. "Week 23 - June 2026"
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  status       VARCHAR(20) DEFAULT 'draft',  -- draft, published
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES users(id),
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shifts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roster_id   UUID NOT NULL REFERENCES roster_schedules(id) ON DELETE CASCADE,
  store_id    UUID NOT NULL REFERENCES stores(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  date        DATE NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  role_label  VARCHAR(100),   -- e.g. "Floor Supervisor", "VM Lead"
  zone        VARCHAR(100),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- link attendance back to shifts
ALTER TABLE attendance ADD CONSTRAINT fk_attendance_shift
  FOREIGN KEY (shift_id) REFERENCES shifts(id);

CREATE TABLE shift_swap_requests (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id         UUID NOT NULL REFERENCES shifts(id),
  requested_by     UUID NOT NULL REFERENCES users(id),
  swap_with_user   UUID REFERENCES users(id),
  reason           TEXT,
  status           VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
  reviewed_by      UUID REFERENCES users(id),
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_stores_brand ON stores(brand_id);
CREATE INDEX idx_stores_geo ON stores(lat, lng);
CREATE INDEX idx_users_brand ON users(brand_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_assets_brand ON assets(brand_id);
CREATE INDEX idx_assets_tags ON assets USING gin(tags);
CREATE INDEX idx_audits_store ON audits(store_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_corrective_store ON corrective_actions(store_id);
CREATE INDEX idx_corrective_status ON corrective_actions(status);
CREATE INDEX idx_attendance_user ON attendance(user_id);
CREATE INDEX idx_attendance_store ON attendance(store_id);
CREATE INDEX idx_shifts_roster ON shifts(roster_id);
CREATE INDEX idx_shifts_user ON shifts(user_id);
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_gps_checkin_user ON gps_check_ins(user_id);
CREATE INDEX idx_gps_checkin_store ON gps_check_ins(store_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
