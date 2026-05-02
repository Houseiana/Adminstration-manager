-- ============================================================
-- ADMIN MANAGER DASHBOARD — Seed Data
-- Idempotent: uses ON CONFLICT to be safe on re-run.
-- ============================================================

-- ---------- EMPLOYEES ----------
INSERT INTO employees (
  id, name_en, name_ar, title_en, title_ar, department,
  phone, email, address, national_id, dob,
  marital_status, children_count, education, previous_experience,
  work_phone, emergency_phone,
  type, contract_type, hiring_date, location, manager,
  salary, payment_method, bank_account, status
) VALUES
  ('EMP-1001', 'Mohamed Sayed',     'محمد الصياد',
    'Admin Manager',           'مدير إداري',
    'Administration',
    '+20 1012345678', 'mohamed.sayed@company.com',
    '12 El Tahrir St, Cairo', '29001011234567', '1990-01-01',
    'married', 2, 'MBA, Cairo University', '10 years in HR & operations',
    '+20 222334455', '+20 1099887766',
    'full', 'permanent', '2020-03-01', 'Cairo HQ', NULL,
    35000.00, 'bank', 'EG1234567890123456', 'active'),

  ('EMP-1002', 'Sara Hosny',        'سارة حسني',
    'Sales Manager',           'مدير مبيعات',
    'Sales',
    '+20 1099887766', 'sara.hosny@company.com',
    '45 Korba St, Heliopolis', '29101031234568', '1991-03-15',
    'single', 0, 'Bachelor of Business Administration',
    '5 years at multinational firm',
    '+20 222445566', '+20 1011223344',
    'full', 'permanent', '2021-06-15', 'Cairo HQ', 'Mohamed Sayed',
    25000.00, 'bank', 'EG2345678901234567', 'active'),

  ('EMP-1003', 'Ahmed Sherif',      'أحمد الشريف',
    'Sales Team Leader',       'رئيس فريق مبيعات',
    'Sales',
    '+20 1234567890', 'ahmed.sherif@company.com',
    '8 Mohandessin, Giza', '29202021234569', '1992-05-20',
    'married', 1, 'BSc Computer Science', '4 years sales experience',
    '+20 233445566', '+20 1022334455',
    'full', 'permanent', '2022-01-10', 'Cairo HQ', 'Sara Hosny',
    18000.00, 'bank', 'EG3456789012345678', 'active'),

  ('EMP-1004', 'Layla Naggar',      'ليلى النجار',
    'Rentals Sales Agent',     'موظف مبيعات مؤجرين',
    'Sales',
    '+20 1067788990', 'layla.naggar@company.com',
    '22 Maadi St, Cairo', '29403041234570', '1994-07-12',
    'single', 0, 'Bachelor of Marketing', '2 years freelance',
    '+20 244556677', '+20 1033445566',
    'full', 'probation', '2025-08-15', 'Maadi Office', 'Ahmed Sherif',
    12000.00, 'bank', 'EG4567890123456789', 'active'),

  ('EMP-1005', 'Omar Masri',        'عمر المصري',
    'Tenants Sales Agent',     'موظف مبيعات مستأجرين',
    'Sales',
    '+20 1077889911', 'omar.masri@company.com',
    '5 Zamalek, Cairo', '29504051234571', '1995-09-08',
    'single', 0, 'Bachelor of Commerce', NULL,
    '+20 244556677', '+20 1044556677',
    'full', 'permanent', '2023-04-01', 'Cairo HQ', 'Ahmed Sherif',
    15500.00, 'bank', 'EG5678901234567890', 'active'),

  ('EMP-1006', 'Fatma Abdelrahman', 'فاطمة عبد الرحمن',
    'Data Entry Clerk',        'مدخل بيانات',
    'Data Entry',
    '+20 1070299639', 'fatma.abdelrahman@company.com',
    '148 El Tahrir St, Cairo', '95285493827160', '1999-11-06',
    'single', 0, 'Diploma in Office Administration', NULL,
    '+20 222112233', '+20 1055667788',
    'full', 'permanent', '2024-02-20', 'Cairo HQ', 'Mohamed Sayed',
    9500.00, 'bank', 'EG6789012345678901', 'active'),

  ('EMP-1007', 'Khaled Gamal',      'خالد الجمل',
    'Operations Supervisor',   'مشرف عمليات',
    'Operations',
    '+20 1098765432', 'khaled.gamal@company.com',
    '33 Nasr City, Cairo', '29007071234572', '1990-04-18',
    'married', 3, 'BSc Logistics', '8 years in operations',
    '+20 277665544', '+20 1066778899',
    'full', 'permanent', '2021-11-01', 'Cairo HQ', 'Mohamed Sayed',
    22000.00, 'bank', 'EG7890123456789012', 'active'),

  ('EMP-1008', 'Yousef Mahfouz',    'يوسف محفوظ',
    'Driver',                  'سائق',
    'Operations',
    '+20 1188776655', 'yousef.mahfouz@company.com',
    '7 Faisal St, Giza', '28508081234573', '1985-08-25',
    'married', 4, 'High School Diploma', '12 years driving experience',
    NULL, '+20 1077889900',
    'full', 'permanent', '2019-09-15', 'Cairo HQ', 'Khaled Gamal',
    8000.00, 'cash', NULL, 'active'),

  ('EMP-1009', 'Reem Roshdy',       'ريم رشدي',
    'Media Specialist',        'موظف ميديا',
    'Media',
    '+20 1144556677', 'reem.roshdy@company.com',
    '17 Dokki, Giza', '29609091234574', '1996-02-14',
    'married', 0, 'Bachelor of Mass Communication', '3 years content creation',
    '+20 233556677', '+20 1088998877',
    'full', 'fixed', '2024-07-01', 'Cairo HQ', 'Mohamed Sayed',
    14000.00, 'bank', 'EG9012345678901234', 'leave'),

  ('EMP-1010', 'Hassan Roshdy',     'حسن رشدي',
    'Technology Manager',      'مدير قسم التكنولوجيا',
    'Technology',
    '+20 1199887766', 'hassan.roshdy@company.com',
    '19 New Cairo, Cairo', '28710101234575', '1987-12-03',
    'married', 2, 'MSc Computer Engineering', '15 years software experience',
    '+20 244332211', '+20 1099887766',
    'full', 'permanent', '2018-05-01', 'Cairo HQ', 'Mohamed Sayed',
    45000.00, 'bank', 'EG0123456789012345', 'active'),

  ('EMP-1011', 'Mariam Sherif',     'مريم الشريف',
    'Frontend Developer',      'مبرمج Frontend',
    'Technology',
    '+20 1233445566', 'mariam.sherif@company.com',
    '4 Sheraton, Cairo', '29711111234576', '1997-06-22',
    'single', 0, 'BSc Computer Science', '2 years React experience',
    '+20 233227788', '+20 1011223344',
    'full', 'permanent', '2023-09-10', 'Cairo HQ', 'Hassan Roshdy',
    20000.00, 'bank', 'EG1122334455667788', 'active'),

  ('EMP-1012', 'Ibrahim Abdallah',  'إبراهيم عبد الله',
    'Backend Developer',       'مبرمج Backend',
    'Technology',
    '+20 1255667788', 'ibrahim.abdallah@company.com',
    '11 Rehab, Cairo', '29312121234577', '1993-10-30',
    'married', 1, 'BSc Computer Engineering', '6 years Node/Postgres',
    '+20 233445566', '+20 1022334455',
    'full', 'permanent', '2022-08-15', 'Cairo HQ', 'Hassan Roshdy',
    28000.00, 'bank', 'EG2233445566778899', 'active'),

  ('EMP-1013', 'Tarek Mahfouz',     'طارق محفوظ',
    'Mobile Developer',        'مبرمج Mobile Application',
    'Technology',
    '+20 1277889900', 'tarek.mahfouz@company.com',
    '24 Madinaty, Cairo', '29413131234578', '1994-04-09',
    'single', 0, 'BSc Computer Science', '3 years React Native',
    '+20 244556677', '+20 1033445566',
    'full', 'fixed', '2024-03-01', 'Cairo HQ', 'Hassan Roshdy',
    24000.00, 'bank', 'EG3344556677889900', 'active'),

  ('EMP-1014', 'Amal Abdelrahman',  'أمل عبد الرحمن',
    'Secretary',               'سكرتير / سكرتيرة',
    'Secretariat',
    '+20 1099112233', 'amal.abdelrahman@company.com',
    '6 Garden City, Cairo', '29014141234579', '1990-11-16',
    'married', 2, 'Diploma in Office Management', '7 years executive secretary',
    '+20 222998877', '+20 1044556677',
    'full', 'permanent', '2020-08-01', 'Cairo HQ', 'Mohamed Sayed',
    13000.00, 'bank', 'EG4455667788990011', 'active'),

  ('EMP-1015', 'Nour Hosny',        'نور حسني',
    'PR Specialist',           'مسؤول علاقات عامة',
    'Public Relations',
    '+20 1166778899', 'nour.hosny@company.com',
    '9 Sheikh Zayed, Cairo', '29515151234580', '1995-08-04',
    'single', 0, 'Bachelor of Public Relations', '4 years agency experience',
    '+20 233998877', '+20 1055667788',
    'full', 'permanent', '2022-12-01', 'Cairo HQ', 'Mohamed Sayed',
    16000.00, 'bank', 'EG5566778899001122', 'active')
