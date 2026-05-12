"use client";

import { useMemo, useState } from "react";
import { useData, useLang } from "@/components/Providers";
import { ExpenseModal } from "@/components/ExpenseModal";
import { ReverseExpenseModal } from "@/components/ReverseExpenseModal";
import { ViewExpenseModal } from "@/components/ViewExpenseModal";
import { fmt, money } from "@/lib/i18n";
import type { ExpenseEntry } from "@/lib/types";

type View = "list" | "matrix";
type Scope = "year" | "month" | "day";

// Active entries = posted, not voided, not themselves a reversal.
// These are the ones that count toward totals.
function isActive(e: ExpenseEntry): boolean {
  return !e.voidedAt && !e.reversesId;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function FinancePage() {
  const { t, lang, months } = useLang();
  const { expenses } = useData();

  const today = new Date();
  const [scope, setScope] = useState<Scope>("year");
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [day, setDay] = useState(todayISO());
  const [view, setView] = useState<View>("matrix");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [reversing, setReversing] = useState<ExpenseEntry | null>(null);
  const [viewing, setViewing] = useState<ExpenseEntry | null>(null);
  const [presetMonth, setPresetMonth] = useState<number | undefined>(undefined);

  // Filter expenses based on current scope.
  const yearExpenses = useMemo(() => {
    const dayD = scope === "day" ? new Date(day) : null;
    return expenses.filter((e) => {
      if (scope === "year") {
        if (e.year !== year) return false;
      } else if (scope === "month") {
        if (e.year !== year || e.month !== month) return false;
      } else if (scope === "day" && dayD) {
        // Day scope: match on expense_date if present, else the
        // first of the entry's year/month (fallback).
        const ed = e.expenseDate ?? `${e.year}-${String(e.month + 1).padStart(2, "0")}-01`;
        if (ed !== day) return false;
      }
      if (search) {
        if (!e.category.toLowerCase().includes(search.toLowerCase()))
          return false;
      }
      return true;
    });
  }, [expenses, scope, year, month, day, search]);

  // Only active entries count toward totals.
  const activeYearExpenses = useMemo(
    () => yearExpenses.filter(isActive),
    [yearExpenses]
  );

  // Monthly totals (12 numbers, index 0..11)
  const monthlyTotals = useMemo(() => {
    const arr = new Array(12).fill(0) as number[];
    for (const e of activeYearExpenses) arr[e.month] += e.amount;
    return arr;
  }, [activeYearExpenses]);
  const grandTotal = monthlyTotals.reduce((s, n) => s + n, 0);
  const avgPerMonth = grandTotal / 12;

  // For matrix view: group only ACTIVE entries by category, then by month
  const matrix = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const e of activeYearExpenses) {
      if (!map.has(e.category)) {
        map.set(e.category, new Array(12).fill(0));
      }
      map.get(e.category)![e.month] += e.amount;
    }
    return Array.from(map.entries())
      .map(([category, vals]) => ({
        category,
        vals,
        total: vals.reduce((s, n) => s + n, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [activeYearExpenses]);

  const yearOptions = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i);
  }, [today]);

  const openAdd = (month?: number) => {
    setPresetMonth(month);
    setModalOpen(true);
  };

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 className="text-[24px] font-extrabold m-0 -tracking-[.3px]">
            {t("daily_variable_expenses")}
          </h1>
          <div className="text-muted text-[13px] mt-1">{t("finance_sub")}</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {scope === "year" && (
            <div className="flex items-center bg-slate-100 rounded-[10px] p-0.5">
              <button
                onClick={() => setView("matrix")}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition ${
                  view === "matrix"
                    ? "bg-white shadow-sm text-ink"
                    : "text-muted"
                }`}
              >
                {t("view_matrix")}
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition ${
                  view === "list" ? "bg-white shadow-sm text-ink" : "text-muted"
                }`}
              >
                {t("view_list")}
              </button>
            </div>
          )}
          <button onClick={() => openAdd()} className="btn btn-primary">
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
            {t("add_expense")}
          </button>
        </div>
      </div>

      {/* Stats — labels change with scope */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <Stat
          color="bg-accent-soft text-amber-800"
          label={
            scope === "day"
              ? t("total_for_day")
              : scope === "month"
              ? t("total_for_month")
              : t("total_for_year")
          }
          value={money(grandTotal, lang)}
        />
        <Stat
          color="bg-blue-100 text-blue-700"
          label={scope === "year" ? t("avg_per_month") : t("avg_per_day")}
          value={money(
            scope === "year"
              ? grandTotal / 12
              : scope === "month"
              ? grandTotal /
                new Date(year, month + 1, 0).getDate()
              : grandTotal,
            lang
          )}
        />
        <Stat
          color="bg-green-100 text-green-700"
          label={t("entries_count")}
          value={fmt(activeYearExpenses.length, lang)}
        />
      </div>

      {/* Scope tabs */}
      <div className="flex items-center bg-slate-100 rounded-[10px] p-0.5 mb-3 w-fit">
        {(["year", "month", "day"] as Scope[]).map((s) => (
          <button
            key={s}
            onClick={() => {
              setScope(s);
              if (s !== "year") setView("list");
            }}
            className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition ${
              scope === s ? "bg-white shadow-sm text-ink" : "text-muted"
            }`}
          >
            {t(`scope_${s}` as const)}
          </button>
        ))}
      </div>

      {/* Filters — fields shown depend on scope */}
      <div
        className={`grid grid-cols-1 ${
          scope === "day" ? "sm:grid-cols-2" : "sm:grid-cols-3"
        } gap-3 p-4 bg-surface border border-line rounded-[12px] mb-4`}
      >
        {scope === "day" ? (
          <div className="field">
            <label>{t("select_day")}</label>
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </div>
        ) : (
          <>
            <div className="field">
              <label>{t("expense_year")}</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            {scope === "month" && (
              <div className="field">
                <label>{t("select_month")}</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {months.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
        <div className="field">
          <label>{t("f_search")}</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("expense_category")}
          />
        </div>
      </div>

      {scope === "year" && view === "matrix" ? (
        <MatrixView
          matrix={matrix}
          monthlyTotals={monthlyTotals}
          grandTotal={grandTotal}
          months={months}
          lang={lang}
          t={t}
        />
      ) : (
        <ListView
          rows={yearExpenses}
          months={months}
          lang={lang}
          t={t}
          onReverse={(e) => setReversing(e)}
          onView={(e) => setViewing(e)}
        />
      )}

      <ExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultYear={year}
        defaultMonth={presetMonth}
      />

      <ReverseExpenseModal
        open={reversing !== null}
        onClose={() => setReversing(null)}
        expense={reversing}
      />

      <ViewExpenseModal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        expense={viewing}
        onReverse={(e) => {
          setViewing(null);
          setReversing(e);
        }}
        onShowOther={(e) => setViewing(e)}
      />
    </>
  );
}

/* ============ STAT ============ */
function Stat({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="stat">
      <div className={`stat-icon ${color}`}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

/* ============ MATRIX VIEW ============ */
function MatrixView({
  matrix,
  monthlyTotals,
  grandTotal,
  months,
  lang,
  t,
}: {
  matrix: { category: string; vals: number[]; total: number }[];
  monthlyTotals: number[];
  grandTotal: number;
  months: readonly string[];
  lang: string;
  t: (k: never) => string;
}) {
  if (matrix.length === 0) {
    return (
      <div className="card">
        <div className="card-body empty">
          {(t as (k: string) => string)("no_expenses")}
        </div>
      </div>
    );
  }
  const shortMonths = (lang === "ar"
    ? "ينا فبر مار أبر ماي يون يول أغس سبت أكت نوف ديس"
    : "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec"
  ).split(" ");
  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-slate-50">
              <th
                className="sticky text-start px-3 py-2.5 font-semibold text-muted text-[11px] uppercase tracking-wider border-b border-line whitespace-nowrap"
                style={{
                  [lang === "ar" ? "right" : "left"]: 0,
                  background: "#fafbfc",
                }}
              >
                {(t as (k: string) => string)("expense_category")}
              </th>
              {shortMonths.map((m) => (
                <th
                  key={m}
                  className="text-center px-2 py-2.5 font-semibold text-muted text-[10px] uppercase tracking-wider border-b border-line whitespace-nowrap"
                >
                  {m}
                </th>
              ))}
              <th className="text-end px-3 py-2.5 font-bold text-ink text-[11px] uppercase tracking-wider border-b border-line whitespace-nowrap bg-accent-soft">
                {(t as (k: string) => string)("grand_total")}
              </th>
            </tr>
          </thead>
          <tbody>
            {matrix.map(({ category, vals, total }) => (
              <tr key={category} className="hover:bg-slate-50">
                <td
                  className="px-3 py-2.5 border-b border-line font-semibold whitespace-nowrap sticky"
                  style={{
                    [lang === "ar" ? "right" : "left"]: 0,
                    background: "white",
                  }}
                >
                  {category}
                </td>
                {vals.map((v, i) => (
                  <td
                    key={i}
                    className="text-center px-2 py-2.5 border-b border-line mono"
                  >
                    {v > 0 ? new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 0 }).format(v) : ""}
                  </td>
                ))}
                <td className="text-end px-3 py-2.5 border-b border-line mono font-bold bg-accent-soft text-amber-900 whitespace-nowrap">
                  {money(total, lang as "en" | "ar")}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-900 text-white">
              <td
                className="px-3 py-2.5 font-bold uppercase tracking-wider text-[11px] sticky"
                style={{
                  [lang === "ar" ? "right" : "left"]: 0,
                  background: "#0f172a",
                }}
              >
                {(t as (k: string) => string)("monthly_total")}
              </td>
              {monthlyTotals.map((v, i) => (
                <td key={i} className="text-center px-2 py-2.5 mono font-bold">
                  {v > 0 ? new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 0 }).format(v) : ""}
                </td>
              ))}
              <td className="text-end px-3 py-2.5 mono font-extrabold bg-accent text-ink whitespace-nowrap">
                {money(grandTotal, lang as "en" | "ar")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ LIST VIEW ============ */
function ListView({
  rows,
  months,
  lang,
  t,
  onReverse,
  onView,
}: {
  rows: ExpenseEntry[];
  months: readonly string[];
  lang: string;
  t: (k: never) => string;
  onReverse: (e: ExpenseEntry) => void;
  onView: (e: ExpenseEntry) => void;
}) {
  const tt = t as (k: string) => string;
  if (rows.length === 0) {
    return (
      <div className="card">
        <div className="card-body empty">{tt("no_expenses")}</div>
      </div>
    );
  }
  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-slate-50">
              <Th>{tt("col_date")}</Th>
              <Th>{tt("expense_category")}</Th>
              <Th>{tt("col_vendor")}</Th>
              <Th>{tt("col_invoice")}</Th>
              <Th>{tt("expense_amount")}</Th>
              <Th>{tt("col_authorized")}</Th>
              <Th>{tt("expense_notes")}</Th>
              <Th className="text-end">{tt("c_actions")}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const displayDate =
                e.expenseDate || `${e.year}-${String(e.month + 1).padStart(2, "0")}`;
              const isVoided = Boolean(e.voidedAt);
              const isReversal = Boolean(e.reversesId);
              const inactive = isVoided || isReversal;
              return (
                <tr
                  key={e.id}
                  className={`hover:bg-slate-50 ${
                    isVoided ? "bg-red-50/30" : isReversal ? "bg-amber-50/40" : ""
                  }`}
                >
                  <Td className="mono whitespace-nowrap">
                    <div>{displayDate}</div>
                    <div className="text-[10px] text-muted">
                      {months[e.month]} {e.year}
                    </div>
                  </Td>
                  <Td>
                    <div
                      className={`font-semibold ${
                        isVoided ? "line-through text-muted" : ""
                      }`}
                    >
                      {e.category}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {isReversal && (
                        <span className="badge badge-yellow">
                          ↺ {tt("reversal_badge")}
                        </span>
                      )}
                      {isVoided && (
                        <span className="badge badge-red">
                          ✕ {tt("voided_badge")}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td className={isVoided ? "line-through text-muted" : ""}>
                    {e.vendorName || "—"}
                  </Td>
                  <Td>
                    {isReversal ? (
                      <span className="text-[11px] text-muted italic">—</span>
                    ) : e.hasInvoice ? (
                      e.invoiceNumber ? (
                        <span
                          className={`mono text-[12px] ${
                            isVoided ? "line-through" : ""
                          }`}
                        >
                          {e.invoiceNumber}
                        </span>
                      ) : (
                        <span className="badge badge-green">
                          {tt("has_invoice")}
                        </span>
                      )
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="badge badge-red">
                          {tt("no_invoice")}
                        </span>
                        {e.noInvoiceReason && (
                          <span className="text-[11px] text-muted max-w-[180px] truncate">
                            {e.noInvoiceReason}
                          </span>
                        )}
                      </div>
                    )}
                  </Td>
                  <Td
                    className={`mono font-bold whitespace-nowrap ${
                      isVoided ? "line-through text-muted" : ""
                    }`}
                  >
                    {money(e.amount, lang as "en" | "ar")}
                  </Td>
                  <Td className="text-[12px]">{e.authorizedBy || "—"}</Td>
                  <Td className="text-muted text-[12px] max-w-[200px] truncate">
                    {isReversal && e.reversalReason ? (
                      <span className="italic">
                        {tt("reverse_reason")}: {e.reversalReason}
                      </span>
                    ) : (
                      e.notes ?? "—"
                    )}
                  </Td>
                  <Td className="text-end">
                    <div className="inline-flex gap-1 flex-wrap justify-end">
                      <button
                        onClick={() => onView(e)}
                        title={tt("view_entry")}
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
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      {!inactive && (
                        <button
                          onClick={() => onReverse(e)}
                          title={tt("reverse_entry")}
                          className="btn btn-soft btn-sm whitespace-nowrap"
                        >
                          ↺ {tt("reverse_entry")}
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
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
    <td className={`px-3.5 py-3.5 border-b border-line align-middle ${className}`}>
      {children}
    </td>
  );
}
