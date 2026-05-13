"use client";

import { useMemo, useState } from "react";
import { useData, useLang } from "@/components/Providers";
import { useToast } from "@/components/Toast";
import { LeaveModal } from "@/components/LeaveModal";
import { fmt } from "@/lib/i18n";
import { Avatar } from "@/components/Avatar";
import {
  CASUAL_CAP,
  CASUAL_WINDOW_DAYS,
  casualOverCapMap,
  leaveMultiplier,
  leaveWorkingDays,
} from "@/lib/leaves";
import type { LeaveRecord, LeaveType } from "@/lib/types";

const TYPE_BADGE: Record<LeaveType, string> = {
  permission: "badge-blue",
  half_day: "badge-blue",
  absence: "badge-red",
  casual: "badge-yellow",
  sick: "badge-purple",
};

export default function LeavesPage() {
  const { t, lang } = useLang();
  const { employees, leaves, deleteLeave } = useData();
  const { show: toast } = useToast();

  const today = new Date();
  const [empFilter, setEmpFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | LeaveType>("");
  const [month, setMonth] = useState<number | "">(today.getMonth());
  const [year, setYear] = useState<number | "">(today.getFullYear());

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveRecord | null>(null);

  const empName = (id: string) => {
    const e = employees.find((x) => x.id === id);
    if (!e) return id;
    return lang === "ar" ? e.name_ar : e.name_en;
  };
  const empDept = (id: string) => {
    const e = employees.find((x) => x.id === id);
    return e ? t(`dept_${e.department}` as const) : "";
  };

  // Per-employee over-cap maps for casual logic
  const overCapPerEmp = useMemo(() => {
    const grouped: Record<string, LeaveRecord[]> = {};
    for (const l of leaves) {
      (grouped[l.empId] ||= []).push(l);
    }
    const all = new Map<string, boolean>();
    for (const [, list] of Object.entries(grouped)) {
      const m = casualOverCapMap(list);
      m.forEach((v, k) => all.set(k, v));
    }
    return all;
  }, [leaves]);

  const filtered = useMemo(() => {
    return leaves.filter((l) => {
      if (empFilter && l.empId !== empFilter) return false;
      if (typeFilter && l.type !== typeFilter) return false;
      if (month !== "" && year !== "") {
        const mStart = new Date(year as number, month as number, 1);
        const mEnd = new Date(year as number, (month as number) + 1, 0);
        const lStart = new Date(l.startDate);
        const lEnd = new Date(l.endDate);
        if (lEnd < mStart || lStart > mEnd) return false;
      }
      return true;
    });
  }, [leaves, empFilter, typeFilter, month, year]);

  const sortedRows = useMemo(
    () =>
      filtered
        .slice()
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [filtered]
  );

  // Stats
  const totalLeaves = filtered.length;
  const totalAutoDeduction = useMemo(() => {
    let total = 0;
    for (const l of filtered) {
      const wd = leaveWorkingDays(l);
      const isOver = overCapPerEmp.get(l.id) ?? false;
      const m = leaveMultiplier(l.type, isOver, Boolean(l.medicalReport));
      total += wd * m;
    }
    return total;
  }, [filtered, overCapPerEmp]);
  const overCapCount = useMemo(
    () => filtered.filter((l) => l.type === "casual" && overCapPerEmp.get(l.id)).length,
    [filtered, overCapPerEmp]
  );

  const handleEdit = (l: LeaveRecord) => {
    setEditing(l);
    setModalOpen(true);
  };
  const handleDelete = (id: string) => {
    if (confirm(t("confirm_delete_leave"))) {
      deleteLeave(id);
      toast(t("leave_deleted"));
    }
  };

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 className="text-[24px] font-extrabold m-0 -tracking-[.3px]">
            {t("leaves_title")}
          </h1>
          <div className="text-muted text-[13px] mt-1">{t("leaves_sub")}</div>
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
          {t("add_leave")}
        </button>
      </div>

      {/* Rules card */}
      <div className="card mb-5">
        <div className="card-header">
          <h3 className="card-title">{t("leave_rules")}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 p-4">
          <RuleCard
            color="bg-blue-50 border-blue-200"
            icon="📝"
            title={t("lt_permission")}
            desc={t("lt_permission_desc")}
            mult="1×"
          />
          <RuleCard
            color="bg-sky-50 border-sky-200"
            icon="⏰"
            title={t("lt_half_day")}
            desc={t("lt_half_day_desc")}
            mult="0.5×"
          />
          <RuleCard
            color="bg-red-50 border-red-200"
            icon="🚫"
            title={t("lt_absence")}
            desc={t("lt_absence_desc")}
            mult="3×"
          />
          <RuleCard
            color="bg-amber-50 border-amber-200"
            icon="⚡"
            title={t("lt_casual")}
            desc={t("lt_casual_desc")}
            mult={`${CASUAL_CAP} / ${CASUAL_WINDOW_DAYS}d`}
          />
          <RuleCard
            color="bg-purple-50 border-purple-200"
            icon="🏥"
            title={t("lt_sick")}
            desc={t("lt_sick_desc")}
            mult="1× / 3×"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="stat">
          <div className="stat-icon bg-accent-soft text-amber-800">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <div className="stat-label">{t("total_leaves")}</div>
            <div className="stat-value">{fmt(totalLeaves, lang)}</div>
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon bg-red-100 text-red-700">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <div className="stat-label">{t("auto_deduction")}</div>
            <div className="stat-value">{fmt(totalAutoDeduction, lang)}</div>
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon bg-orange-100 text-orange-700">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <div className="stat-label">{t("over_cap_count")}</div>
            <div className="stat-value">{fmt(overCapCount, lang)}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-surface border border-line rounded-[12px] mb-4">
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
          <label>{t("leave_type")}</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as LeaveType | "")}
          >
            <option value="">{t("all")}</option>
            <option value="permission">{t("lt_permission")}</option>
            <option value="absence">{t("lt_absence")}</option>
            <option value="casual">{t("lt_casual")}</option>
            <option value="sick">{t("lt_sick")}</option>
          </select>
        </div>
        <div className="field">
          <label>{t("select_month")}</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">{t("all")}</option>
            {Array.from({ length: 12 }, (_, i) => i).map((i) => (
              <option key={i} value={i}>
                {(lang === "ar"
                  ? [
                      "يناير",
                      "فبراير",
                      "مارس",
                      "أبريل",
                      "مايو",
                      "يونيو",
                      "يوليو",
                      "أغسطس",
                      "سبتمبر",
                      "أكتوبر",
                      "نوفمبر",
                      "ديسمبر",
                    ]
                  : [
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ])[i]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t("select_year")}</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value === "" ? "" : Number(e.target.value))}
          >
            <option value="">{t("all")}</option>
            {Array.from({ length: 4 }, (_, i) => today.getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50">
                <Th>{t("employee")}</Th>
                <Th>{t("leave_type")}</Th>
                <Th>{t("start_date")}</Th>
                <Th>{t("end_date")}</Th>
                <Th>{t("days")}</Th>
                <Th>{t("multiplier")}</Th>
                <Th>{t("deducted")}</Th>
                <Th>{t("notes")}</Th>
                <Th className="text-end">{t("c_actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-muted">
                    {t("no_leaves")}
                  </td>
                </tr>
              ) : (
                sortedRows.map((l) => {
                  const wd = leaveWorkingDays(l);
                  const isOver = overCapPerEmp.get(l.id) ?? false;
                  const m = leaveMultiplier(
                    l.type,
                    isOver,
                    Boolean(l.medicalReport)
                  );
                  const ded = wd * m;
                  return (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={employees.find((e) => e.id === l.empId)?.photoUrl}
                            alt={empName(l.empId)}
                            size="md"
                          />
                          <div>
                            <div className="font-semibold">{empName(l.empId)}</div>
                            <div className="text-[11px] text-muted">
                              {empDept(l.empId)}
                            </div>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`badge ${TYPE_BADGE[l.type]}`}>
                            {t(`lt_${l.type}` as const)}
                          </span>
                          {l.type === "casual" && isOver && (
                            <span className="badge badge-red">{t("over_cap")}</span>
                          )}
                          {l.type === "sick" && (
                            <span
                              className={`badge ${
                                l.medicalReport ? "badge-green" : "badge-red"
                              }`}
                            >
                              {l.medicalReport ? "📋" : "⚠"}
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td className="mono">{l.startDate}</Td>
                      <Td className="mono">{l.endDate}</Td>
                      <Td className="mono">{fmt(wd, lang)}</Td>
                      <Td className="mono">{m === 0 ? "—" : `${m}×`}</Td>
                      <Td className={`mono font-bold ${ded > 0 ? "text-red-600" : "text-green-600"}`}>
                        {ded > 0 ? `-${fmt(ded, lang)}` : "0"}
                      </Td>
                      <Td className="text-muted text-[12px] max-w-[220px] truncate">
                        {l.notes || "—"}
                      </Td>
                      <Td className="text-end no-print">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => handleEdit(l)}
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
                            onClick={() => handleDelete(l.id)}
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
          <div className="text-[13px] text-muted">
            {fmt(filtered.length, lang)} {t("total_leaves")}
          </div>
          <div className="text-[13px] text-muted mono">
            {t("auto_deduction")}: {fmt(totalAutoDeduction, lang)} {t("days_count")}
          </div>
        </div>
      </div>

      <LeaveModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leave={editing}
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

function RuleCard({
  color,
  icon,
  title,
  desc,
  mult,
}: {
  color: string;
  icon: string;
  title: string;
  desc: string;
  mult: string;
}) {
  return (
    <div className={`rounded-[12px] border p-3.5 ${color}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-2xl">{icon}</span>
        <span className="badge badge-gray mono">{mult}</span>
      </div>
      <div className="font-bold text-[13px]">{title}</div>
      <div className="text-[11px] text-muted mt-1 leading-relaxed">{desc}</div>
    </div>
  );
}
