-- Missing tables migration — run once on existing DB

-- Brand Hub
CREATE TABLE IF NOT EXISTS brand_hub_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  icon        VARCHAR(100),
  color       VARCHAR(20),
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brand_hub_assets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id        UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES brand_hub_categories(id) ON DELETE SET NULL,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  file_url        TEXT,
  thumbnail_url   TEXT,
  file_type       VARCHAR(50),
  file_size       BIGINT,
  tags            TEXT[] DEFAULT '{}',
  download_count  INT DEFAULT 0,
  uploaded_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  type        VARCHAR(50) DEFAULT 'general',
  status      VARCHAR(30) DEFAULT 'draft',
  start_date  DATE,
  end_date    DATE,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_assets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  file_url    TEXT,
  file_type   VARCHAR(50),
  title       VARCHAR(255),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_store_assignments (
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, store_id)
);

CREATE TABLE IF NOT EXISTS campaign_confirmations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  store_id     UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  confirmed_by UUID REFERENCES users(id),
  photo_url    TEXT,
  notes        TEXT,
  confirmed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signage
CREATE TABLE IF NOT EXISTS signage_templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id      UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  category      VARCHAR(100),
  dimensions    VARCHAR(100),
  file_url      TEXT,
  thumbnail_url TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS print_requests (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id             UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  store_id             UUID REFERENCES stores(id),
  template_id          UUID REFERENCES signage_templates(id),
  requested_by         UUID REFERENCES users(id),
  quantity             INT DEFAULT 1,
  status               VARCHAR(30) DEFAULT 'pending',
  special_instructions TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signage_installations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id       UUID REFERENCES stores(id),
  template_id    UUID REFERENCES signage_templates(id),
  installed_by   UUID REFERENCES users(id),
  photo_url      TEXT,
  placement_zone VARCHAR(100),
  gps_lat        NUMERIC(10,7),
  gps_lng        NUMERIC(10,7),
  gps_verified   BOOLEAN DEFAULT false,
  notes          TEXT,
  installed_at   TIMESTAMPTZ DEFAULT NOW()
);

-- VM (Visual Merchandising)
CREATE TABLE IF NOT EXISTS vm_templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id      UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  zone_name     VARCHAR(100),
  planogram_url TEXT,
  instructions  TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vm_tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  template_id UUID REFERENCES vm_templates(id),
  store_id    UUID NOT NULL REFERENCES stores(id),
  assigned_to UUID REFERENCES users(id),
  title       VARCHAR(255) NOT NULL,
  status      VARCHAR(30) DEFAULT 'pending',
  priority    VARCHAR(20) DEFAULT 'medium',
  due_date    DATE,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vm_submissions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id          UUID NOT NULL REFERENCES vm_tasks(id) ON DELETE CASCADE,
  store_id         UUID REFERENCES stores(id),
  submitted_by     UUID REFERENCES users(id),
  status           VARCHAR(30) DEFAULT 'pending',
  compliance_score INT DEFAULT 0,
  notes            TEXT,
  gps_lat          NUMERIC(10,7),
  gps_lng          NUMERIC(10,7),
  gps_verified     BOOLEAN DEFAULT false,
  reviewed_by      UUID REFERENCES users(id),
  reviewed_at      TIMESTAMPTZ,
  submitted_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vm_submission_photos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES vm_submissions(id) ON DELETE CASCADE,
  photo_url     TEXT,
  zone_label    VARCHAR(100),
  uploaded_at   TIMESTAMPTZ DEFAULT NOW()
);

