"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useData, useLang } from "@/components/Providers";
import { useToast } from "@/components/Toast";
import { fmt, money } from "@/lib/i18n";
import { ALL_DEPARTMENTS } from "@/lib/seed";
import { StatusBadge } from "@/components/Badges";
import { EmployeeModal } from "@/components/EmployeeModal";
import { Avatar } from "@/components/Avatar";
import type { Employee } from "@/lib/types";

const PER_PAGE = 10;

export default function EmployeesPage() {
  const { t, lang } = useLang();
  const { employees, deleteEmployee } = useData();
  const { show: toast } = useToast();

  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (dept && e.department !== dept) return false;
      if (status && e.status !== status) return false;
      if (type && e.type !== type) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${e.id} ${e.name_en} ${e.name_ar} ${e.email} ${e.phone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [employees, search, dept, status, type]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * PER_PAGE;
  const pageItems = filtered.slice(start, start + PER_PAGE);

  const exportCSV = () => {
    const rows: (string | number)[][] = [
      ["ID", "Name", "Title", "Department", "Phone", "Email", "Type", "Salary", "Status"],
    ];
    filtered.forEach((e) =>
      rows.push([
        e.id,
        e.name_en,
        e.title_en,
        e.department,
        e.phone,
        e.email,
        e.type,
        e.salary,
        e.status,
      ])
    );
    const csv = rows
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
    a.download = `employees-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEdit = (emp: Employee) => {
    setEditing(emp);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t("confirm_delete"))) {
      deleteEmployee(id);
      toast(t("deleted"));
    }
  };

  const empName = (e: Employee) => (lang === "ar" ? e.name_ar : e.name_en);
  const empTitle = (e: Employee) => (lang === "ar" ? e.title_ar : e.title_en);

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 className="text-[24px] font-extrabold m-0 -tracking-[.3px]">{t("emp_title")}</h1>
          <div className="text-muted text-[13px] mt-1">{t("emp_sub")}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={exportCSV} className="btn btn-ghost">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t("export")}
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t("add_employee")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-surface border border-line rounded-[12px] mb-4">
        <div className="field">
          <label>{t("f_search")}</label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("emp_search_ph")}
          />
        </div>
        <div className="field">
          <label>{t("f_dept")}</label>
          <select value={dept} onChange={(e) => { setDept(e.target.value); setPage(1); }}>
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
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">{t("all")}</option>
            <option value="active">{t("st_active")}</option>
            <option value="inactive">{t("st_inactive")}</option>
            <option value="leave">{t("st_leave")}</option>
            <option value="terminated">{t("st_terminated")}</option>
          </select>
        </div>
        <div className="field">
          <label>{t("f_type")}</label>
          <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">{t("all")}</option>
            <option value="full">{t("t_full")}</option>
            <option value="part">{t("t_part")}</option>
            <option value="contract">{t("t_contract")}</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50">
                <Th>{t("c_id")}</Th>
                <Th>{t("c_name")}</Th>
                <Th>{t("c_title")}</Th>
                <Th>{t("c_dept")}</Th>
                <Th>{t("c_phone")}</Th>
                <Th>{t("c_email")}</Th>
                <Th>{t("c_type")}</Th>
                <Th>{t("c_salary")}</Th>
                <Th>{t("c_status")}</Th>
                <Th className="text-end">{t("c_actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-14 text-muted">
                    {t("no_results")}
                  </td>
                </tr>
              ) : (
                pageItems.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <Td className="mono">{e.id}</Td>
                    <Td>
                      <Link href={`/employees/${e.id}`} className="flex items-center gap-2.5">
                        <Avatar src={e.photoUrl} alt={empName(e)} size="md" />
                        <div>
                          <div className="font-semibold">{empName(e)}</div>
                          <div className="text-[11px] text-muted">{e.email}</div>
                        </div>
                      </Link>
                    </Td>
                    <Td>{empTitle(e)}</Td>
                    <Td>{t(`dept_${e.department}` as const)}</Td>
                    <Td className="mono">{e.phone}</Td>
                    <Td>{e.email}</Td>
                    <Td>
                      <span className="badge badge-gray">{t(`t_${e.type}` as const)}</span>
                    </Td>
                    <Td className="mono">{money(e.salary, lang)}</Td>
                    <Td>
                      <StatusBadge status={e.status} />
                    </Td>
                    <Td className="text-end no-print">
                      <div className="inline-flex gap-1">
                        <Link
                          href={`/employees/${e.id}`}
                          title={t("view_details")}
                          className="btn btn-icon btn-soft"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleEdit(e)}
                          title={t("edit")}
                          className="btn btn-icon btn-soft"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          title={t("delete")}
                          className="btn btn-icon btn-danger"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="card-footer">
          <div className="text-[13px] text-muted">
            {t("showing")} {start + 1}-{Math.min(start + pageItems.length, filtered.length)}{" "}
            {t("of")} {filtered.length}
          </div>
          <Pager page={safePage} pages={pages} onPage={setPage} />
        </div>
      </div>

      <EmployeeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        employee={editing}
      />
    </>
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

function Pager({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (p: number) => void;
}) {
  const buttons: (number | "...")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (pages > 7 && p > 2 && p < pages - 1 && Math.abs(p - page) > 1) {
      if (p === page - 2 || p === page + 2) buttons.push("...");
      continue;
    }
    buttons.push(p);
  }

  return (
    <div className="flex items-center gap-1.5">
      <PageBtn onClick={() => onPage(Math.max(1, page - 1))}>‹</PageBtn>
      {buttons.map((b, i) =>
        b === "..." ? (
          <PageBtn key={`d${i}`} disabled>
            …
          </PageBtn>
        ) : (
          <PageBtn key={b} active={b === page} onClick={() => onPage(b)}>
            {b}
          </PageBtn>
        )
      )}
      <PageBtn onClick={() => onPage(Math.min(pages, page + 1))}>›</PageBtn>
    </div>
  );
}

function PageBtn({
  children,
  active = false,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`w-8 h-8 rounded-lg border font-semibold text-[13px] transition ${
        active
          ? "bg-ink text-white border-ink"
          : "bg-white text-muted border-line hover:bg-slate-100 hover:text-ink"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}
