"use client";

import Link from "next/link";
import { useData, useLang } from "@/components/Providers";
import { fmt, money } from "@/lib/i18n";
import { calcMonthDays } from "@/lib/payroll";
import { StatusBadge } from "@/components/Badges";
import { Avatar } from "@/components/Avatar";

export default function DashboardPage() {
  const { t, lang } = useLang();
  const { employees } = useData();

  const active = employees.filter((e) => e.status === "active");
  const today = new Date();
  const monthInfo = calcMonthDays(today.getFullYear(), today.getMonth());
  const totalPayroll = active.reduce(
    (s, e) => s + (Number(e.salary) || 0),
    0
  );
  const recent = [...employees].slice(-6).reverse();

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 className="text-[24px] font-extrabold m-0 -tracking-[.3px]">
            {t("dashboard_title")}
          </h1>
          <div className="text-muted text-[13px] mt-1">{t("dashboard_sub")}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Stat
          color="bg-accent-soft text-amber-800"
          label={t("stat_total_employees")}
          value={fmt(employees.length, lang)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </Stat>
        <Stat
          color="bg-green-100 text-green-700"
          label={t("stat_active")}
          value={fmt(active.length, lang)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </Stat>
        <Stat
          color="bg-blue-100 text-blue-700"
          label={t("stat_payroll")}
          value={money(totalPayroll, lang)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </Stat>
        <Stat
          color="bg-purple-100 text-purple-700"
          label={t("stat_workdays")}
          value={`${fmt(monthInfo.workDays, lang)} / ${fmt(monthInfo.total, lang)}`}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </Stat>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{t("recent_employees")}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50">
                <Th>{t("c_name")}</Th>
                <Th>{t("c_dept")}</Th>
                <Th>{t("c_title")}</Th>
                <Th>{t("c_salary")}</Th>
                <Th>{t("c_status")}</Th>
              </tr>
            </thead>
            <tbody>
              {recent.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-3.5 py-3.5 border-b border-line">
                    <Link
                      href={`/employees/${e.id}`}
                      className="flex items-center gap-2.5"
                    >
                      <Avatar
                        src={e.photoUrl}
                        alt={lang === "ar" ? e.name_ar : e.name_en}
                        size="md"
                      />
                      <div>
                        <div className="font-semibold">
                          {lang === "ar" ? e.name_ar : e.name_en}
                        </div>
                        <div className="text-[11px] text-muted">{e.id}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-3.5 py-3.5 border-b border-line">
                    {t(`dept_${e.department}` as const)}
                  </td>
                  <td className="px-3.5 py-3.5 border-b border-line">
                    {lang === "ar" ? e.title_ar : e.title_en}
                  </td>
                  <td className="px-3.5 py-3.5 border-b border-line mono">
                    {money(e.salary, lang)}
                  </td>
                  <td className="px-3.5 py-3.5 border-b border-line">
                    <StatusBadge status={e.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-start px-3.5 py-3 font-semibold text-muted text-[11px] uppercase tracking-wider border-b border-line">
      {children}
    </th>
  );
}
