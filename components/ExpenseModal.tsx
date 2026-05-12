"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { useData, useLang } from "./Providers";
import { useToast } from "./Toast";
import type { ExpenseEntry } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  expense?: ExpenseEntry | null;
  defaultYear?: number;
  defaultMonth?: number;
}

const TODAY = new Date();

export function ExpenseModal({
  open,
  onClose,
  expense,
  defaultYear,
  defaultMonth,
}: Props) {
  const { t, months } = useLang();
  const { expenses, addExpense, updateExpense } = useData();
  const { show: toast } = useToast();

  const [category, setCategory] = useState("");
  const [year, setYear] = useState(TODAY.getFullYear());
  const [month, setMonth] = useState(TODAY.getMonth());
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState("");

  // Build a list of known categories so the user can quickly reuse them.
  const knownCategories = useMemo(() => {
    const set = new Set<string>();
    for (const e of expenses) set.add(e.category);
    return Array.from(set).sort();
  }, [expenses]);

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setCategory(expense.category);
      setYear(expense.year);
      setMonth(expense.month);
      setAmount(expense.amount);
      setNotes(expense.notes ?? "");
    } else {
      setCategory("");
      setYear(defaultYear ?? TODAY.getFullYear());
      setMonth(defaultMonth ?? TODAY.getMonth());
      setAmount(0);
      setNotes("");
    }
  }, [open, expense, defaultYear, defaultMonth]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!category.trim() || amount < 0) return;
    const data = {
      category: category.trim(),
      year: Number(year),
      month: Number(month),
      amount: Number(amount) || 0,
      notes: notes.trim() || undefined,
    };
    const p = expense
      ? updateExpense(expense.id, data).then(() => toast(t("expense_updated")))
      : addExpense(data).then(() => toast(t("expense_added")));
    p.then(() => onClose()).catch((err) => alert(err?.message ?? "Error"));
  };

  const yearOptions = useMemo(() => {
    const cur = TODAY.getFullYear();
    return Array.from({ length: 5 }, (_, i) => cur - 2 + i);
  }, []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? t("edit_expense") : t("add_expense")}
      maxWidth="max-w-[520px]"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-ghost">
            {t("cancel")}
          </button>
          <button type="submit" form="expenseForm" className="btn btn-primary">
            {t("save_expense")}
          </button>
        </>
      }
    >
      <form
        id="expenseForm"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-5"
      >
        <div className="field sm:col-span-2">
          <label>{t("expense_category")}</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            list="expense-categories"
            required
            autoFocus
          />
          <datalist id="expense-categories">
            {knownCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="field">
          <label>{t("expense_month")}</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t("expense_year")}</label>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="field sm:col-span-2">
          <label>
            {t("expense_amount")} ({t("currency")})
          </label>
          <input
            type="number"
            min={0}
            step={50}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />
        </div>
        <div className="field sm:col-span-2">
          <label>{t("expense_notes")}</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
