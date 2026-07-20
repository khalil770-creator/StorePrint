-- Brand Hub Categories
CREATE TABLE IF NOT EXISTS brand_hub_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  icon        VARCHAR(10)  NOT NULL DEFAULT '📁',
  color       VARCHAR(20)  NOT NULL DEFAULT '#5CAD2C',
  sort_order  INT          NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Brand Hub Assets
CREATE TABLE IF NOT EXISTS brand_hub_assets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id       UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  category_id    UUID REFERENCES brand_hub_categories(id) ON DELETE SET NULL,
  name           VARCHAR(255) NOT NULL,
  description    TEXT,
  file_name      VARCHAR(255),          -- original filename
  file_url       TEXT,                  -- MinIO path OR external URL
  object_name    TEXT,                  -- MinIO object key (null for link assets)
  file_size      BIGINT,                -- bytes (null for link assets)
  mime_type      VARCHAR(120),
  extension      VARCHAR(20),
  icon           VARCHAR(10) DEFAULT '📁',
  source         VARCHAR(10) NOT NULL DEFAULT 'upload' CHECK (source IN ('upload','link')),
  tags           JSONB        NOT NULL DEFAULT '[]',
  download_count INT          NOT NULL DEFAULT 0,
  uploaded_by    UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bha_brand    ON brand_hub_assets(brand_id);
CREATE INDEX IF NOT EXISTS idx_bha_category ON brand_hub_assets(category_id);

-- Seed default categories for each brand (run once)
-- INSERT INTO brand_hub_categories(brand_id, name, icon, color, sort_order)
-- SELECT id, 'Brand Manual',   '📖', '#EEF4FF', 0 FROM brands
-- UNION ALL SELECT id, 'Logos', '🎨', '#F0F8EA', 1 FROM brands ...
