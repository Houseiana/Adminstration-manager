import type {
  ContractType,
  Department,
  Employee,
  EmployeeStatus,
  EmploymentType,
  MaritalStatus,
} from "./types";

const DEPARTMENTS: Department[] = [
  "Executive Management",
  "Administration",
  "Sales",
  "Data Entry",
  "Operations",
  "Media",
  "Technology",
  "Secretariat",
  "Public Relations",
  "Finance",
];

export const TITLES_BY_DEPT: Record<Department, string[]> = {
  "Executive Management": ["Executive Manager"],
  Administration: ["Admin Manager"],
  Sales: [
    "Sales Manager",
    "Sales Team Leader",
    "Rentals Sales Agent",
    "Tenants Sales Agent",
  ],
  "Data Entry": ["Data Entry Clerk"],
  Operations: ["Operations Supervisor", "Driver"],
  Media: ["Media Specialist"],
  Technology: [
    "Technology Manager",
    "Frontend Developer",
    "Backend Developer",
    "Mobile Developer",
  ],
  Secretariat: ["Secretary"],
  "Public Relations": ["PR Specialist", "Business Developer"],
  Finance: [
    "Financial Manager",
    "Accounts Supervisor",
    "Senior Accountant",
    "Accountant",
  ],
};

export const TITLE_AR: Record<string, string> = {
  "Admin Manager": "مدير إداري",
  "Sales Manager": "مدير مبيعات",
  "Sales Team Leader": "رئيس فريق مبيعات",
  "Rentals Sales Agent": "موظف مبيعات مؤجرين",
  "Tenants Sales Agent": "موظف مبيعات مستأجرين",
  "Data Entry Clerk": "مدخل بيانات",
  "Operations Supervisor": "مشرف عمليات",
  Driver: "سائق",
  "Media Specialist": "موظف ميديا",
  "Technology Manager": "مدير قسم التكنولوجيا",
  "Frontend Developer": "مبرمج Frontend",
  "Backend Developer": "مبرمج Backend",
  "Mobile Developer": "مبرمج Mobile Application",
  Secretary: "سكرتير / سكرتيرة",
  "PR Specialist": "مسؤول علاقات عامة",
  "Business Developer": "مطور أعمال",
  "Executive Manager": "مدير تنفيذي",
  "Financial Manager": "مدير مالي",
  "Accounts Supervisor": "مشرف حسابات",
  "Senior Accountant": "محاسب أول",
  Accountant: "محاسب",
};

export function titleAr(en: string): string {
  return TITLE_AR[en] ?? en;
}

const FIRST_AR = [
  "أحمد",
  "محمد",
  "علي",
  "يوسف",
  "عمر",
  "حسن",
  "خالد",
  "إبراهيم",
  "سامي",
  "طارق",
  "منى",
  "سارة",
  "نور",
  "هدى",
  "ريم",
  "ليلى",
  "مريم",
  "فاطمة",
  "زينب",
  "أمل",
];
const LAST_AR = [
  "الصياد",
  "حسني",
  "الشريف",
  "النجار",
  "المصري",
  "عبد الله",
  "الجمل",
  "رشدي",
  "عبد الرحمن",
  "محفوظ",
];
const FIRST_EN = [
  "Ahmed",
  "Mohamed",
  "Ali",
  "Yousef",
  "Omar",
  "Hassan",
  "Khaled",
  "Ibrahim",
  "Sami",
  "Tarek",
  "Mona",
  "Sara",
  "Nour",
  "Hoda",
  "Reem",
  "Layla",
  "Mariam",
  "Fatma",
  "Zeinab",
  "Amal",
];
const LAST_EN = [
  "Sayed",
  "Hosny",
  "Sherif",
  "Naggar",
  "Masri",
  "Abdallah",
  "Gamal",
  "Roshdy",
  "Abdelrahman",
  "Mahfouz",
];

// Deterministic pseudo-random so SSR/CSR produce identical seed.
function rand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const MARITAL: MaritalStatus[] = ["single", "married", "divorced", "widowed"];
const CONTRACTS: ContractType[] = [
  "training",
  "probation",
  "permanent",
  "fixed",
  "open",
];
const EDUCATIONS = [
  "Bachelor's in Business Administration",
  "Bachelor's in Computer Science",
  "Bachelor's in Marketing",
  "Master's in Engineering",
  "Diploma in Accounting",
  "Bachelor's in Finance",
  "High School Diploma",
];
const EXPERIENCES = [
  "5 years at a multinational firm",
  "3 years freelance, then 2 years as team lead",
  "Worked across 2 startups in similar role",
  "Internship + 2 years in operations",
  "",
];

