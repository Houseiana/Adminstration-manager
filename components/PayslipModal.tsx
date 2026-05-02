"use client";

import { Modal } from "./Modal";
import { useData, useLang } from "./Providers";
import { calcPayroll } from "@/lib/payroll";
import { fmt, money } from "@/lib/i18n";
import type { Employee } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  empId: string | null;
  year: number;
  month: number;
}

export function PayslipModal({ open, onClose, empId, year, month }: Props) {
  const { t, lang, months } = useLang();
  const { employees, adjustments, leaves, lateRecords } = useData();

  if (!empId) return null;
  const emp = employees.find((e) => e.id === empId);
  if (!emp) return null;

  const c = calcPayroll(emp, year, month, adjustments, leaves, lateRecords);
  const monthName = months[month];

  const empName = (e: Employee) => (lang === "ar" ? e.name_ar : e.name_en);
  const empTitle = (e: Employee) => (lang === "ar" ? e.title_ar : e.title_en);

  return (
    <Modal open={open} onClose={onClose} title={t("payslip")} hideHeader>
      <div className="flex items-center justify-between px-5 py-4 border-b border-line no-print">
        <h3 className="text-[17px] font-extrabold m-0">{t("payslip")}</h3>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="btn btn-soft btn-sm"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            {t("download_print")}
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[10px] grid place-items-center text-muted hover:bg-slate-100 hover:text-ink transition"
            aria-label="Close"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-8 bg-white">
        <div className="flex items-center justify-between border-b-2 border-ink pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-[12px] bg-accent grid place-items-center font-extrabold text-ink text-xl">
              A
            </div>
            <div>
              <div className="text-xl font-extrabold">{t("payslip")}</div>
              <div className="text-muted text-[13px]">
                {monthName} {year}
              </div>
            </div>
          </div>
          <div className="text-end text-[12px] text-muted">
            <div>
              <strong className="text-ink text-[14px]">{empName(emp)}</strong>
            </div>
            <div className="mono">{emp.id}</div>
            <div>{empTitle(emp)}</div>
            <div>{t(`dept_${emp.department}` as const)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div>
            <h4 className="text-[11px] text-muted uppercase tracking-wider font-bold mb-2.5">
              {t("t_salary")}
            </h4>
            <PayslipRow label={t("monthly_salary")} value={money(c.monthlySalary, lang)} />
            <PayslipRow label={t("c_daily")} value={money(c.dailySalary, lang)} />
            <PayslipRow label={t("gross")} value={money(c.earned, lang)} />
            {c.deductionsManual > 0 && (
              <PayslipRow
                label={t("manual_deductions")}
                value={`-${money(c.deductionsManual, lang)}`}
                valueClass="text-red-600"
              />
            )}
            {c.deductionsFromLate > 0 && (
              <PayslipRow
                label={`${t("auto_late_deduction")} (${fmt(c.lateMinutes, lang)} ${t("minutes")})`}
                value={`-${money(c.deductionsFromLate, lang)}`}
                valueClass="text-red-600"
              />
            )}
            {c.deductions === 0 && (
              <PayslipRow label={t("deductions")} value="—" />
            )}
            <PayslipRow
              label={t("bonuses")}
              value={c.bonuses ? `+${money(c.bonuses, lang)}` : "—"}
              valueClass={c.bonuses ? "text-green-600" : ""}
            />
          </div>
          <div>
            <h4 className="text-[11px] text-muted uppercase tracking-wider font-bold mb-2.5">
              {t("c_workdays")}
            </h4>
            <PayslipRow label={t("calendar_days")} value={fmt(c.monthInfo.total, lang)} />
            <PayslipRow label={t("total_workdays")} value={fmt(c.monthInfo.workDays, lang)} />
            <PayslipRow label={t("fri_off")} value={fmt(c.monthInfo.fri, lang)} />
            <PayslipRow label={t("sat_off")} value={fmt(c.monthInfo.sat, lang)} />
            <PayslipRow label={t("c_unpaid")} value={fmt(c.unpaidDays, lang)} />
            {c.unpaidFromLeaves > 0 && (
              <PayslipRow
                label={t("auto_unpaid")}
                value={fmt(c.unpaidFromLeaves, lang)}
                valueClass="text-red-600"
              />
            )}
            <PayslipRow label={t("c_worked")} value={fmt(c.workedDays, lang)} />
          </div>
        </div>

        <div className="bg-accent-soft border border-accent rounded-[12px] px-6 py-4 flex justify-between items-center mt-5">
          <span className="font-bold text-amber-800 text-[14px] uppercase tracking-wider">
            {t("net")}
          </span>
          <span className="text-[24px] font-extrabold text-ink mono">
            {money(c.net, lang)}
          </span>
        </div>

        <div className="mt-6 text-center text-[11px] text-muted">{t("auto_doc")}</div>
      </div>
    </Modal>
  );
}

function PayslipRow({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between py-2 border-b border-dashed border-line">
      <span className="text-muted">{label}</span>
      <span className={`font-semibold mono ${valueClass}`}>{value}</span>
    </div>
  );
}
