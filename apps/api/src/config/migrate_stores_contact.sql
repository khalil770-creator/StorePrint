-- Migration: add contact fields to stores table
-- Run once: docker exec -i storeprint_postgres psql -U storeprint -d storeprint < apps/api/src/config/migrate_stores_contact.sql

ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS phone           VARCHAR(30),
  ADD COLUMN IF NOT EXISTS contact_person  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_cell    VARCHAR(30);