export function buildSeedEmployees(): Employee[] {
  const r = rand(42);
  const list: Employee[] = [];
  const statuses: EmployeeStatus[] = [
    "active",
    "active",
    "active",
    "active",
    "leave",
    "inactive",
    "active",
    "active",
    "terminated",
    "active",
  ];
  const types: EmploymentType[] = ["full", "full", "full", "part", "contract", "full", "intern"];

  for (let i = 0; i < 24; i++) {
    const fi = Math.floor(r() * FIRST_EN.length);
    const li = Math.floor(r() * LAST_EN.length);
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const titles = TITLES_BY_DEPT[dept];
    const title = titles[Math.floor(r() * titles.length)];
    const id = `EMP-${String(1001 + i).padStart(4, "0")}`;
    const salary = Math.round((8000 + r() * 32000) / 500) * 500;
    const hireYear = 2020 + Math.floor(r() * 5);
    const hireMonth = 1 + Math.floor(r() * 12);
    const hireDay = 1 + Math.floor(r() * 28);

    const phone = `+20 1${Math.floor(r() * 4)}${String(
      Math.floor(r() * 1e8)
    ).padStart(8, "0")}`;
    const workPhone = `+20 2${String(Math.floor(r() * 1e7)).padStart(7, "0")}`;
    const emergencyPhone = `+20 1${Math.floor(r() * 4)}${String(
      Math.floor(r() * 1e8)
    ).padStart(8, "0")}`;

    list.push({
      id,
      name_en: `${FIRST_EN[fi]} ${LAST_EN[li]}`,
      name_ar: `${FIRST_AR[fi]} ${LAST_AR[li]}`,
      title_en: title,
      title_ar: TITLE_AR[title] || title,
      department: dept,
      phone,
      email: `${FIRST_EN[fi].toLowerCase()}.${LAST_EN[li].toLowerCase()}@company.com`,
      address: `${Math.floor(r() * 200)} El Tahrir St, Cairo`,
      nationalId: String(Math.floor(r() * 9e13) + 1e13),
      dob: `19${80 + Math.floor(r() * 20)}-${String(
        1 + Math.floor(r() * 12)
      ).padStart(2, "0")}-${String(1 + Math.floor(r() * 28)).padStart(2, "0")}`,
      ...(() => {
        const ms = MARITAL[Math.floor(r() * MARITAL.length)];
        const children = ms === "single" ? 0 : Math.floor(r() * 4);
        return { maritalStatus: ms, childrenCount: children };
      })(),
      education: EDUCATIONS[Math.floor(r() * EDUCATIONS.length)],
      previousExperience: EXPERIENCES[Math.floor(r() * EXPERIENCES.length)],
      workPhone,
      emergencyPhone,
      type: types[i % types.length],
      contractType: CONTRACTS[Math.floor(r() * CONTRACTS.length)],
      hiringDate: `${hireYear}-${String(hireMonth).padStart(2, "0")}-${String(
        hireDay
      ).padStart(2, "0")}`,
      location: "Cairo HQ",
      manager: `${FIRST_EN[(fi + 3) % FIRST_EN.length]} ${
        LAST_EN[(li + 1) % LAST_EN.length]
      }`,
      salary,
      allowances: Math.round((salary * 0.10) / 100) * 100,
      commission: Math.round((salary * 0.05) / 100) * 100,
      raise: r() < 0.4 ? Math.round((salary * 0.08) / 100) * 100 : 0,
      raiseDate:
        r() < 0.4
          ? `${hireYear + 1}-${String(hireMonth).padStart(2, "0")}-${String(
              hireDay
            ).padStart(2, "0")}`
          : undefined,
      paymentMethod: "bank",
      bankAccount: `EG${String(Math.floor(r() * 9e15) + 1e15)}`,
      status: statuses[i % statuses.length],
    });
  }
  return list;
}

export const ALL_DEPARTMENTS = DEPARTMENTS;