ON CONFLICT (id) DO NOTHING;


-- ---------- ACTIVITIES (hire events for each employee) ----------
INSERT INTO employee_activities (emp_id, type, date, title, description)
SELECT
  id,
  'hired'::activity_type,
  hiring_date,
  'Employee hired',
  'Joined as ' || title_en || ' in ' || department::TEXT
FROM employees
WHERE NOT EXISTS (
  SELECT 1 FROM employee_activities ea
  WHERE ea.emp_id = employees.id AND ea.type = 'hired'
);


-- ---------- SAMPLE LEAVES ----------
INSERT INTO leaves (emp_id, type, start_date, end_date, notes, medical_report)
VALUES
  ('EMP-1003', 'permission', '2026-04-12', '2026-04-12',
   'Family commitment',                              FALSE),
  ('EMP-1004', 'casual',     '2026-04-05', '2026-04-05',
   'Personal emergency',                             FALSE),
  ('EMP-1004', 'casual',     '2026-04-22', '2026-04-22',
   'Family emergency',                               FALSE),
  ('EMP-1006', 'sick',       '2026-04-15', '2026-04-16',
   'Flu — doctor''s note attached',                  TRUE),
  ('EMP-1008', 'absence',    '2026-04-19', '2026-04-19',
   'No-show, no notice',                             FALSE),
  ('EMP-1011', 'casual',     '2026-04-09', '2026-04-09',
   'Doctor appointment',                             FALSE)
