-- Migration 0010: add 'half_day' value to leave_type enum.
-- Used for permissions exceeding 2 hours (arrival or departure)
-- which deduct half a day's wage (0.5x multiplier).
-- ADD VALUE IF NOT EXISTS — idempotent, no data is touched.

ALTER TYPE leave_type ADD VALUE IF NOT EXISTS 'half_day';
