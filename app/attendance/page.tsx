"use client";

import { useMemo, useState } from "react";
import { useData, useLang } from "@/components/Providers";
import { useToast } from "@/components/Toast";
import { LateModal } from "@/components/LateModal";
import { fmt, money } from "@/lib/i18n";
import { Avatar } from "@/components/Avatar";
import { calcLateDeduction } from "@/lib/lateness";
import { calcMonthDays, totalMonthlySalary } from "@/lib/payroll";
import type { LateRecord } from "@/lib/types";

export default function AttendancePage() {
  const { t, lang, months } = useLang();
  const { employees, lateRecords, deleteLate } = useData();
  const { show: toast } = useToast();

  const today = new Date();
  const [empFilter, setEmpFilter] = useState("");
  const [month, setMonth] = useState<number | "">(today.getMonth());
  const [year, setYear] = useState<number | "">(today.getFullYear());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LateRecord | null>(null);

  const empName = (id: string) => {
    const e = employees.find((x) => x.id === id);
    if (!e) return id;
    return lang === "ar" ? e.name_ar : e.name_en;
  };
  const empDept = (id: string) => {
    const e = employees.find((x) => x.id === id);
    return e ? t(`dept_${e.department}` as const) : "";
  };
  const empSalary = (id: string) => {
    const e = employees.find((x) => x.id === id);
    return e ? totalMonthlySalary(e) : 0;
  };

  const filtered = useMemo(() => {
    return lateRecords.filter((r) => {
      if (empFilter && r.empId !== empFilter) return false;
      if (month !== "" && year !== "") {
        const mStart = new Date(year as number, month as number, 1);
        const mEnd = new Date(year as number, (month as number) + 1, 0);
        const d = new Date(r.date);
        if (d < mStart || d > mEnd) return false;
      }
      return true;
    });
  }, [lateRecords, empFilter, month, year]);

  const sorted = useMemo(
    () => filtered.slice().sort((a, b) => b.date.localeCompare(a.date)),
    [filtered]
  );

  // Stats
  const totalEntries = filtered.length;
  const totalMinutes = filtered.reduce(
    (s, r) => s + (Number(r.lateMinutes) || 0),
    0
  );
  const totalDeduction = useMemo(() => {
    let total = 0;
    for (const r of filtered) {
      const d = new Date(r.date);
      const monthInfo = calcMonthDays(d.getFullYear(), d.getMonth());
      total += calcLateDeduction(
        r.lateMinutes,
        empSalary(r.empId),
        monthInfo.workDays
      );
    }
    return total;
  }, [filtered, employees]);

  const handleEdit = (r: LateRecord) => {
    setEditing(r);
    setModalOpen(true);
  };
  const handleDelete = (id: string) => {
    if (confirm(t("confirm_delete_late"))) {
      deleteLate(id);
      toast(t("late_deleted"));
    }
  };

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 className="text-[24px] font-extrabold m-0 -tracking-[.3px]">
            {t("attendance_title")}
          </h1>
          <div className="text-muted text-[13px] mt-1">{t("attendance_sub")}</div>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t("add_late")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="stat">
          <div className="stat-icon bg-accent-soft text-amber-800">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div className="stat-label">{t("late_entries")}</div>
            <div className="stat-value">{fmt(totalEntries, lang)}</div>
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon bg-orange-100 text-orange-700">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <div className="stat-label">{t("total_late_minutes")}</div>
            <div className="stat-value">
              {fmt(totalMinutes, lang)} {t("minutes")}
            </div>
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon bg-red-100 text-red-700">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <div className="stat-label">{t("auto_late_deduction")}</div>
            <div className="stat-value">{money(totalDeduction, lang)}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-surface border border-line rounded-[12px] mb-4">
        <div className="field">
          <label>{t("employee")}</label>
          <select value={empFilter} onChange={(e) => setEmpFilter(e.target.value)}>
            <option value="">{t("all")}</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {empName(e.id)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t("select_month")}</label>
          <select
            value={month}
            onChange={(e) =>
              setMonth(e.target.value === "" ? "" : Number(e.target.value))
            }
          >
            <option value="">{t("all")}</option>
            {months.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t("select_year")}</label>
          <select
            value={year}
            onChange={(e) =>
              setYear(e.target.value === "" ? "" : Number(e.target.value))
            }
          >
            <option value="">{t("all")}</option>
            {Array.from({ length: 4 }, (_, i) => today.getFullYear() - 2 + i).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50">
                <Th>{t("employee")}</Th>
                <Th>{t("late_date")}</Th>
                <Th>{t("late_minutes")}</Th>
                <Th>{t("late_deduction")}</Th>
                <Th>{t("notes")}</Th>
                <Th className="text-end">{t("c_actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-muted">
                    {t("no_late_entries")}
                  </td>
                </tr>
              ) : (
                sorted.map((r) => {
                  const d = new Date(r.date);
                  const monthInfo = calcMonthDays(d.getFullYear(), d.getMonth());
                  const ded = calcLateDeduction(
                    r.lateMinutes,
                    empSalary(r.empId),
                    monthInfo.workDays
                  );
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={employees.find((e) => e.id === r.empId)?.photoUrl}
                            alt={empName(r.empId)}
                            size="md"
                          />
                          <div>
                            <div className="font-semibold">{empName(r.empId)}</div>
                            <div className="text-[11px] text-muted">
                              {empDept(r.empId)}
                            </div>
                          </div>
                        </div>
                      </Td>
                      <Td className="mono">{r.date}</Td>
                      <Td className="mono">
                        {fmt(r.lateMinutes, lang)} {t("minutes")}
                      </Td>
                      <Td className="mono font-bold text-red-600">
                        -{money(ded, lang)}
                      </Td>
                      <Td className="text-muted text-[12px] max-w-[260px] truncate">
                        {r.notes || "—"}
                      </Td>
                      <Td className="text-end no-print">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => handleEdit(r)}
                            title={t("edit")}
                            className="btn btn-icon btn-soft"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            title={t("delete")}
                            className="btn btn-icon btn-danger"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="card-footer">
          <div className="text-[13px] text-muted">{t("work_hours_per_day")}</div>
          <div className="text-[13px] text-muted mono">
            {t("auto_late_deduction")}: {money(totalDeduction, lang)}
          </div>
        </div>
      </div>

      <LateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        record={editing}
      />
    </>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`text-start px-3.5 py-3 font-semibold text-muted text-[11px] uppercase tracking-wider border-b border-line whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`px-3.5 py-3.5 border-b border-line align-middle ${className}`}
    >
      {children}
    </td>
  );
}
