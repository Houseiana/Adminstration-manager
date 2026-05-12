-- Migration 0005: extend expenses with accounting / journal-entry fields.
-- Idempotent.

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS vendor_name        TEXT,
  ADD COLUMN IF NOT EXISTS authorized_by      TEXT,
  ADD COLUMN IF NOT EXISTS expense_date       DATE,
  ADD COLUMN IF NOT EXISTS invoice_number     TEXT,
  ADD COLUMN IF NOT EXISTS has_invoice        BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS no_invoice_reason  TEXT;

CREATE INDEX IF NOT EXISTS expenses_expense_date_idx ON expenses (expense_date);
CREATE INDEX IF NOT EXISTS expenses_vendor_idx       ON expenses (vendor_name);
