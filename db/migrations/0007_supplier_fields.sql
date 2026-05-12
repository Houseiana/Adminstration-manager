-- Migration 0007: supplier (المورد) contact fields on expenses.
-- Distinct from vendor_name (اسم صاحب الفاتورة).
-- Idempotent.

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS supplier_name    TEXT,
  ADD COLUMN IF NOT EXISTS supplier_phone   TEXT,
  ADD COLUMN IF NOT EXISTS supplier_address TEXT;

CREATE INDEX IF NOT EXISTS expenses_supplier_idx ON expenses (supplier_name);
