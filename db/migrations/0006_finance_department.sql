-- Migration 0006: add 'Finance' value to the department enum.
-- Idempotent (ADD VALUE IF NOT EXISTS).

ALTER TYPE department ADD VALUE IF NOT EXISTS 'Finance';
