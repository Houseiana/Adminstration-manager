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
  ExpenseEntry,
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
  addEmployee: (data: Omit<Employee, "id">) => Promise<Employee>;
  updateEmployee: (id: string, patch: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  adjustments: AdjustmentMap;
  setAdjustment: (
    empId: string,
    year: number,
    month: number,
    patch: Partial<PayrollAdjustment>
  ) => Promise<void>;
  bulkApprove: (
    empIds: string[],
    year: number,
    month: number
  ) => Promise<void>;

  leaves: LeaveRecord[];
  addLeave: (data: Omit<LeaveRecord, "id" | "createdAt">) => Promise<LeaveRecord>;
  updateLeave: (id: string, patch: Partial<LeaveRecord>) => Promise<void>;
  deleteLeave: (id: string) => Promise<void>;

  lateRecords: LateRecord[];
  addLate: (data: Omit<LateRecord, "id" | "createdAt">) => Promise<LateRecord>;
  updateLate: (id: string, patch: Partial<LateRecord>) => Promise<void>;
  deleteLate: (id: string) => Promise<void>;

  activities: EmployeeActivity[];
  addActivity: (
    data: Omit<EmployeeActivity, "id" | "createdAt">
  ) => Promise<EmployeeActivity>;
  updateActivity: (
    id: string,
    patch: Partial<EmployeeActivity>
  ) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;

  expenses: ExpenseEntry[];
  addExpense: (
    data: Omit<ExpenseEntry, "id" | "createdAt">
  ) => Promise<ExpenseEntry>;
  // Posted expenses cannot be edited or deleted. To correct one,
  // call reverseExpense — that creates a paired reversal entry
  // and marks the original as voided.
  reverseExpense: (id: string, reason?: string) => Promise<ExpenseEntry>;

  loadError: string | null;

  ready: boolean;
  refresh: () => Promise<void>;
}
const DataContext = createContext<DataContextValue | null>(null);

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}

