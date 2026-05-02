"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useData, useLang } from "@/components/Providers";
import { useToast } from "@/components/Toast";
import { money } from "@/lib/i18n";
import { totalMonthlySalary } from "@/lib/payroll";
import { Avatar } from "@/components/Avatar";
import { StatusBadge } from "@/components/Badges";
import { EmployeeModal } from "@/components/EmployeeModal";
import { EmployeeFile } from "@/components/EmployeeFile";
import type { Employee } from "@/lib/types";

type Tab = "personal" | "education" | "job" | "salary" | "file";

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useLang();
  const { employees, deleteEmployee, ready } = useData();
  const { show: toast } = useToast();
  const [tab, setTab] = useState<Tab>("personal");
  const [modalOpen, setModalOpen] = useState(false);

  const emp = employees.find((e) => e.id === params.id);

  if (!ready) return null;
  if (!emp) {
    return (
      <div className="card">
        <div className="card-body text-center py-14 text-muted">
          {t("no_results")}
          <div className="mt-4">
            <Link href="/employees" className="btn btn-soft">
              {t("back")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const empName = (e: Employee) => (lang === "ar" ? e.name_ar : e.name_en);
  const empTitle = (e: Employee) => (lang === "ar" ? e.title_ar : e.title_en);

  const handleDelete = () => {
    if (confirm(t("confirm_delete"))) {
      deleteEmployee(emp.id);
      toast(t("deleted"));
      router.push("/employees");
    }
  };

  const rows: [string, React.ReactNode][] =
    tab === "personal"
      ? [
          [t("full_name"), empName(emp)],
          [t("phone"), emp.phone],
          [t("email"), emp.email],
          [t("address"), emp.address || "—"],
          [t("national_id"), emp.nationalId || "—"],
          [t("dob"), emp.dob || "—"],
          [
            t("marital_status"),
            emp.maritalStatus ? t(`ms_${emp.maritalStatus}` as const) : "—",
          ],
          [t("children_count"), String(emp.childrenCount ?? 0)],
        ]
      : tab === "education"
      ? [
          [t("education_label"), emp.education || "—"],
          [t("previous_experience"), emp.previousExperience || "—"],
          [t("work_phone"), emp.workPhone || "—"],
          [t("emergency_phone"), emp.emergencyPhone || "—"],
        ]
      : tab === "job"
      ? [
          [t("c_id"), emp.id],
          [t("job_title"), empTitle(emp)],
          [t("department"), t(`dept_${emp.department}` as const)],
          [t("emp_type"), t(`t_${emp.type}` as const)],
          [
            t("contract_type"),
            emp.contractType ? t(`ct_${emp.contractType}` as const) : "—",
          ],
          [t("hiring_date"), emp.hiringDate],
          [t("work_location"), emp.location || "—"],
          [t("manager"), emp.manager || "—"],
          [t("status"), <StatusBadge key="s" status={emp.status} />],
        ]
      : [
          [t("monthly_salary"), money(emp.salary, lang)],
          [t("allowances"), money(emp.allowances ?? 0, lang)],
          [t("commission"), money(emp.commission ?? 0, lang)],
          [t("raise_amount"), money(emp.raise ?? 0, lang)],
          [t("raise_date"), emp.raiseDate || "—"],
          [
            t("total_compensation"),
            <span key="t" className="text-ink font-extrabold">
              {money(totalMonthlySalary(emp), lang)}
            </span>,
          ],
          [t("payment_method"), t(`pm_${emp.paymentMethod}` as const)],
          [t("bank_account"), emp.bankAccount || "—"],
          [t("salary_start"), emp.hiringDate],
        ];

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div className="flex items-center gap-3">
          <Link href="/employees" className="btn btn-ghost btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {t("back")}
          </Link>
          <div>
            <h1 className="text-[24px] font-extrabold m-0 -tracking-[.3px]">
              {t("emp_details_title")}
            </h1>
            <div className="text-muted text-[13px] mt-1">{t("emp_details_sub")}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModalOpen(true)} className="btn btn-ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {t("edit")}
          </button>
          <button onClick={handleDelete} className="btn btn-danger">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            {t("delete")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5">
        <div className="card p-6 text-center">
          <div className="mx-auto mb-3.5 flex justify-center">
            <Avatar src={emp.photoUrl} alt={empName(emp)} size="xl" />
          </div>
          <h2 className="text-[18px] font-extrabold m-0">{empName(emp)}</h2>
          <div className="text-muted text-[13px] mt-1">
            {empTitle(emp)} · {t(`dept_${emp.department}` as const)}
          </div>
          <div className="mt-2.5">
            <StatusBadge status={emp.status} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-line text-start">
            <ProfStat label={t("c_id")} value={emp.id} mono />
            <ProfStat label={t("emp_type")} value={t(`t_${emp.type}` as const)} />
            <ProfStat label={t("hiring_date")} value={emp.hiringDate} mono />
            <ProfStat label={t("total_compensation")} value={money(totalMonthlySalary(emp), lang)} mono />
          </div>
        </div>

        <div className="card p-0">
          <div className="flex gap-1 border-b border-line px-5 overflow-x-auto">
            <TabButton active={tab === "personal"} onClick={() => setTab("personal")}>
              {t("t_personal")}
            </TabButton>
            <TabButton active={tab === "education"} onClick={() => setTab("education")}>
              {t("section_education")}
            </TabButton>
            <TabButton active={tab === "job"} onClick={() => setTab("job")}>
              {t("t_job")}
            </TabButton>
            <TabButton active={tab === "salary"} onClick={() => setTab("salary")}>
              {t("t_salary")}
            </TabButton>
            <TabButton active={tab === "file"} onClick={() => setTab("file")}>
              📂 {t("file_tab")}
            </TabButton>
          </div>
          {tab === "file" ? (
            <EmployeeFile employee={emp} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5">
              {rows.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <div className="text-[11px] text-muted uppercase tracking-wider font-semibold">
                    {label}
                  </div>
                  <div className="font-semibold text-[14px]">{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EmployeeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        employee={emp}
      />
    </>
  );
}

function ProfStat({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] text-muted uppercase tracking-wider">{label}</div>
      <div className={`font-bold text-[14px] mt-0.5 ${mono ? "mono" : ""}`}>{value}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3.5 font-semibold text-[13px] -mb-px border-b-2 transition ${
        active
          ? "text-ink border-accent"
          : "text-muted border-transparent hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
