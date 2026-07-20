-- ============================================================
-- StorePrint Phase 3 Schema
-- Module 5: Staff Training & Brand Culture
-- Module 4: Store Environment & Atmosphere
-- Module 8: Customer Experience & Feedback
-- ============================================================

-- ── Module 5: Training ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS training_courses (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id       uuid NOT NULL REFERENCES brands(id),
  title          varchar(255) NOT NULL,
  description    text,
  category       varchar(100),  -- onboarding/brand-culture/product/compliance/safety
  duration_mins  int,
  pass_score     int DEFAULT 80,
  is_published   bool DEFAULT false,
  thumbnail_url  text,
  created_by     uuid REFERENCES users(id),
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_modules (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id      uuid NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
  title          varchar(255),
  content_type   varchar(50),   -- video/pdf/quiz/text
  content_url    text,
  content_text   text,
  order_index    int,
  duration_mins  int,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_quizzes (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id      uuid NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  question       text NOT NULL,
  options        jsonb,         -- ["option A","option B","option C","option D"]
  correct_index  int,
  explanation    text
);

CREATE TABLE IF NOT EXISTS training_enrollments (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id      uuid REFERENCES training_courses(id),
  user_id        uuid REFERENCES users(id),
  store_id       uuid REFERENCES stores(id),
  status         varchar(30) DEFAULT 'enrolled',  -- enrolled/in_progress/completed/failed
  progress_pct   int DEFAULT 0,
  score          int,
  enrolled_at    timestamptz DEFAULT now(),
  completed_at   timestamptz,
  UNIQUE(course_id, user_id)
);

CREATE TABLE IF NOT EXISTS training_progress (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id  uuid NOT NULL REFERENCES training_enrollments(id) ON DELETE CASCADE,
  module_id      uuid REFERENCES training_modules(id),
  completed      bool DEFAULT false,
  score          int,
  attempts       int DEFAULT 0,
  completed_at   timestamptz
);

CREATE TABLE IF NOT EXISTS certifications (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid REFERENCES users(id),
  course_id       uuid REFERENCES training_courses(id),
  store_id        uuid REFERENCES stores(id),
  issued_at       timestamptz DEFAULT now(),
  expires_at      timestamptz,
  certificate_url text
);

CREATE INDEX IF NOT EXISTS idx_training_courses_brand    ON training_courses(brand_id);
CREATE INDEX IF NOT EXISTS idx_training_modules_course   ON training_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_training_enroll_user      ON training_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_training_enroll_course    ON training_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_training_progress_enroll  ON training_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_certifications_user       ON certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_course     ON certifications(course_id);

-- ── Module 4: Environment ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS environment_checklists (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id     uuid REFERENCES brands(id),
  title        varchar(255),
  category     varchar(100),  -- lighting/scent/music/cleanliness/temperature/display
  description  text,
  frequency    varchar(30),   -- daily/weekly/monthly
  is_active    bool DEFAULT true,
  created_by   uuid REFERENCES users(id),
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS environment_checklist_items (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id         uuid NOT NULL REFERENCES environment_checklists(id) ON DELETE CASCADE,
  item_text            text NOT NULL,
  order_index          int,
  requires_photo       bool DEFAULT false,
  requires_measurement bool DEFAULT false,
  unit                 varchar(30)   -- lux/dB/celsius/etc
);

CREATE TABLE IF NOT EXISTS environment_submissions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id    uuid REFERENCES environment_checklists(id),
  store_id        uuid REFERENCES stores(id),
  submitted_by    uuid REFERENCES users(id),
  overall_status  varchar(30),   -- pass/fail/partial
  score           int,
  notes           text,
  gps_lat         numeric(10,7),
  gps_lng         numeric(10,7),
  gps_verified    bool DEFAULT false,
  submitted_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS environment_submission_items (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id     uuid NOT NULL REFERENCES environment_submissions(id) ON DELETE CASCADE,
  checklist_item_id uuid REFERENCES environment_checklist_items(id),
  status            varchar(20),   -- ok/issue/na
  value             varchar(100),
  photo_url         text,
  note              text
);

CREATE TABLE IF NOT EXISTS environment_issues (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id uuid REFERENCES environment_submissions(id),
  store_id      uuid REFERENCES stores(id),
  item_text     text,
  severity      varchar(20),           -- low/medium/high/critical
  status        varchar(20) DEFAULT 'open',  -- open/in_progress/resolved
  assigned_to   uuid REFERENCES users(id),
  photo_url     text,
  resolved_at   timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_env_checklists_brand    ON environment_checklists(brand_id);
CREATE INDEX IF NOT EXISTS idx_env_submissions_store   ON environment_submissions(store_id);
CREATE INDEX IF NOT EXISTS idx_env_submissions_date    ON environment_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_env_issues_store        ON environment_issues(store_id);
CREATE INDEX IF NOT EXISTS idx_env_issues_status       ON environment_issues(status);

-- ── Module 8: Customer Experience ────────────────────────────

CREATE TABLE IF NOT EXISTS cx_surveys (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id    uuid REFERENCES brands(id),
  title       varchar(255),
  type        varchar(30),   -- nps/csat/custom
  description text,
  is_active   bool DEFAULT true,
  questions   jsonb,         -- [{id, text, type: rating|text|multiple_choice, options:[]}]
  created_by  uuid REFERENCES users(id),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cx_responses (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id    uuid REFERENCES cx_surveys(id),
  store_id     uuid REFERENCES stores(id),
  channel      varchar(30),   -- in-store/qr-code/whatsapp/email
  nps_score    int,           -- 0-10
  csat_score   int,           -- 1-5
  answers      jsonb,         -- {question_id: value}
  sentiment    varchar(20),   -- positive/neutral/negative
  verbatim     text,
  customer_ref varchar(100),
  submitted_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cx_review_sources (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id       uuid REFERENCES brands(id),
  store_id       uuid REFERENCES stores(id),
  platform       varchar(50),   -- google/tripadvisor/facebook/manual
  rating         numeric(3,1),
  review_text    text,
  reviewer_name  varchar(100),
  review_date    date,
  sentiment      varchar(20),
  response_text  text,
  responded_at   timestamptz,
  imported_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cx_alerts (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id     uuid REFERENCES brands(id),
  store_id     uuid REFERENCES stores(id),
  type         varchar(50),   -- low_nps/negative_review/score_drop
  message      text,
  is_read      bool DEFAULT false,
  triggered_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cx_surveys_brand      ON cx_surveys(brand_id);
CREATE INDEX IF NOT EXISTS idx_cx_responses_survey   ON cx_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_cx_responses_store    ON cx_responses(store_id);
CREATE INDEX IF NOT EXISTS idx_cx_responses_date     ON cx_responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_cx_reviews_brand      ON cx_review_sources(brand_id);
CREATE INDEX IF NOT EXISTS idx_cx_reviews_store      ON cx_review_sources(store_id);
CREATE INDEX IF NOT EXISTS idx_cx_alerts_brand       ON cx_alerts(brand_id);
CREATE INDEX IF NOT EXISTS idx_cx_alerts_read        ON cx_alerts(is_read);

-- ── Role Permissions Update ───────────────────────────────────

UPDATE roles
SET permissions = permissions || '{
  "training":    {"create":true,"read":true,"update":true,"delete":true,"export":true},
  "environment": {"create":true,"read":true,"update":true,"delete":true,"export":true},
  "cx":          {"create":true,"read":true,"update":true,"delete":true,"export":true}
}'::jsonb
WHERE name = 'Super Admin';
