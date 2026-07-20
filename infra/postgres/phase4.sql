-- Phase 4: Analytics & Brand Health Dashboard
-- Brand Health snapshots (daily cron would populate these)
CREATE TABLE IF NOT EXISTS brand_health_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,  -- NULL = brand-wide
  snapshot_date date NOT NULL,
  -- Component scores (0-100)
  audit_score       numeric(5,2),
  vm_score          numeric(5,2),
  training_score    numeric(5,2),
  cx_score          numeric(5,2),
  environment_score numeric(5,2),
  campaign_score    numeric(5,2),
  attendance_score  numeric(5,2),
  -- Composite
  brand_health_score numeric(5,2),
  -- Weights used
  weights jsonb DEFAULT '{"audit":0.25,"vm":0.20,"training":0.15,"cx":0.20,"environment":0.10,"campaign":0.05,"attendance":0.05}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(brand_id, store_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS analytics_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id),
  module varchar(50),   -- audit/vm/cx/training/environment/campaigns/attendance
  alert_type varchar(80), -- score_drop/overdue_audits/low_nps/missed_training/env_issue
  severity varchar(20) DEFAULT 'warning', -- info/warning/critical
  message text,
  metric_value numeric,
  threshold_value numeric,
  is_read bool DEFAULT false,
  triggered_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kpi_targets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  module varchar(50),
  metric_name varchar(100),
  target_value numeric,
  unit varchar(30),
  period varchar(20) DEFAULT 'monthly', -- weekly/monthly/quarterly
  updated_at timestamptz DEFAULT now(),
  UNIQUE(brand_id, module, metric_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bh_snapshots_brand  ON brand_health_snapshots(brand_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_bh_snapshots_store  ON brand_health_snapshots(store_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_brand ON analytics_alerts(brand_id, is_read, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_brand   ON kpi_targets(brand_id, module);

-- Super Admin permissions
UPDATE roles
SET permissions = permissions || '{"analytics":{"create":true,"read":true,"update":true,"delete":true,"export":true}}'::jsonb
WHERE name = 'Super Admin';