-- CX (Customer Experience)
CREATE TABLE IF NOT EXISTS cx_surveys (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  type        VARCHAR(50) DEFAULT 'custom',
  description TEXT,
  questions   JSONB DEFAULT '[]',
  is_active   BOOLEAN DEFAULT false,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cx_responses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id     UUID NOT NULL REFERENCES cx_surveys(id) ON DELETE CASCADE,
  store_id      UUID REFERENCES stores(id),
  channel       VARCHAR(50) DEFAULT 'in-store',
  nps_score     INT,
  csat_score    INT,
  answers       JSONB DEFAULT '{}',
  sentiment     VARCHAR(20) DEFAULT 'neutral',
  verbatim      TEXT,
  customer_ref  VARCHAR(255),
  submitted_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cx_review_sources (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id       UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  store_id       UUID REFERENCES stores(id),
  platform       VARCHAR(50) DEFAULT 'manual',
  rating         NUMERIC(3,1),
  review_text    TEXT,
  reviewer_name  VARCHAR(255),
  review_date    DATE,
  sentiment      VARCHAR(20),
  response_text  TEXT,
  imported_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cx_alerts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id     UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  store_id     UUID REFERENCES stores(id),
  type         VARCHAR(50),
  message      TEXT,
  is_read      BOOLEAN DEFAULT false,
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Environment
CREATE TABLE IF NOT EXISTS environment_checklists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS environment_checklist_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES environment_checklists(id) ON DELETE CASCADE,
  question     TEXT NOT NULL,
  is_required  BOOLEAN DEFAULT true,
  sort_order   INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS environment_submissions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID NOT NULL REFERENCES environment_checklists(id),
  store_id     UUID NOT NULL REFERENCES stores(id),
  submitted_by UUID REFERENCES users(id),
  status       VARCHAR(30) DEFAULT 'open',
  score        INT,
  gps_lat      NUMERIC(10,7),
  gps_lng      NUMERIC(10,7),
  gps_verified BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS environment_submission_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES environment_submissions(id) ON DELETE CASCADE,
  item_id       UUID REFERENCES environment_checklist_items(id),
  answer        VARCHAR(10),
  notes         TEXT
);

CREATE TABLE IF NOT EXISTS environment_issues (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id       UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  store_id       UUID REFERENCES stores(id),
  submission_id  UUID REFERENCES environment_submissions(id),
  title          VARCHAR(255),
  description    TEXT,
  severity       VARCHAR(20) DEFAULT 'medium',
  status         VARCHAR(30) DEFAULT 'open',
  reported_by    UUID REFERENCES users(id),
  resolved_by    UUID REFERENCES users(id),
  resolved_at    TIMESTAMPTZ,
  photo_urls     TEXT[] DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Training
CREATE TABLE IF NOT EXISTS training_courses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  category    VARCHAR(100),
  thumbnail   TEXT,
  is_active   BOOLEAN DEFAULT true,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_modules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id   UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  content     TEXT,
  video_url   TEXT,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_quizzes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id   UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  question    TEXT NOT NULL,
  options     JSONB DEFAULT '[]',
  answer      VARCHAR(255),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS training_enrollments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id    UUID NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       VARCHAR(30) DEFAULT 'enrolled',
  enrolled_at  TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(course_id, user_id)
);

CREATE TABLE IF NOT EXISTS training_progress (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES training_enrollments(id) ON DELETE CASCADE,
  module_id    UUID NOT NULL REFERENCES training_modules(id),
  completed    BOOLEAN DEFAULT false,
  score        INT,
  completed_at TIMESTAMPTZ,
  UNIQUE(enrollment_id, module_id)
);

CREATE TABLE IF NOT EXISTS certifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES training_courses(id),
  issued_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,
  cert_url    TEXT
);

-- Analytics
CREATE TABLE IF NOT EXISTS kpi_targets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  store_id    UUID REFERENCES stores(id),
  metric      VARCHAR(100) NOT NULL,
  target      NUMERIC,
  period      VARCHAR(20) DEFAULT 'monthly',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_alerts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  store_id    UUID REFERENCES stores(id),
  metric      VARCHAR(100),
  message     TEXT,
  severity    VARCHAR(20) DEFAULT 'warning',
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
