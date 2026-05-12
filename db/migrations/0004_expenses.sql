-- Migration 0004: expenses table for daily / variable expense tracking
-- Idempotent.

CREATE TABLE IF NOT EXISTS expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL,
  year        SMALLINT NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  month       SMALLINT NOT NULL CHECK (month BETWEEN 0 AND 11),
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS expenses_year_month_idx ON expenses (year, month);
CREATE INDEX IF NOT EXISTS expenses_category_idx   ON expenses (category);

DROP TRIGGER IF EXISTS expenses_set_updated_at ON expenses;
CREATE TRIGGER expenses_set_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