/* ============ HTTP ============ */
interface ApiInit {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function api<T>(path: string, init?: ApiInit): Promise<T> {
  const hasBody = init?.body !== undefined && init?.body !== null;
  const opts: RequestInit = {
    method: init?.method ?? "GET",
    cache: "no-store",
    credentials: "include",
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    body: hasBody ? JSON.stringify(init!.body) : undefined,
  };
  const res = await fetch(path, opts);
  if (res.status === 401) {
    // Session expired or missing — bounce to /login so the user can
    // sign back in instead of staring at an empty UI.
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      const from = window.location.pathname + window.location.search;
      window.location.href = `/login?from=${encodeURIComponent(from)}`;
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

/* ============ PROVIDER ============ */
const STORAGE_LANG = "amd_lang";

function adjKey(empId: string, year: number, month: number): string {
  return `${empId}-${year}-${month}`;
}

interface ApiAdjustment extends PayrollAdjustment {
  empId: string;
  year: number;
  month: number;
}

export function Providers({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [adjustments, setAdjustments] = useState<AdjustmentMap>({});
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [lateRecords, setLateRecords] = useState<LateRecord[]>([]);
  const [activities, setActivities] = useState<EmployeeActivity[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ------------ Bootstrap from API ------------
  const refresh = useCallback(async () => {
    try {
      const [
        empRes,
        leaveRes,
        lateRes,
        actRes,
        adjRes,
        expRes,
      ] = await Promise.all([
        api<{ employees: Employee[] }>("/api/employees"),
        api<{ leaves: LeaveRecord[] }>("/api/leaves"),
        api<{ lateRecords: LateRecord[] }>("/api/late"),
        api<{ activities: EmployeeActivity[] }>("/api/activities"),
        api<{ adjustments: ApiAdjustment[] }>("/api/payroll-adjustments"),
        api<{ expenses: ExpenseEntry[] }>("/api/expenses"),
      ]);
      setEmployees(empRes.employees);
      setLeaves(leaveRes.leaves);
      setLateRecords(lateRes.lateRecords);
      setActivities(actRes.activities);
      setExpenses(expRes.expenses);
      const adjMap: AdjustmentMap = {};
      for (const a of adjRes.adjustments) {
        adjMap[adjKey(a.empId, a.year, a.month)] = {
          unpaid: a.unpaid,
          deductions: a.deductions,
          bonuses: a.bonuses,
          notes: a.notes,
          status: a.status,
        };
      }
      setAdjustments(adjMap);
      setLoadError(null);
    } catch (e) {
      // 401s redirect to /login automatically (see api()), so we
      // don't surface those. Other errors get surfaced in the UI.
      const isLoginPage =
        typeof window !== "undefined" && window.location.pathname === "/login";
      const msg = e instanceof Error ? e.message : String(e);
      if (!isLoginPage && msg !== "Unauthorized") {
        console.error("Failed to load data from API", e);
        setLoadError(msg);
      }
    }
  }, []);

  useEffect(() => {
    try {
      const storedLang = localStorage.getItem(STORAGE_LANG);
      if (storedLang === "ar" || storedLang === "en") setLangState(storedLang);
    } catch {}

    // On /login, skip the data fetch (would 401 anyway).
    const isLoginPage =
      typeof window !== "undefined" && window.location.pathname === "/login";
    if (isLoginPage) {
      setReady(true);
      return;
    }
    refresh().finally(() => setReady(true));
  }, [refresh]);

  // Re-fetch data when the user returns to the tab so stale tabs
  // don't keep showing yesterday's snapshot.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onFocus = () => {
      if (window.location.pathname === "/login") return;
      refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") onFocus();
    });
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

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

  /* ---------- Employees ---------- */
  const addEmployee = useCallback(
    async (data: Omit<Employee, "id">): Promise<Employee> => {
      const { employee } = await api<{ employee: Employee }>(
        "/api/employees",
        { method: "POST", body: data }
      );
      setEmployees((p) => [...p, employee]);
      // The server also created a 'hired' activity; reload activities.
      const { activities: acts } = await api<{ activities: EmployeeActivity[] }>(
        "/api/activities"
      );
      setActivities(acts);
      return employee;
    },
    []
  );

  const updateEmployee = useCallback(
    async (id: string, patch: Partial<Employee>) => {
      const { employee } = await api<{ employee: Employee }>(
        `/api/employees/${id}`,
        { method: "PUT", body: patch }
      );
      setEmployees((p) => p.map((e) => (e.id === id ? employee : e)));
      // Server may have logged auto-activities for meaningful diffs.
      const { activities: acts } = await api<{ activities: EmployeeActivity[] }>(
        "/api/activities"
      );
      setActivities(acts);
    },
    []
  );

  const deleteEmployee = useCallback(async (id: string) => {
    await api(`/api/employees/${id}`, { method: "DELETE" });
    setEmployees((p) => p.filter((e) => e.id !== id));
    setLeaves((p) => p.filter((l) => l.empId !== id));
    setLateRecords((p) => p.filter((r) => r.empId !== id));
    setActivities((p) => p.filter((a) => a.empId !== id));
    setAdjustments((p) => {
      const next: AdjustmentMap = {};
      for (const k of Object.keys(p)) {
        if (!k.startsWith(`${id}-`)) next[k] = p[k];
      }
      return next;
    });
  }, []);

  /* ---------- Adjustments ---------- */
  const setAdjustment = useCallback(
    async (
      empId: string,
      year: number,
      month: number,
      patch: Partial<PayrollAdjustment>
    ) => {
      const { adjustment } = await api<{ adjustment: ApiAdjustment }>(
        "/api/payroll-adjustments",
        {
          method: "PUT",
          body: {
            empId,
            year,
            month,
            unpaid: patch.unpaid,
            deductions: patch.deductions,
            bonuses: patch.bonuses,
            status: patch.status,
            notes: patch.notes,
          },
        }
      );
      setAdjustments((p) => ({
        ...p,
        [adjKey(empId, year, month)]: {
          unpaid: adjustment.unpaid,
          deductions: adjustment.deductions,
          bonuses: adjustment.bonuses,
          notes: adjustment.notes,
          status: adjustment.status,
        },
      }));
    },
    []
  );

  const bulkApprove = useCallback(
    async (empIds: string[], year: number, month: number) => {
      // Sequential to keep the API simple; not many employees.
      for (const id of empIds) {
        const k = adjKey(id, year, month);
        const cur = adjustments[k];
        if (cur && (cur.status === "approved" || cur.status === "paid")) continue;
        await setAdjustment(id, year, month, { status: "approved" });
      }
    },
    [adjustments, setAdjustment]
  );

  /* ---------- Leaves ---------- */
  const addLeave = useCallback(
    async (data: Omit<LeaveRecord, "id" | "createdAt">): Promise<LeaveRecord> => {
      const { leave } = await api<{ leave: LeaveRecord }>("/api/leaves", {
        method: "POST",
        body: data,
      });
      setLeaves((p) => [leave, ...p]);
      return leave;
    },
    []
  );

  const updateLeave = useCallback(
    async (id: string, patch: Partial<LeaveRecord>) => {
      const { leave } = await api<{ leave: LeaveRecord }>(`/api/leaves/${id}`, {
        method: "PUT",
        body: patch,
      });
      setLeaves((p) => p.map((l) => (l.id === id ? leave : l)));
    },
    []
  );

  const deleteLeave = useCallback(async (id: string) => {
    await api(`/api/leaves/${id}`, { method: "DELETE" });
    setLeaves((p) => p.filter((l) => l.id !== id));
  }, []);

  /* ---------- Late ---------- */
  const addLate = useCallback(
    async (data: Omit<LateRecord, "id" | "createdAt">): Promise<LateRecord> => {
      const { lateRecord } = await api<{ lateRecord: LateRecord }>(
        "/api/late",
        { method: "POST", body: data }
      );
      setLateRecords((p) => [lateRecord, ...p]);
      return lateRecord;
    },
    []
  );

  const updateLate = useCallback(
    async (id: string, patch: Partial<LateRecord>) => {
      const { lateRecord } = await api<{ lateRecord: LateRecord }>(
        `/api/late/${id}`,
        { method: "PUT", body: patch }
      );
      setLateRecords((p) => p.map((r) => (r.id === id ? lateRecord : r)));
    },
    []
  );

  const deleteLate = useCallback(async (id: string) => {
    await api(`/api/late/${id}`, { method: "DELETE" });
    setLateRecords((p) => p.filter((r) => r.id !== id));
  }, []);

  /* ---------- Activities ---------- */
  const addActivity = useCallback(
    async (
      data: Omit<EmployeeActivity, "id" | "createdAt">
    ): Promise<EmployeeActivity> => {
      const { activity } = await api<{ activity: EmployeeActivity }>(
        "/api/activities",
        { method: "POST", body: data }
      );
      setActivities((p) => [activity, ...p]);
      return activity;
    },
    []
  );

  const updateActivity = useCallback(
    async (id: string, patch: Partial<EmployeeActivity>) => {
      const { activity } = await api<{ activity: EmployeeActivity }>(
        `/api/activities/${id}`,
        { method: "PUT", body: patch }
      );
      setActivities((p) => p.map((a) => (a.id === id ? activity : a)));
    },
    []
  );

  const deleteActivity = useCallback(async (id: string) => {
    await api(`/api/activities/${id}`, { method: "DELETE" });
    setActivities((p) => p.filter((a) => a.id !== id));
  }, []);

  /* ---------- Expenses ---------- */
  const addExpense = useCallback(
    async (
      data: Omit<ExpenseEntry, "id" | "createdAt">
    ): Promise<ExpenseEntry> => {
      const { expense } = await api<{ expense: ExpenseEntry }>(
        "/api/expenses",
        { method: "POST", body: data }
      );
      setExpenses((p) => [expense, ...p]);
      return expense;
    },
    []
  );

  const reverseExpense = useCallback(
    async (id: string, reason?: string): Promise<ExpenseEntry> => {
      const { reversal, voided } = await api<{
        reversal: ExpenseEntry;
        voided: ExpenseEntry;
      }>(`/api/expenses/${id}/reverse`, {
        method: "POST",
        body: { reason },
      });
      setExpenses((p) => {
        // Replace the original with the voided version and prepend the reversal.
        const next = p.map((e) => (e.id === voided.id ? voided : e));
        return [reversal, ...next];
      });
      return reversal;
    },
    []
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
      expenses,
      addExpense,
      reverseExpense,
      loadError,
      ready,
      refresh,
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
      expenses,
      addExpense,
      reverseExpense,
      loadError,
      ready,
      refresh,
    ]
  );

  return (
    <LanguageContext.Provider value={langValue}>
      <DataContext.Provider value={dataValue}>{children}</DataContext.Provider>
    </LanguageContext.Provider>
  );
}
