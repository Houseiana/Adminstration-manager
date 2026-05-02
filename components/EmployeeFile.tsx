"use client";

import { useMemo, useState } from "react";
import { useData, useLang } from "./Providers";
import { useToast } from "./Toast";
import { fmt, money } from "@/lib/i18n";
import { calcLateDeduction } from "@/lib/lateness";
import { calcMonthDays } from "@/lib/payroll";
import { leaveMultiplier, leaveWorkingDays } from "@/lib/leaves";
import { ACT_COLORS, ACT_ICONS, ActivityModal } from "./ActivityModal";
import type {
  ActivityType,
  Employee,
  EmployeeActivity,
} from "@/lib/types";

interface Props {
  employee: Employee;
}

export function EmployeeFile({ employee }: Props) {
  const { t, lang } = useLang();
  const { activities, leaves, lateRecords, deleteActivity } = useData();
  const { show: toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeActivity | null>(null);
  const [filter, setFilter] = useState<"" | ActivityType>("");

  const empActivities = useMemo(
    () =>
      activities
        .filter((a) => a.empId === employee.id)
        .filter((a) => !filter || a.type === filter)
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date)),
    [activities, employee.id, filter]
  );

  const empLeaves = useMemo(
    () =>
      leaves
        .filter((l) => l.empId === employee.id)
        .slice()
        .sort((a, b) => b.startDate.localeCompare(a.startDate))
        .slice(0, 5),
    [leaves, employee.id]
  );

  const empLate = useMemo(
    () =>
      lateRecords
        .filter((r) => r.empId === employee.id)
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [lateRecords, employee.id]
  );

  // Summary stats
  const allActivities = useMemo(
    () => activities.filter((a) => a.empId === employee.id),
    [activities, employee.id]
  );
  const totalPromotions = allActivities.filter(
    (a) => a.type === "promoted"
  ).length;
  const totalTransfers = allActivities.filter(
    (a) => a.type === "transferred"
  ).length;
  const totalPenalties = allActivities.filter(
    (a) => a.type === "penalty"
  ).length;
  const totalBonuses = allActivities.filter(
    (a) => a.type === "bonus" || a.type === "award"
  ).length;

  const yearsAtCompany = employee.hiringDate
    ? Math.max(
        0,
        (Date.now() - new Date(employee.hiringDate).getTime()) /
          (1000 * 60 * 60 * 24 * 365)
      )
    : 0;

  const handleDelete = (id: string) => {
    if (confirm(t("confirm_delete_activity"))) {
      deleteActivity(id);
      toast(t("activity_deleted"));
    }
  };

  const filterChips: { value: "" | ActivityType; label: string }[] = [
    { value: "", label: t("filter_all") },
    { value: "salary_changed", label: t("at_act_salary_changed") },
    { value: "promoted", label: t("at_act_promoted") },
    { value: "transferred", label: t("at_act_transferred") },
    { value: "penalty", label: t("at_act_penalty") },
    { value: "bonus", label: t("at_act_bonus") },
    { value: "note", label: t("at_act_note") },
  ];

  return (
    <div className="p-5 space-y-5">
      {/* History Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryStat
          icon="📅"
          label={t("profile_age_years")}
          value={`${fmt(Number(yearsAtCompany.toFixed(1)), lang)} y`}
        />
        <SummaryStat
          icon="⬆️"
          label={t("total_promotions")}
          value={fmt(totalPromotions, lang)}
        />
        <SummaryStat
          icon="🔀"
          label={t("total_transfers")}
          value={fmt(totalTransfers, lang)}
        />
        <SummaryStat
          icon="⚠️"
          label={t("total_penalties")}
          value={fmt(totalPenalties, lang)}
          danger={totalPenalties > 0}
        />
        <SummaryStat
          icon="🎁"
          label={t("total_bonuses")}
          value={fmt(totalBonuses, lang)}
        />
      </div>

      {/* Filter chips + Add Activity button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap gap-1.5">
          {filterChips.map((c) => (
            <button
              key={c.value || "all"}
              onClick={() => setFilter(c.value)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition ${
                filter === c.value
                  ? "bg-ink text-white border-ink"
                  : "bg-white text-muted border-line hover:border-line-strong hover:text-ink"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="btn btn-primary btn-sm"
        >
          + {t("add_activity")}
        </button>
      </div>

      {/* Timeline */}
      <div>
        <h3 className="text-[11px] text-muted uppercase tracking-wider font-bold mb-3">
          {t("activity_timeline")}
        </h3>
        {empActivities.length === 0 ? (
          <div className="text-center py-10 text-muted text-[13px] bg-slate-50 rounded-[12px]">
            {t("no_activities")}
          </div>
        ) : (
          <div className="relative">
            <div className={`absolute top-0 bottom-0 w-px bg-line ${lang === "ar" ? "right-[14px]" : "left-[14px]"}`} />
            <ol className="space-y-3">
              {empActivities.map((a) => (
                <TimelineItem
                  key={a.id}
                  activity={a}
                  onEdit={() => {
                    setEditing(a);
                    setModalOpen(true);
                  }}
                  onDelete={() => handleDelete(a.id)}
                />
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Recent Leaves */}
      {empLeaves.length > 0 && (
        <div>
          <h3 className="text-[11px] text-muted uppercase tracking-wider font-bold mb-2">
            {t("recent_leaves_section")}
          </h3>
          <div className="card overflow-hidden">
            <table className="w-full text-[13px]">
              <tbody>
                {empLeaves.map((l) => {
                  const wd = leaveWorkingDays(l);
                  const m = leaveMultiplier(
                    l.type,
                    false,
                    Boolean(l.medicalReport)
                  );
                  const ded = wd * m;
                  return (
                    <tr key={l.id} className="border-b border-line last:border-0">
                      <td className="px-3.5 py-2.5">
                        <span className="badge badge-blue">
                          {t(`lt_${l.type}` as const)}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 mono text-[12px]">
                        {l.startDate} → {l.endDate}
                      </td>
                      <td className="px-3.5 py-2.5 mono text-[12px]">
                        {fmt(wd, lang)} {t("days_count")}
                      </td>
                      <td className="px-3.5 py-2.5 mono text-[12px] font-bold text-end">
                        {ded > 0 ? (
                          <span className="text-red-600">
                            -{fmt(ded, lang)}
                          </span>
                        ) : (
                          <span className="text-green-600">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Late */}
      {empLate.length > 0 && (
        <div>
          <h3 className="text-[11px] text-muted uppercase tracking-wider font-bold mb-2">
            {t("recent_late_section")}
          </h3>
          <div className="card overflow-hidden">
            <table className="w-full text-[13px]">
              <tbody>
                {empLate.map((r) => {
                  const d = new Date(r.date);
                  const monthInfo = calcMonthDays(
                    d.getFullYear(),
                    d.getMonth()
                  );
                  const ded = calcLateDeduction(
                    r.lateMinutes,
                    employee.salary,
                    monthInfo.workDays
                  );
                  return (
                    <tr key={r.id} className="border-b border-line last:border-0">
                      <td className="px-3.5 py-2.5 mono text-[12px]">
                        {r.date}
                      </td>
                      <td className="px-3.5 py-2.5 mono text-[12px]">
                        {fmt(r.lateMinutes, lang)} {t("minutes")}
                      </td>
                      <td className="px-3.5 py-2.5 mono text-[12px] font-bold text-end text-red-600">
                        -{money(ded, lang)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ActivityModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        empId={employee.id}
        activity={editing}
      />
    </div>
  );
}

function SummaryStat({
  icon,
  label,
  value,
  danger = false,
}: {
  icon: string;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="bg-white border border-line rounded-[10px] p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">{icon}</span>
        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold leading-tight">
          {label}
        </span>
      </div>
      <div
        className={`text-[18px] font-extrabold ${
          danger ? "text-red-600" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function TimelineItem({
  activity,
  onEdit,
  onDelete,
}: {
  activity: EmployeeActivity;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t, lang } = useLang();
  const isManual = ["penalty", "bonus", "award", "note"].includes(
    activity.type
  );
  const colorClasses = ACT_COLORS[activity.type];

  let body: React.ReactNode = null;
  const fmtVal = (v: string | number | undefined) => {
    if (v === undefined || v === null || v === "") return "—";
    if (typeof v === "number") return new Intl.NumberFormat(
      lang === "ar" ? "ar-EG" : "en-US"
    ).format(v);
    return v;
  };

  if (
    activity.type === "salary_changed" ||
    activity.type === "promoted" ||
    activity.type === "transferred" ||
    activity.type === "status_changed" ||
    activity.type === "type_changed" ||
    activity.type === "contract_changed"
  ) {
    body = (
      <div className="flex items-center gap-2 text-[12px] text-muted mt-0.5 flex-wrap">
        <span className="bg-slate-100 px-2 py-0.5 rounded font-semibold">
          {t("from")}: {fmtVal(activity.oldValue)}
        </span>
        <span>→</span>
        <span className="bg-accent-soft px-2 py-0.5 rounded font-semibold text-amber-900">
          {t("to")}: {fmtVal(activity.newValue)}
        </span>
        {activity.amount !== undefined &&
          activity.type === "salary_changed" && (
            <span
              className={`font-bold ${
                activity.amount >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {activity.amount >= 0 ? "+" : ""}
              {fmtVal(activity.amount)}
            </span>
          )}
      </div>
    );
  }

  return (
    <li
      className={`relative flex items-start gap-3 ${
        lang === "ar" ? "pr-8" : "pl-8"
      }`}
    >
      <div
        className={`absolute ${
          lang === "ar" ? "right-0" : "left-0"
        } top-1.5 w-7 h-7 rounded-full border-2 grid place-items-center text-sm bg-white ${colorClasses}`}
      >
        {ACT_ICONS[activity.type]}
      </div>
      <div className="flex-1 bg-white border border-line rounded-[10px] p-3 hover:border-line-strong transition">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-[13px]">{activity.title}</span>
              <span className="text-[10px] text-muted bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                {activity.date}
              </span>
              <span
                className={`badge ${
                  activity.type === "penalty"
                    ? "badge-red"
                    : activity.type === "bonus" || activity.type === "award"
                    ? "badge-green"
                    : activity.type === "promoted"
                    ? "badge-blue"
                    : "badge-gray"
                }`}
              >
                {t(`at_act_${activity.type}` as const)}
              </span>
              {activity.severity && (
                <span className="badge badge-red">
                  {t(`severity_${activity.severity}` as const)}
                </span>
              )}
            </div>
            {body}
            {activity.amount !== undefined &&
              activity.type !== "salary_changed" && (
                <div
                  className={`text-[13px] font-bold mt-1.5 mono ${
                    activity.type === "penalty"
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {activity.type === "penalty" ? "-" : "+"}
                  {new Intl.NumberFormat(
                    lang === "ar" ? "ar-EG" : "en-US"
                  ).format(activity.amount)}{" "}
                  {t("currency")}
                </div>
              )}
            {activity.description && (
              <div className="text-[12px] text-muted mt-1.5 leading-relaxed">
                {activity.description}
              </div>
            )}
          </div>
          {isManual && (
            <div className="flex gap-1 shrink-0">
              <button
                onClick={onEdit}
                className="btn btn-icon btn-soft"
                title={t("edit")}
              >
                <svg
                  width="13"
                  height="13"
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
                onClick={onDelete}
                className="btn btn-icon btn-danger"
                title={t("delete")}
              >
                <svg
                  width="13"
                  height="13"
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
          )}
        </div>
      </div>
    </li>
  );
}
