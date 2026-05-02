"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { I18N, type I18NKey } from "@/lib/i18n";
import type {
  AdjustmentMap,
  Employee,
  EmployeeActivity,
  Lang,
  LateRecord,
  LeaveRecord,
  PayrollAdjustment,
} from "@/lib/types";

/* ============ LANGUAGE ============ */
interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: I18NKey) => string;
  months: readonly string[];
}
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}

/* ============ DATA ============ */
interface DataContextValue {
  employees: Employee[];
  addEmployee: (data: Omit<Employee, "id">) => Employee;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  adjustments: AdjustmentMap;
  setAdjustment: (
    empId: string,
    year: number,
    month: number,
    patch: Partial<PayrollAdjustment>
  ) => void;
  bulkApprove: (empIds: string[], year: number, month: number) => void;

  leaves: LeaveRecord[];
  addLeave: (data: Omit<LeaveRecord, "id" | "createdAt">) => LeaveRecord;
  updateLeave: (id: string, patch: Partial<LeaveRecord>) => void;
  deleteLeave: (id: string) => void;

  lateRecords: LateRecord[];
  addLate: (data: Omit<LateRecord, "id" | "createdAt">) => LateRecord;
  updateLate: (id: string, patch: Partial<LateRecord>) => void;
  deleteLate: (id: string) => void;

  activities: EmployeeActivity[];
  addActivity: (
    data: Omit<EmployeeActivity, "id" | "createdAt">
  ) => EmployeeActivity;
  updateActivity: (id: string, patch: Partial<EmployeeActivity>) => void;
  deleteActivity: (id: string) => void;

  ready: boolean;
}
const DataContext = createContext<DataContextValue | null>(null);

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}

/* ============ PROVIDER ============ */
const STORAGE_LANG = "amd_lang";
const STORAGE_EMPLOYEES = "amd_employees_v6";
const STORAGE_ADJ = "amd_payroll_adj_v2";
const STORAGE_LEAVES = "amd_leaves_v2";
const STORAGE_LATE = "amd_late_v2";
const STORAGE_ACTIVITIES = "amd_activities_v2";

function adjKey(empId: string, year: number, month: number): string {
  return `${empId}-${year}-${month}`;
}

