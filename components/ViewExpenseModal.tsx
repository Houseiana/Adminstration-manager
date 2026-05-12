"use client";

import { Modal } from "./Modal";
import { useData, useLang } from "./Providers";
import { money } from "@/lib/i18n";
import type { ExpenseEntry } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  expense: ExpenseEntry | null;
  onReverse?: (e: ExpenseEntry) => void;
  onShowOther?: (e: ExpenseEntry) => void;
}

export function ViewExpenseModal({
  open,
  onClose,
  expense,
  onReverse,
  onShowOther,
}: Props) {
  const { t, lang, months } = useLang();
  const { expenses } = useData();

  if (!expense) return null;

  const isVoided = Boolean(expense.voidedAt);
  const isReversal = Boolean(expense.reversesId);

  // For a voided original, find its reversal.
  const reversalOfThis = isVoided
    ? expenses.find((e) => e.reversesId === expense.id) ?? null
    : null;
  // For a reversal, find the original it cancels.
  const originalOfThis = isReversal
    ? expenses.find((e) => e.id === expense.reversesId) ?? null
    : null;

  const statusBadge = isVoided ? (
    <span className="badge badge-red">✕ {t("entry_status_voided")}</span>
  ) : isReversal ? (
    <span className="badge badge-yellow">↺ {t("entry_status_reversal")}</span>
  ) : (
    <span className="badge badge-green">{t("entry_status_active")}</span>
  );

  const dateStr =
    expense.expenseDate ||
    `${expense.year}-${String(expense.month + 1).padStart(2, "0")}-01`;

  const canReverse = !isVoided && !isReversal && onReverse;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("view_entry_title")}
      maxWidth="max-w-[620px]"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-ghost">
            {t("cancel")}
          </button>
          {canReverse && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onReverse(expense);
              }}
              className="btn btn-danger"
            >
              ↺ {t("reverse_entry")}
            </button>
          )}
        </>
      }
    >
      <div className="p-4 sm:p-5 space-y-4">
        {/* Status header */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-line">
          <div>
            <div className="text-[24px] font-extrabold mono">
              {money(expense.amount, lang)}
            </div>
            <div className="text-[12px] text-muted mt-0.5">
              {expense.category}
            </div>
          </div>
          {statusBadge}
        </div>

        {/* Reversal relationship banner */}
        {isVoided && reversalOfThis && (
          <div className="bg-red-50 border border-red-200 rounded-[10px] p-3 text-[12px]">
            <div className="font-semibold text-red-700 mb-1">
              {t("voided_by_entry")} {reversalOfThis.id.slice(0, 8)}
            </div>
            {reversalOfThis.reversalReason && (
              <div className="text-muted">
                {t("reverse_reason")}: {reversalOfThis.reversalReason}
              </div>
            )}
            {onShowOther && (
              <button
                onClick={() => onShowOther(reversalOfThis)}
                className="text-red-700 underline mt-1.5 text-[12px]"
              >
                ↗ {t("view_entry")}
              </button>
            )}
          </div>
        )}
        {isReversal && originalOfThis && (
          <div className="bg-amber-50 border border-amber-200 rounded-[10px] p-3 text-[12px]">
            <div className="font-semibold text-amber-900 mb-1">
              {t("reverses_entry")} {originalOfThis.id.slice(0, 8)}
            </div>
            {expense.reversalReason && (
              <div className="text-muted">
                {t("reverse_reason")}: {expense.reversalReason}
              </div>
            )}
            {onShowOther && (
              <button
                onClick={() => onShowOther(originalOfThis)}
                className="text-amber-900 underline mt-1.5 text-[12px]"
              >
                ↗ {t("view_entry")}
              </button>
            )}
          </div>
        )}

        {/* 💰 Expense details */}
        <Section icon="💰" title={t("section_expense_details")}>
          <Row label={t("expense_category")} value={expense.category} />
          <Row label={t("expense_amount")} value={money(expense.amount, lang)} />
          <Row
            label={t("col_date")}
            value={`${dateStr} (${months[expense.month]} ${expense.year})`}
          />
        </Section>

        {/* 🧾 Invoice */}
        <Section icon="🧾" title={t("section_invoice")}>
          <Row label={t("vendor_name")} value={expense.vendorName ?? "—"} />
          {isReversal ? (
            <Row label={t("invoice_number")} value="—" />
          ) : expense.hasInvoice ? (
            <Row
              label={t("invoice_number")}
              value={expense.invoiceNumber ?? t("has_invoice")}
            />
          ) : (
            <>
              <Row
                label={t("invoice_number")}
                value={t("no_invoice")}
                valueClass="text-red-600 font-bold"
              />
              {expense.noInvoiceReason && (
                <Row
                  label={t("no_invoice_reason")}
                  value={expense.noInvoiceReason}
                />
              )}
            </>
          )}
        </Section>

        {/* 📦 Supplier */}
        {(expense.supplierName ||
          expense.supplierPhone ||
          expense.supplierAddress) && (
          <Section icon="📦" title={t("section_supplier")}>
            <Row label={t("supplier_name")} value={expense.supplierName ?? "—"} />
            <Row label={t("supplier_phone")} value={expense.supplierPhone ?? "—"} />
            <Row
              label={t("supplier_address")}
              value={expense.supplierAddress ?? "—"}
            />
          </Section>
        )}

        {/* ✅ Approval & notes */}
        <Section icon="✅" title={t("section_approval")}>
          <Row label={t("authorized_by")} value={expense.authorizedBy ?? "—"} />
          {expense.notes && (
            <Row label={t("expense_notes")} value={expense.notes} />
          )}
        </Section>

        {/* Footer meta */}
        <div className="pt-3 border-t border-line text-[11px] text-muted grid grid-cols-2 gap-1.5">
          <div>
            <span className="font-semibold">{t("posted_on")}: </span>
            <span className="mono">
              {new Date(expense.createdAt).toLocaleString(
                lang === "ar" ? "ar-EG" : "en-US"
              )}
            </span>
          </div>
          {isVoided && expense.voidedAt && (
            <div>
              <span className="font-semibold">{t("voided_on")}: </span>
              <span className="mono">
                {new Date(expense.voidedAt).toLocaleString(
                  lang === "ar" ? "ar-EG" : "en-US"
                )}
              </span>
            </div>
          )}
          <div className="col-span-2 mono">
            <span className="font-semibold">ID: </span>
            {expense.id}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] font-bold text-ink uppercase tracking-wider mb-2">
        <span className="text-base">{icon}</span>
        {title}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 bg-slate-50 border border-line rounded-[10px] p-3">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = "",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
        {label}
      </div>
      <div className={`font-semibold text-[13px] ${valueClass}`}>{value}</div>
    </div>
  );
}