ON CONFLICT DO NOTHING;


-- ---------- SAMPLE LATE RECORDS ----------
INSERT INTO late_records (emp_id, date, late_minutes, notes)
VALUES
  ('EMP-1003', '2026-04-06', 25, 'Traffic'),
  ('EMP-1004', '2026-04-13', 45, 'Overslept'),
  ('EMP-1006', '2026-04-21', 15, 'Bus delay'),
  ('EMP-1011', '2026-04-08', 30, 'Late deployment'),
  ('EMP-1012', '2026-04-23', 10, 'Brief delay')
ON CONFLICT DO NOTHING;


-- ---------- SAMPLE PAYROLL ADJUSTMENT (one approved month) ----------
INSERT INTO payroll_adjustments (emp_id, year, month, unpaid, deductions, bonuses, status, notes)
VALUES
  ('EMP-1010', 2026, 3, 0, 0, 5000, 'approved',
   'Q1 performance bonus')
ON CONFLICT (emp_id, year, month) DO NOTHING;


-- ---------- SAMPLE ACTIVITY: PROMOTION ----------
INSERT INTO employee_activities (
  emp_id, type, date, title, old_value, new_value
) VALUES
  ('EMP-1003', 'promoted', '2024-07-01',
   'Promoted to Sales Team Leader',
   'Rentals Sales Agent', 'Sales Team Leader'),
  ('EMP-1003', 'salary_changed', '2024-07-01',
   'Salary increase',
   '12000', '18000');
