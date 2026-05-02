-- Migration 0002: add allowances / commission / raise / raise_date
-- Idempotent: safe to re-run.

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS allowances    NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (allowances >= 0),
  ADD COLUMN IF NOT EXISTS commission    NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (commission >= 0),
  ADD COLUMN IF NOT EXISTS raise_amount  NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (raise_amount >= 0),
  ADD COLUMN IF NOT EXISTS raise_date    DATE;

-- Backfill existing rows with sensible defaults so the seed data
-- matches the new model.
UPDATE employees
SET allowances = ROUND(salary * 0.10, -2),
    commission = ROUND(salary * 0.05, -2)
WHERE allowances = 0 AND commission = 0;

-- A couple of sample raises for visibility on existing data.
UPDATE employees
SET raise_amount = ROUND(salary * 0.08, -2),
    raise_date   = (hiring_date + INTERVAL '1 year')::date
WHERE id IN ('EMP-1003', 'EMP-1010', 'EMP-1011');
