"use client";

import { FormEvent, useEffect, useState } from "react";
import { Modal } from "./Modal";
import { useData, useLang } from "./Providers";
import { useToast } from "./Toast";
import { money } from "@/lib/i18n";
import type { ExpenseEntry } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  expense: ExpenseEntry | null;
}

export function ReverseExpenseModal({ open, onClose, expense }: Props) {
  const { t, lang, months } = useLang();
  const { reverseExpense } = useData();
  const { show: toast } = useToast();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setBusy(false);
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!expense || busy) return;
    setBusy(true);
    try {
      await reverseExpense(expense.id, reason.trim() || undefined);
      toast(t("reversal_recorded"));
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error";
      alert(msg);
      setBusy(false);
    }
  };

  if (!expense) return null;

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={t("reverse_entry_title")}
      maxWidth="max-w-[520px]"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="btn btn-ghost"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            form="reverseForm"
            disabled={busy}
            className="btn btn-danger disabled:opacity-50"
          >
            {busy ? "..." : t("confirm_reverse")}
          </button>
        </>
      }
    >
      <form id="reverseForm" onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="bg-amber-50 border border-amber-300 rounded-[10px] p-3 text-[12px] text-amber-900 leading-relaxed">
          ⚠ {t("reverse_entry_warning")}
        </div>

        <div className="bg-slate-50 border border-line rounded-[10px] p-3.5">
          <div className="text-[11px] text-muted uppercase tracking-wider font-bold mb-1.5">
            {t("expense_category")}
          </div>
          <div className="font-bold text-[14px]">{expense.category}</div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-[12px]">
            <div>
              <span className="text-muted">{t("expense_amount")}: </span>
              <span className="mono font-bold">
                {money(expense.amount, lang)}
              </span>
            </div>
            <div>
              <span className="text-muted">{t("expense_date_full")}: </span>
              <span className="mono">
                {expense.expenseDate ||
                  `${months[expense.month]} ${expense.year}`}
              </span>
            </div>
            {expense.vendorName && (
              <div className="col-span-2">
                <span className="text-muted">{t("vendor_name")}: </span>
                <span>{expense.vendorName}</span>
              </div>
            )}
            {expense.invoiceNumber && (
              <div className="col-span-2">
                <span className="text-muted">{t("invoice_number")}: </span>
                <span className="mono">{expense.invoiceNumber}</span>
              </div>
            )}
          </div>
        </div>

        <div className="field">
          <label>{t("reverse_reason")}</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("reverse_reason_optional")}
            autoFocus
          />
        </div>
      </form>
    </Modal>
  );
}