export function Providers({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [adjustments, setAdjustments] = useState<AdjustmentMap>({});
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [lateRecords, setLateRecords] = useState<LateRecord[]>([]);
  const [activities, setActivities] = useState<EmployeeActivity[]>([]);
  const [ready, setReady] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedLang = localStorage.getItem(STORAGE_LANG);
      if (storedLang === "ar" || storedLang === "en") setLangState(storedLang);

      // Start empty by default. Real data comes from the user
      // entering it through the UI (and, eventually, the Neon API).
      const storedEmps = localStorage.getItem(STORAGE_EMPLOYEES);
      if (storedEmps) {
        setEmployees(JSON.parse(storedEmps));
      }

      const storedAdj = localStorage.getItem(STORAGE_ADJ);
      if (storedAdj) setAdjustments(JSON.parse(storedAdj));

      const storedLeaves = localStorage.getItem(STORAGE_LEAVES);
      if (storedLeaves) setLeaves(JSON.parse(storedLeaves));

      const storedLate = localStorage.getItem(STORAGE_LATE);
      if (storedLate) setLateRecords(JSON.parse(storedLate));

      const storedActivities = localStorage.getItem(STORAGE_ACTIVITIES);
      if (storedActivities) setActivities(JSON.parse(storedActivities));
    } catch (e) {
      console.error("Failed to read storage", e);
    }
    setReady(true);
  }, []);

  // Sync html dir/lang
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_LANG, l);
    } catch {}
  }, []);

  const t = useCallback(
    (k: I18NKey) => {
      const v = I18N[lang][k];
      return typeof v === "string" ? v : (k as string);
    },
    [lang]
  );

  const months = useMemo(() => I18N[lang].months, [lang]);

  // ============ Employee actions ============
  const persistEmployees = (next: Employee[]) => {
    setEmployees(next);
    try {
      localStorage.setItem(STORAGE_EMPLOYEES, JSON.stringify(next));
    } catch {}
  };

  const persistActivities = (next: EmployeeActivity[]) => {
    setActivities(next);
    try {
      localStorage.setItem(STORAGE_ACTIVITIES, JSON.stringify(next));
    } catch {}
  };

  const newActivityId = () =>
    `ACT-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;

  const addEmployee = useCallback(
    (data: Omit<Employee, "id">): Employee => {
      const max = employees.reduce((m, e) => {
        const n = parseInt(e.id.replace("EMP-", ""), 10) || 0;
        return Math.max(m, n);
      }, 1000);
      const created: Employee = { ...data, id: `EMP-${max + 1}` };
      persistEmployees([...employees, created]);

      // Auto-log "hired"
      const hireActivity: EmployeeActivity = {
        id: newActivityId(),
        empId: created.id,
        type: "hired",
        date: created.hiringDate,
        title: "Employee hired",
        description: `Joined as ${created.title_en} in ${created.department}`,
        createdAt: new Date().toISOString(),
      };
      persistActivities([...activities, hireActivity]);

      return created;
    },
    [employees, activities]
  );

  const updateEmployee = useCallback(
    (id: string, patch: Partial<Employee>) => {
      const old = employees.find((e) => e.id === id);
      if (!old) return;
      const updated = { ...old, ...patch };
      persistEmployees(
        employees.map((e) => (e.id === id ? updated : e))
      );

      // Detect meaningful changes and auto-log
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date().toISOString();
      const newRecords: EmployeeActivity[] = [];

      if (old.salary !== updated.salary) {
        const diff = updated.salary - old.salary;
        newRecords.push({
          id: newActivityId(),
          empId: id,
          type: "salary_changed",
          date: today,
          title:
            diff > 0 ? "Salary increase" : "Salary adjustment",
          oldValue: old.salary,
          newValue: updated.salary,
          amount: diff,
          createdAt: now,
        });
      }
      if (old.title_en !== updated.title_en) {
        newRecords.push({
          id: newActivityId(),
          empId: id,
          type: "promoted",
          date: today,
          title: "Title change",
          oldValue: old.title_en,
          newValue: updated.title_en,
          createdAt: now,
        });
      }
      if (old.department !== updated.department) {
        newRecords.push({
          id: newActivityId(),
          empId: id,
          type: "transferred",
          date: today,
          title: "Department transfer",
          oldValue: old.department,
          newValue: updated.department,
          createdAt: now,
        });
      }
      if (old.status !== updated.status) {
        newRecords.push({
          id: newActivityId(),
          empId: id,
          type: "status_changed",
          date: today,
          title: "Status change",
          oldValue: old.status,
          newValue: updated.status,
          createdAt: now,
        });
      }
      if (old.type !== updated.type) {
        newRecords.push({
          id: newActivityId(),
          empId: id,
          type: "type_changed",
          date: today,
          title: "Employment type change",
          oldValue: old.type,
          newValue: updated.type,
          createdAt: now,
        });
      }
      if (old.contractType !== updated.contractType) {
        newRecords.push({
          id: newActivityId(),
          empId: id,
          type: "contract_changed",
          date: today,
          title: "Contract type change",
          oldValue: old.contractType ?? "—",
          newValue: updated.contractType ?? "—",
          createdAt: now,
        });
      }
      if (newRecords.length > 0) {
        persistActivities([...activities, ...newRecords]);
      }
    },
    [employees, activities]
  );

  const deleteEmployee = useCallback(
    (id: string) => {
      persistEmployees(employees.filter((e) => e.id !== id));
      const remainingLeaves = leaves.filter((l) => l.empId !== id);
      if (remainingLeaves.length !== leaves.length) {
        setLeaves(remainingLeaves);
        try {
          localStorage.setItem(STORAGE_LEAVES, JSON.stringify(remainingLeaves));
        } catch {}
      }
      const remainingLate = lateRecords.filter((r) => r.empId !== id);
      if (remainingLate.length !== lateRecords.length) {
        setLateRecords(remainingLate);
        try {
          localStorage.setItem(STORAGE_LATE, JSON.stringify(remainingLate));
        } catch {}
      }
      const remainingActivities = activities.filter((a) => a.empId !== id);
      if (remainingActivities.length !== activities.length) {
        setActivities(remainingActivities);
        try {
          localStorage.setItem(
            STORAGE_ACTIVITIES,
            JSON.stringify(remainingActivities)
          );
        } catch {}
      }
    },
    [employees, leaves, lateRecords, activities]
  );

  // ============ Adjustment actions ============
  const persistAdj = (next: AdjustmentMap) => {
    setAdjustments(next);
    try {
      localStorage.setItem(STORAGE_ADJ, JSON.stringify(next));
    } catch {}
  };

  const setAdjustment = useCallback(
    (
      empId: string,
      year: number,
      month: number,
      patch: Partial<PayrollAdjustment>
    ) => {
      const k = adjKey(empId, year, month);
      const cur: PayrollAdjustment = adjustments[k] ?? {
        unpaid: 0,
        deductions: 0,
        bonuses: 0,
        status: "draft",
      };
      const next = { ...adjustments, [k]: { ...cur, ...patch } };
      persistAdj(next);
    },
    [adjustments]
  );

  // ============ Leave actions ============
  const persistLeaves = (next: LeaveRecord[]) => {
    setLeaves(next);
    try {
      localStorage.setItem(STORAGE_LEAVES, JSON.stringify(next));
    } catch {}
  };

  const addLeave = useCallback(
    (data: Omit<LeaveRecord, "id" | "createdAt">): LeaveRecord => {
      const created: LeaveRecord = {
        ...data,
        id: `LV-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      persistLeaves([...leaves, created]);
      return created;
    },
    [leaves]
  );

  const updateLeave = useCallback(
    (id: string, patch: Partial<LeaveRecord>) => {
      persistLeaves(leaves.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    },
    [leaves]
  );

  const deleteLeave = useCallback(
    (id: string) => {
      persistLeaves(leaves.filter((l) => l.id !== id));
    },
    [leaves]
  );

  // ============ Late actions ============
  const persistLate = (next: LateRecord[]) => {
    setLateRecords(next);
    try {
      localStorage.setItem(STORAGE_LATE, JSON.stringify(next));
    } catch {}
  };

  const addLate = useCallback(
    (data: Omit<LateRecord, "id" | "createdAt">): LateRecord => {
      const created: LateRecord = {
        ...data,
        id: `LT-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      persistLate([...lateRecords, created]);
      return created;
    },
    [lateRecords]
  );

  const updateLate = useCallback(
    (id: string, patch: Partial<LateRecord>) => {
      persistLate(
        lateRecords.map((r) => (r.id === id ? { ...r, ...patch } : r))
      );
    },
    [lateRecords]
  );

  const deleteLate = useCallback(
    (id: string) => {
      persistLate(lateRecords.filter((r) => r.id !== id));
    },
    [lateRecords]
  );

  // ============ Activity actions (manual entries) ============
  const addActivity = useCallback(
    (data: Omit<EmployeeActivity, "id" | "createdAt">): EmployeeActivity => {
      const created: EmployeeActivity = {
        ...data,
        id: newActivityId(),
        createdAt: new Date().toISOString(),
      };
      persistActivities([...activities, created]);
      return created;
    },
    [activities]
  );

  const updateActivity = useCallback(
    (id: string, patch: Partial<EmployeeActivity>) => {
      persistActivities(
        activities.map((a) => (a.id === id ? { ...a, ...patch } : a))
      );
    },
    [activities]
  );

  const deleteActivity = useCallback(
    (id: string) => {
      persistActivities(activities.filter((a) => a.id !== id));
    },
    [activities]
  );

  const bulkApprove = useCallback(
    (empIds: string[], year: number, month: number) => {
      const next = { ...adjustments };
      empIds.forEach((id) => {
        const k = adjKey(id, year, month);
        const cur: PayrollAdjustment = next[k] ?? {
          unpaid: 0,
          deductions: 0,
          bonuses: 0,
          status: "draft",
        };
        if (cur.status === "draft" || cur.status === "pending") {
          next[k] = { ...cur, status: "approved" };
        }
      });
      persistAdj(next);
    },
    [adjustments]
  );

  const langValue = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t, months }),
    [lang, setLang, t, months]
  );

  const dataValue = useMemo<DataContextValue>(
    () => ({
      employees,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      adjustments,
      setAdjustment,
      bulkApprove,
      leaves,
      addLeave,
      updateLeave,
      deleteLeave,
      lateRecords,
      addLate,
      updateLate,
      deleteLate,
      activities,
      addActivity,
      updateActivity,
      deleteActivity,
      ready,
    }),
    [
      employees,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      adjustments,
      setAdjustment,
      bulkApprove,
      leaves,
      addLeave,
      updateLeave,
      deleteLeave,
      lateRecords,
      addLate,
      updateLate,
      deleteLate,
      activities,
      addActivity,
      updateActivity,
      deleteActivity,
      ready,
    ]
  );

  return (
    <LanguageContext.Provider value={langValue}>
      <DataContext.Provider value={dataValue}>{children}</DataContext.Provider>
    </LanguageContext.Provider>
  );
}
