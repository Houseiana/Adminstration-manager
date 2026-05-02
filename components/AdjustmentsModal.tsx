"use client";

import { FormEvent, useEffect, useState } from "react";
import { Modal } from "./Modal";
import { useData, useLang } from "./Providers";
import { useToast } from "./Toast";
import { adjKey, calcMonthDays } from "@/lib/payroll";
import { autoUnpaidForMonth } from "@/lib/leaves";
import { lateSummaryForMonth } from "@/lib/lateness";
import { money } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  empId: string | null;
  year: number;
  month: number;
}

export function AdjustmentsModal({ open, onClose, empId, year, month }: Props) {
  const { t, lang } = useLang();
  const { adjustments, setAdjustment, leaves, lateRecords, employees } = useData();
  const { show: toast } = useToast();
  const [unpaid, setUnpaid] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [bonuses, setBonuses] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && empId) {
      const cur = adjustments[adjKey(empId, year, month)];
      setUnpaid(cur?.unpaid ?? 0);
      setDeductions(cur?.deductions ?? 0);
      setBonuses(cur?.bonuses ?? 0);
      setNotes(cur?.notes ?? "");
    }
  }, [open, empId, year, month, adjustments]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!empId) return;
    const cur = adjustments[adjKey(empId, year, month)];
    setAdjustment(empId, year, month, {
      unpaid: Number(unpaid) || 0,
      deductions: Number(deductions) || 0,
      bonuses: Number(bonuses) || 0,
      notes,
      status: cur?.status === "paid" ? "paid" : "pending",
    });
    toast(t("saved"));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("edit_adjustments")}
      maxWidth="max-w-[520px]"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-ghost">
            {t("cancel")}
          </button>
          <button type="submit" form="adjForm" className="btn btn-primary">
            {t("save")}
          </button>
        </>
      }
    >
      <form
        id="adjForm"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-5"
      >
        {empId && (() => {
          const emp = employees.find((e) => e.id === empId);
          const monthInfo = calcMonthDays(year, month);
          const late = emp
            ? lateSummaryForMonth(
                empId,
                year,
                month,
                lateRecords,
                emp.salary,
                monthInfo.workDays
              )
            : { totalMinutes: 0, totalDeduction: 0, entries: [] };
          return (
            <>
              <div className="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-[10px] p-3 flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-muted">{t("auto_unpaid")}</div>
                  <div className="text-[18px] font-extrabold mono mt-0.5">
                    {autoUnpaidForMonth(empId, year, month, leaves)} {t("days_count")}
                  </div>
                </div>
                <div className="text-[11px] text-muted text-end max-w-[55%]">
                  {t("leaves_sub")}
                </div>
              </div>
              <div className="sm:col-span-2 bg-red-50 border border-red-200 rounded-[10px] p-3 flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-muted">
                    {t("auto_late_deduction")}
                  </div>
                  <div className="text-[18px] font-extrabold mono mt-0.5 text-red-600">
                    {money(late.totalDeduction, lang)}
                  </div>
                  <div className="text-[11px] text-muted">
                    {late.totalMinutes} {t("minutes")} · {late.entries.length}{" "}
                    {t("late_entries").toLowerCase()}
                  </div>
                </div>
                <div className="text-[11px] text-muted text-end max-w-[50%]">
                  {t("attendance_sub")}
                </div>
              </div>
            </>
          );
        })()}
        <div className="field sm:col-span-2">
          <label>{t("manual_extra")}</label>
          <input
            type="number"
            min={0}
            step={1}
            value={unpaid}
            onChange={(e) => setUnpaid(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>
            {t("manual_deductions")} ({t("currency")})
          </label>
          <input
            type="number"
            min={0}
            step={50}
            value={deductions}
            onChange={(e) => setDeductions(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label>
            {t("bonuses")} ({t("currency")})
          </label>
          <input
            type="number"
            min={0}
            step={50}
            value={bonuses}
            onChange={(e) => setBonuses(Number(e.target.value))}
          />
        </div>
        <div className="field sm:col-span-2">
          <label>{t("notes")}</label>
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
