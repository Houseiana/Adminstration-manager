"use client";

import { useMemo, useState } from "react";
import { useData, useLang } from "@/components/Providers";
import { useToast } from "@/components/Toast";
import { fmt, money } from "@/lib/i18n";
import { Avatar } from "@/components/Avatar";
import { ALL_DEPARTMENTS } from "@/lib/seed";
import { calcMonthDays, calcPayroll, type PayrollResult } from "@/lib/payroll";
import { PayrollStatusBadge } from "@/components/Badges";
import { AdjustmentsModal } from "@/components/AdjustmentsModal";
import { PayslipModal } from "@/components/PayslipModal";
import type { Employee } from "@/lib/types";

export default function PayrollPage() {
  const { t, lang, months } = useLang();
  const { employees, adjustments, setAdjustment, bulkApprove, leaves, lateRecords } = useData();
  const { show: toast } = useToast();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [dept, setDept] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const [adjOpen, setAdjOpen] = useState(false);
  const [slipOpen, setSlipOpen] = useState(false);
  const [activeEmpId, setActiveEmpId] = useState<string | null>(null);

  const rows = useMemo(() => {
    return employees
      .filter((e) => {
        if (e.status === "terminated" || e.status === "inactive") return false;
        if (dept && e.department !== dept) return false;
        if (status && e.status !== status) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !`${e.id} ${e.name_en} ${e.name_ar}`.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      })
      .map((emp) => ({
        emp,
        calc: calcPayroll(emp, year, month, adjustments, leaves, lateRecords),
      }))
      // Hide employees who aren't yet hired (or who were terminated)
      // for the entire selected month — they have no eligible work
      // days, so they should not show any amounts at all.
      .filter(({ calc }) => calc.eligibleWorkDays > 0);
  }, [employees, dept, status, search, year, month, adjustments, leaves, lateRecords]);

  const monthInfo = calcMonthDays(year, month);
  const totalGross = rows.reduce((s, r) => s + r.calc.earned, 0);
  const totalNet = rows.reduce((s, r) => s + r.calc.net, 0);

  const empName = (e: Employee) => (lang === "ar" ? e.name_ar : e.name_en);
  const empTitle = (e: Employee) => (lang === "ar" ? e.title_ar : e.title_en);

  const handleApproveAll = () => {
    bulkApprove(rows.map((r) => r.emp.id), year, month);
    toast(t("approved"));
  };

  const exportCSV = () => {
    const out: (string | number)[][] = [
      [
        "ID",
        "Name",
        "Department",
        "MonthlySalary",
        "WorkingDays",
        "Worked",
        "OffDays",
        "Unpaid",
        "Daily",
        "Deductions",
        "Bonuses",
        "Net",
        "Status",
      ],
    ];
    rows.forEach(({ emp, calc }) =>
      out.push([
        emp.id,
        emp.name_en,
        emp.department,
        calc.monthlySalary,
        calc.monthInfo.workDays,
        calc.workedDays,
        calc.monthInfo.off,
        calc.unpaidDays,
        calc.dailySalary.toFixed(2),
        calc.deductions,
        calc.bonuses,
        calc.net.toFixed(2),
        calc.status,
      ])
    );
    const csv = out
      .map((r) =>
        r
          .map((c) => {
            const s = String(c ?? "").replace(/"/g, '""');
            return /[",\n]/.test(s) ? `"${s}"` : s;
          })
          .join(",")
      )
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${year}-${month + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 className="text-[24px] font-extrabold m-0 -tracking-[.3px]">{t("pay_title")}</h1>
          <div className="text-muted text-[13px] mt-1">{t("pay_sub")}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportCSV} className="btn btn-ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t("export_payroll")}
          </button>
          <button onClick={handleApproveAll} className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {t("approve_all")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <Stat color="bg-accent-soft text-amber-800" label={t("pay_total_employees")} value={fmt(rows.length, lang)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="7" r="4" />
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          </svg>
        </Stat>
        <Stat color="bg-blue-100 text-blue-700" label={t("pay_total_workdays")} value={fmt(monthInfo.workDays, lang)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </Stat>
        <Stat color="bg-orange-100 text-orange-700" label={t("pay_total_gross")} value={money(totalGross, lang)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </Stat>
        <Stat color="bg-green-100 text-green-700" label={t("pay_total_net")} value={money(totalNet, lang)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </Stat>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 p-4 bg-surface border border-line rounded-[12px] mb-4">
        <div className="field">
          <label>{t("select_month")}</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t("select_year")}</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: 4 }, (_, i) => today.getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t("f_dept")}</label>
          <select value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">{t("all")}</option>
            {ALL_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {t(`dept_${d}` as const)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t("f_status")}</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t("all")}</option>
            <option value="active">{t("st_active")}</option>
            <option value="leave">{t("st_leave")}</option>
          </select>
        </div>
        <div className="field">
          <label>{t("f_search")}</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("emp_search_ph")}
          />
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50">
                <Th>{t("c_id")}</Th>
                <Th>{t("c_name")}</Th>
                <Th>{t("c_dept")}</Th>
                <Th>{t("c_monthly")}</Th>
                <Th>{t("c_workdays")}</Th>
                <Th>{t("c_worked")}</Th>
                <Th>{t("c_offdays")}</Th>
                <Th>{t("c_unpaid")}</Th>
                <Th>{t("c_daily")}</Th>
                <Th>{t("c_deduct")}</Th>
                <Th>{t("c_bonus")}</Th>
                <Th>{t("c_net")}</Th>
                <Th>{t("c_pay_status")}</Th>
                <Th className="text-end">{t("c_actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-14 text-muted">
                    {t("no_results")}
                  </td>
                </tr>
              ) : (
                rows.map(({ emp, calc }) => (
                  <PayrollRow
                    key={emp.id}
                    emp={emp}
                    calc={calc}
                    name={empName(emp)}
                    title={empTitle(emp)}
                    deptLabel={t(`dept_${emp.department}` as const)}
                    onAdjust={() => {
                      setActiveEmpId(emp.id);
                      setAdjOpen(true);
                    }}
                    onSlip={() => {
                      setActiveEmpId(emp.id);
                      setSlipOpen(true);
                    }}
                    onApprove={() => {
                      setAdjustment(emp.id, year, month, { status: "approved" });
                      toast(t("approved"));
                    }}
                    onPaid={() => {
                      setAdjustment(emp.id, year, month, { status: "paid" });
                      toast(t("paid"));
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="card-footer">
          <div className="text-[13px] text-muted">
            {fmt(rows.length, lang)} {t("employees_count")}
          </div>
          <div className="text-[13px] text-muted mono">
            {t("pay_total_net")}: {money(totalNet, lang)}
          </div>
        </div>
      </div>

      <AdjustmentsModal
        open={adjOpen}
        onClose={() => setAdjOpen(false)}
        empId={activeEmpId}
        year={year}
        month={month}
      />
      <PayslipModal
        open={slipOpen}
        onClose={() => setSlipOpen(false)}
        empId={activeEmpId}
        year={year}
        month={month}
      />
    </>
  );
}

function PayrollRow({
  emp,
  calc,
  name,
  title,
  deptLabel,
  onAdjust,
  onSlip,
  onApprove,
  onPaid,
}: {
  emp: Employee;
  calc: PayrollResult;
  name: string;
  title: string;
  deptLabel: string;
  onAdjust: () => void;
  onSlip: () => void;
  onApprove: () => void;
  onPaid: () => void;
}) {
  const { t, lang } = useLang();
  return (
    <tr className="hover:bg-slate-50">
      <Td className="mono">{emp.id}</Td>
      <Td>
        <div className="flex items-center gap-2.5">
          <Avatar src={emp.photoUrl} alt={name} size="md" />
          <div>
            <div className="font-semibold">{name}</div>
            <div className="text-[11px] text-muted">{title}</div>
          </div>
        </div>
      </Td>
      <Td>{deptLabel}</Td>
      <Td className="mono">{money(calc.monthlySalary, lang)}</Td>
      <Td className="mono">{fmt(calc.monthInfo.workDays, lang)}</Td>
      <Td className="mono">{fmt(calc.workedDays, lang)}</Td>
      <Td className="mono">{fmt(calc.monthInfo.off, lang)}</Td>
      <Td className="mono">{fmt(calc.unpaidDays, lang)}</Td>
      <Td className="mono">{money(calc.dailySalary, lang)}</Td>
      <Td className="mono text-red-600">
        {calc.deductions ? `-${money(calc.deductions, lang)}` : "—"}
      </Td>
      <Td className="mono text-green-600">
        {calc.bonuses ? `+${money(calc.bonuses, lang)}` : "—"}
      </Td>
      <Td className="mono font-bold">{money(calc.net, lang)}</Td>
      <Td>
        <PayrollStatusBadge status={calc.status} />
      </Td>
      <Td className="text-end no-print">
        <div className="inline-flex gap-1">
          <button
            onClick={onSlip}
            title={t("payslip")}
            className="btn btn-icon btn-soft"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </button>
          <button
            onClick={onAdjust}
            title={t("edit_adjustments")}
            className="btn btn-icon btn-soft"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          {(calc.status === "draft" || calc.status === "pending") && (
            <button
              onClick={onApprove}
              title={t("approve")}
              className="btn btn-icon bg-blue-100 text-blue-700 hover:bg-blue-200 border-transparent"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          )}
          {calc.status === "approved" && (
            <button
              onClick={onPaid}
              title={t("mark_paid")}
              className="btn btn-icon bg-green-100 text-green-700 hover:bg-green-200 border-transparent"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </button>
          )}
        </div>
      </Td>
    </tr>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`text-start px-3.5 py-3 font-semibold text-muted text-[11px] uppercase tracking-wider border-b border-line whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-3.5 py-3.5 border-b border-line align-middle ${className}`}>
      {children}
    </td>
  );
}

function Stat({
  color,
  label,
  value,
  children,
}: {
  color: string;
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="stat">
      <div className={`stat-icon ${color}`}>{children}</div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}
