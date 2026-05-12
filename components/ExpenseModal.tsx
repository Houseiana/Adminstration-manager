"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
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
const todayISO = () => new Date().toISOString().slice(0, 10);

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
  const [amount, setAmount] = useState(0);
  const [expenseDate, setExpenseDate] = useState(todayISO());
  const [vendorName, setVendorName] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [authorizedBy, setAuthorizedBy] = useState("");
  const [hasInvoice, setHasInvoice] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [noInvoiceReason, setNoInvoiceReason] = useState("");
  const [notes, setNotes] = useState("");

  const knownCategories = useMemo(() => {
    const set = new Set<string>();
    for (const e of expenses) set.add(e.category);
    return Array.from(set).sort();
  }, [expenses]);

  const knownVendors = useMemo(() => {
    const set = new Set<string>();
    for (const e of expenses) if (e.vendorName) set.add(e.vendorName);
    return Array.from(set).sort();
  }, [expenses]);

  const knownSuppliers = useMemo(() => {
    const map = new Map<
      string,
      { phone?: string; address?: string }
    >();
    for (const e of expenses) {
      if (e.supplierName) {
        // remember the last-seen phone/address for autofill
        map.set(e.supplierName, {
          phone: e.supplierPhone,
          address: e.supplierAddress,
        });
      }
    }
    return map;
  }, [expenses]);

  const knownApprovers = useMemo(() => {
    const set = new Set<string>();
    for (const e of expenses) if (e.authorizedBy) set.add(e.authorizedBy);
    return Array.from(set).sort();
  }, [expenses]);

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setCategory(expense.category);
      setAmount(expense.amount);
      setExpenseDate(
        expense.expenseDate ||
          `${expense.year}-${String(expense.month + 1).padStart(2, "0")}-01`
      );
      setVendorName(expense.vendorName ?? "");
      setSupplierName(expense.supplierName ?? "");
      setSupplierPhone(expense.supplierPhone ?? "");
      setSupplierAddress(expense.supplierAddress ?? "");
      setAuthorizedBy(expense.authorizedBy ?? "");
      setHasInvoice(expense.hasInvoice);
      setInvoiceNumber(expense.invoiceNumber ?? "");
      setNoInvoiceReason(expense.noInvoiceReason ?? "");
      setNotes(expense.notes ?? "");
    } else {
      setCategory("");
      setAmount(0);
      const initialDate =
        defaultYear !== undefined && defaultMonth !== undefined
          ? `${defaultYear}-${String(defaultMonth + 1).padStart(2, "0")}-01`
          : todayISO();
      setExpenseDate(initialDate);
      setVendorName("");
      setSupplierName("");
      setSupplierPhone("");
      setSupplierAddress("");
      setAuthorizedBy("");
      setHasInvoice(true);
      setInvoiceNumber("");
      setNoInvoiceReason("");
      setNotes("");
    }
  }, [open, expense, defaultYear, defaultMonth]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!category.trim() || amount < 0) return;
    const date = new Date(expenseDate);
    const data: Omit<ExpenseEntry, "id" | "createdAt"> = {
      category: category.trim(),
      year: date.getFullYear(),
      month: date.getMonth(),
      amount: Number(amount) || 0,
      expenseDate,
      vendorName: vendorName.trim() || undefined,
      supplierName: supplierName.trim() || undefined,
      supplierPhone: supplierPhone.trim() || undefined,
      supplierAddress: supplierAddress.trim() || undefined,
      authorizedBy: authorizedBy.trim() || undefined,
      hasInvoice,
      invoiceNumber: hasInvoice ? invoiceNumber.trim() || undefined : undefined,
      noInvoiceReason: !hasInvoice
        ? noInvoiceReason.trim() || undefined
        : undefined,
      notes: notes.trim() || undefined,
    };
    const p = expense
      ? updateExpense(expense.id, data).then(() => toast(t("expense_updated")))
      : addExpense(data).then(() => toast(t("expense_added")));
    p.then(() => onClose()).catch((err) => alert(err?.message ?? "Error"));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? t("edit_expense") : t("add_expense")}
      maxWidth="max-w-[680px]"
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
      <form id="expenseForm" onSubmit={handleSubmit} className="p-4 sm:p-5">
        {/* ============ EXPENSE DETAILS ============ */}
        <Section icon="💰" title={t("section_expense_details")}>
          <Field className="sm:col-span-2" label={t("expense_category")}>
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
          </Field>
          <Field label={`${t("expense_amount")} (${t("currency")})`}>
            <input
              type="number"
              min={0}
              step={50}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </Field>
          <Field label={t("expense_date_full")}>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
            />
            <div className="text-[11px] text-muted mt-0.5">
              {months[new Date(expenseDate).getMonth()]}{" "}
              {new Date(expenseDate).getFullYear()}
            </div>
          </Field>
        </Section>

        {/* ============ VENDOR & INVOICE ============ */}
        <Section icon="🧾" title={t("section_invoice")}>
          <Field className="sm:col-span-2" label={t("vendor_name")}>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              list="expense-vendors"
            />
            <datalist id="expense-vendors">
              {knownVendors.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </Field>
          <div className="sm:col-span-2 bg-slate-50 border border-line rounded-[10px] p-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasInvoice}
                onChange={(e) => setHasInvoice(e.target.checked)}
              />
              <span className="font-semibold text-[13px]">
                {t("invoice_required_label")}
              </span>
            </label>
          </div>
          {hasInvoice ? (
            <Field className="sm:col-span-2" label={t("invoice_number")}>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-..."
              />
            </Field>
          ) : (
            <Field className="sm:col-span-2" label={t("no_invoice_reason")}>
              <textarea
                rows={2}
                value={noInvoiceReason}
                onChange={(e) => setNoInvoiceReason(e.target.value)}
                required
              />
            </Field>
          )}
        </Section>

        {/* ============ SUPPLIER ============ */}
        <Section icon="📦" title={t("section_supplier")}>
          <Field className="sm:col-span-2" label={t("supplier_name")}>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => {
                const v = e.target.value;
                setSupplierName(v);
                // Autofill phone/address when picking a known supplier
                const known = knownSuppliers.get(v);
                if (known) {
                  if (!supplierPhone && known.phone) setSupplierPhone(known.phone);
                  if (!supplierAddress && known.address)
                    setSupplierAddress(known.address);
                }
              }}
              list="expense-suppliers"
            />
            <datalist id="expense-suppliers">
              {Array.from(knownSuppliers.keys()).sort().map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label={t("supplier_phone")}>
            <input
              type="tel"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              placeholder="+20 ..."
            />
          </Field>
          <Field label={t("supplier_address")}>
            <input
              type="text"
              value={supplierAddress}
              onChange={(e) => setSupplierAddress(e.target.value)}
            />
          </Field>
        </Section>

        {/* ============ APPROVAL & NOTES ============ */}
        <Section icon="✅" title={t("section_approval")}>
          <Field className="sm:col-span-2" label={t("authorized_by")}>
            <input
              type="text"
              value={authorizedBy}
              onChange={(e) => setAuthorizedBy(e.target.value)}
              list="expense-approvers"
            />
            <datalist id="expense-approvers">
              {knownApprovers.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </Field>
          <Field className="sm:col-span-2" label={t("expense_notes")}>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </Section>
      </form>
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
  children: ReactNode;
}) {
  return (
    <fieldset className="border border-line rounded-[12px] p-4 mb-3">
      <legend className="px-2 flex items-center gap-2 text-[12px] font-bold text-ink uppercase tracking-wider">
        <span className="text-base">{icon}</span>
        {title}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`field ${className}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}
