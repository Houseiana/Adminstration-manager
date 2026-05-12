-- Migration 0009: accounting reversals on expenses.
-- Once recorded, an expense cannot be edited or deleted. To correct
-- a mistake, a new entry is inserted with reverses_id pointing back
-- at the original; the original is marked voided_at = NOW().
-- Both stay in the audit log forever.
-- Idempotent.

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS voided_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reverses_id      UUID
    REFERENCES expenses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reversal_reason  TEXT;

CREATE INDEX IF NOT EXISTS expenses_reverses_idx  ON expenses (reverses_id);
CREATE INDEX IF NOT EXISTS expenses_voided_at_idx ON expenses (voided_at);
