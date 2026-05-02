-- ============================================================
-- ADMIN MANAGER DASHBOARD — Database Schema
-- Target: PostgreSQL 15+ / Neon
--
-- This file is idempotent: re-runs are safe.
-- Cascade deletes are wired so dropping an employee removes all
-- their leaves, late records, payroll adjustments and activity
-- timeline events.
-- ============================================================

-- ---------- ENUMS ----------
DO $$ BEGIN
  CREATE TYPE employee_status AS ENUM
    ('active', 'inactive', 'leave', 'terminated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE employment_type AS ENUM
    ('full', 'part', 'contract', 'intern');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM
    ('bank', 'cash', 'cheque');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE marital_status AS ENUM
    ('single', 'married', 'divorced', 'widowed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE contract_type AS ENUM
    ('training', 'probation', 'permanent', 'fixed', 'open');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE department AS ENUM (
    'Administration',
    'Sales',
    'Data Entry',
    'Operations',
    'Media',
    'Technology',
    'Secretariat',
    'Public Relations'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE leave_type AS ENUM
    ('permission', 'absence', 'casual', 'sick');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payroll_status AS ENUM
    ('draft', 'pending', 'approved', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'hired',
    'salary_changed',
    'promoted',
    'transferred',
    'status_changed',
    'type_changed',
    'contract_changed',
    'penalty',
    'bonus',
    'award',
    'note'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE penalty_severity AS ENUM
    ('warning', 'fine', 'suspension', 'termination');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ---------- TIMESTAMP TRIGGER FUNCTION ----------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ---------- EMPLOYEES ----------
CREATE TABLE IF NOT EXISTS employees (
  id                  TEXT PRIMARY KEY,                 -- e.g. EMP-1001
  name_en             TEXT NOT NULL,
  name_ar             TEXT NOT NULL,
  title_en            TEXT NOT NULL,
  title_ar            TEXT NOT NULL,
  photo_url           TEXT,                             -- data URL or storage URL
  department          department NOT NULL,
  phone               TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  address             TEXT,
  national_id         TEXT,
  dob                 DATE,
  marital_status      marital_status,
  children_count      SMALLINT DEFAULT 0
                      CHECK (children_count >= 0 AND children_count <= 30),
  education           TEXT,
  previous_experience TEXT,
  work_phone          TEXT,
  emergency_phone     TEXT,
  type                employment_type NOT NULL,
  contract_type       contract_type,
  hiring_date         DATE NOT NULL,
  termination_date    DATE,
  location            TEXT,
  manager             TEXT,
  salary              NUMERIC(12,2) NOT NULL CHECK (salary >= 0),
  allowances          NUMERIC(12,2) NOT NULL DEFAULT 0
                      CHECK (allowances >= 0),
  commission          NUMERIC(12,2) NOT NULL DEFAULT 0
                      CHECK (commission >= 0),
  raise_amount        NUMERIC(12,2) NOT NULL DEFAULT 0
                      CHECK (raise_amount >= 0),
  raise_date          DATE,
  payment_method      payment_method NOT NULL DEFAULT 'bank',
  bank_account        TEXT,
  status              employee_status NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT employees_termination_after_hire
    CHECK (termination_date IS NULL OR termination_date >= hiring_date),
  CONSTRAINT employees_single_no_kids
    CHECK (marital_status <> 'single' OR COALESCE(children_count, 0) = 0)
);

CREATE INDEX IF NOT EXISTS employees_status_idx       ON employees (status);
CREATE INDEX IF NOT EXISTS employees_department_idx   ON employees (department);
CREATE INDEX IF NOT EXISTS employees_hiring_date_idx  ON employees (hiring_date);
CREATE INDEX IF NOT EXISTS employees_name_en_trgm_idx ON employees (name_en);
CREATE INDEX IF NOT EXISTS employees_name_ar_trgm_idx ON employees (name_ar);

DROP TRIGGER IF EXISTS employees_set_updated_at ON employees;
CREATE TRIGGER employees_set_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------- PAYROLL ADJUSTMENTS ----------
-- One row per employee per (year, month) holding the manual extras.
-- The leaves and late_records tables drive the auto-deduction;
-- this table only stores the manual overrides + workflow status.
CREATE TABLE IF NOT EXISTS payroll_adjustments (
  emp_id        TEXT NOT NULL
                REFERENCES employees(id) ON DELETE CASCADE,
  year          SMALLINT NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  month         SMALLINT NOT NULL CHECK (month BETWEEN 0 AND 11),
  unpaid        NUMERIC(6,2)   NOT NULL DEFAULT 0
                CHECK (unpaid >= 0),
  deductions    NUMERIC(12,2)  NOT NULL DEFAULT 0
                CHECK (deductions >= 0),
  bonuses       NUMERIC(12,2)  NOT NULL DEFAULT 0
                CHECK (bonuses >= 0),
  status        payroll_status NOT NULL DEFAULT 'draft',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (emp_id, year, month)
);

CREATE INDEX IF NOT EXISTS payroll_adj_period_idx
  ON payroll_adjustments (year, month);
CREATE INDEX IF NOT EXISTS payroll_adj_status_idx
  ON payroll_adjustments (status);

DROP TRIGGER IF EXISTS payroll_adj_set_updated_at ON payroll_adjustments;
CREATE TRIGGER payroll_adj_set_updated_at
  BEFORE UPDATE ON payroll_adjustments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------- LEAVES ----------
CREATE TABLE IF NOT EXISTS leaves (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_id          TEXT NOT NULL
                  REFERENCES employees(id) ON DELETE CASCADE,
  type            leave_type NOT NULL,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  notes           TEXT,
  medical_report  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leaves_dates_ordered CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS leaves_emp_idx       ON leaves (emp_id);
CREATE INDEX IF NOT EXISTS leaves_type_idx      ON leaves (type);
CREATE INDEX IF NOT EXISTS leaves_start_idx     ON leaves (start_date);
CREATE INDEX IF NOT EXISTS leaves_emp_start_idx ON leaves (emp_id, start_date DESC);

DROP TRIGGER IF EXISTS leaves_set_updated_at ON leaves;
CREATE TRIGGER leaves_set_updated_at
  BEFORE UPDATE ON leaves
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------- LATE RECORDS ----------
CREATE TABLE IF NOT EXISTS late_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_id        TEXT NOT NULL
                REFERENCES employees(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  late_minutes  INT NOT NULL CHECK (late_minutes > 0 AND late_minutes <= 480),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS late_emp_idx      ON late_records (emp_id);
CREATE INDEX IF NOT EXISTS late_date_idx     ON late_records (date);
CREATE INDEX IF NOT EXISTS late_emp_date_idx ON late_records (emp_id, date DESC);


-- ---------- EMPLOYEE ACTIVITIES (timeline) ----------
CREATE TABLE IF NOT EXISTS employee_activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emp_id        TEXT NOT NULL
                REFERENCES employees(id) ON DELETE CASCADE,
  type          activity_type NOT NULL,
  date          DATE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  old_value     TEXT,
  new_value     TEXT,
  amount        NUMERIC(12,2),
  severity      penalty_severity,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS activities_emp_idx       ON employee_activities (emp_id);
CREATE INDEX IF NOT EXISTS activities_emp_date_idx  ON employee_activities (emp_id, date DESC);
CREATE INDEX IF NOT EXISTS activities_type_idx      ON employee_activities (type);


-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Count working days (Sun..Thu, excluding Fri & Sat) in a month.
CREATE OR REPLACE FUNCTION working_days_in_month(p_year INT, p_month INT)
RETURNS INT
LANGUAGE sql IMMUTABLE AS $$
  SELECT COUNT(*)::INT
  FROM generate_series(
    make_date(p_year, p_month, 1),
    (make_date(p_year, p_month, 1) + INTERVAL '1 month - 1 day')::date,
    INTERVAL '1 day'
  ) AS d
  WHERE EXTRACT(DOW FROM d) NOT IN (5, 6);  -- exclude Fri(5), Sat(6)
$$;

-- Count working days inside a date range, inclusive on both ends.
CREATE OR REPLACE FUNCTION working_days_between(p_from DATE, p_to DATE)
RETURNS INT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_to < p_from THEN 0
    ELSE (
      SELECT COUNT(*)::INT
      FROM generate_series(p_from, p_to, INTERVAL '1 day') AS d
      WHERE EXTRACT(DOW FROM d) NOT IN (5, 6)
    )
  END;
$$;

-- Daily salary for an employee in a given month
-- (monthly salary divided by working days of the month).
CREATE OR REPLACE FUNCTION employee_daily_salary(
  p_emp_id TEXT, p_year INT, p_month INT
) RETURNS NUMERIC
LANGUAGE sql STABLE AS $$
  SELECT CASE
    WHEN working_days_in_month(p_year, p_month) = 0 THEN 0
    ELSE (
      SELECT salary FROM employees WHERE id = p_emp_id
    ) / working_days_in_month(p_year, p_month)
  END;
$$;


-- ============================================================
-- VIEWS
-- ============================================================

-- Active employees with denormalised display fields.
CREATE OR REPLACE VIEW v_employees_active AS
  SELECT
    id, name_en, name_ar, title_en, title_ar, department,
    phone, email, salary, hiring_date, photo_url
  FROM employees
  WHERE status = 'active';

-- Per-employee leave totals (count + working days summed).
CREATE OR REPLACE VIEW v_leave_summary AS
  SELECT
    emp_id,
    type,
    COUNT(*)                                                    AS leave_count,
    SUM(working_days_between(start_date, end_date))             AS total_working_days
  FROM leaves
  GROUP BY emp_id, type;

-- Per-employee per-month late aggregate.
CREATE OR REPLACE VIEW v_late_monthly AS
  SELECT
    emp_id,
    EXTRACT(YEAR  FROM date)::INT AS year,
    EXTRACT(MONTH FROM date)::INT AS month,
    COUNT(*)               AS entries,
    SUM(late_minutes)::INT AS total_minutes
  FROM late_records
  GROUP BY emp_id, year, month;
