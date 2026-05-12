-- Migration 0008: add 'Executive Management' department.
-- Moves the Executive Manager role out of Finance into its own dept.
-- Idempotent.

ALTER TYPE department ADD VALUE IF NOT EXISTS 'Executive Management';
