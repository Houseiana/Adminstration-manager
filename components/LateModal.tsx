"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { useData, useLang } from "./Providers";
import { useToast } from "./Toast";
import { calcMonthDays, totalMonthlySalary } from "@/lib/payroll";
import { calcLateDeduction, minuteRate } from "@/lib/lateness";
import { fmt, money } from "@/lib/i18n";
import type { LateRecord } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  record?: LateRecord | null;
  defaultEmpId?: string;
}

const TODAY = () => new Date().toISOString().slice(0, 10);
const QUICK_PRESETS = [5, 10, 15, 30, 45, 60, 90, 120];

export function LateModal({ open, onClose, record, defaultEmpId }: Props) {
  const { t, lang } = useLang();
  const { employees, addLate, updateLate } = useData();
  const { show: toast } = useToast();

  const [empId, setEmpId] = useState("");
  const [date, setDate] = useState(TODAY());
  const [lateMinutes, setLateMinutes] = useState(15);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (record) {
      setEmpId(record.empId);
      setDate(record.date);
      setLateMinutes(record.lateMinutes);
      setNotes(record.notes ?? "");
    } else {
      setEmpId(defaultEmpId ?? employees[0]?.id ?? "");
      setDate(TODAY());
      setLateMinutes(15);
      setNotes("");
    }
  }, [open, record, defaultEmpId, employees]);

  const emp = employees.find((e) => e.id === empId);
  const empName = (id: string) => {
    const e = employees.find((x) => x.id === id);
    if (!e) return id;
    return lang === "ar" ? e.name_ar : e.name_en;
  };

  const preview = useMemo(() => {
    if (!emp || !date) return { perMin: 0, total: 0 };
    const d = new Date(date);
    const monthInfo = calcMonthDays(d.getFullYear(), d.getMonth());
    const compensation = totalMonthlySalary(emp);
    const perMin = minuteRate(compensation, monthInfo.workDays);
    const total = calcLateDeduction(lateMinutes, compensation, monthInfo.workDays);
    return { perMin, total };
  }, [emp, date, lateMinutes]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!empId || !date || lateMinutes <= 0) return;
    const data = {
      empId,
      date,
      lateMinutes: Number(lateMinutes) || 0,
      notes: notes.trim() || undefined,
    };
    if (record) {
      updateLate(record.id, data);
      toast(t("late_updated"));
    } else {
      addLate(data);
      toast(t("late_added"));
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={record ? t("edit_late") : t("add_late")}
      maxWidth="max-w-[560px]"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-ghost">
            {t("cancel")}
          </button>
          <button type="submit" form="lateForm" className="btn btn-primary">
            {t("save_late")}
          </button>
        </>
      }
    >
      <form
        id="lateForm"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-5"
      >
        <div className="field sm:col-span-2">
          <label>{t("employee")}</label>
          <select
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            required
          >
            <option value="" disabled>
              {t("select_employee")}
            </option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {empName(e.id)} — {e.id}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>{t("late_date")}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label>{t("late_minutes")}</label>
          <input
            type="number"
            min={1}
            max={480}
            step={1}
            value={lateMinutes}
            onChange={(e) => setLateMinutes(Number(e.target.value))}
            required
          />
        </div>

        <div className="field sm:col-span-2">
          <label>{t("quick_select")}</label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {QUICK_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setLateMinutes(m)}
                className={`px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition ${
                  lateMinutes === m
                    ? "bg-accent border-accent-strong text-ink"
                    : "bg-white border-line text-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                {m} {t("minutes")}
              </button>
            ))}
          </div>
        </div>

        <div className="field sm:col-span-2">
          <label>{t("notes")}</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2 grid grid-cols-3 gap-3 pt-3 border-t border-line">
          <Stat label={t("late_minutes")} value={`${fmt(lateMinutes, lang)} ${t("minutes")}`} />
          <Stat
            label={t("rate_per_min")}
            value={money(preview.perMin, lang)}
          />
          <Stat
            label={t("late_deduction")}
            value={money(preview.total, lang)}
            highlight={preview.total > 0}
          />
        </div>
        <div className="sm:col-span-2 text-[11px] text-muted text-center -mt-2">
          {t("work_hours_per_day")}
        </div>
      </form>
    </Modal>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="text-center bg-slate-50 rounded-[10px] py-2.5 px-2">
      <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">
        {label}
      </div>
      <div
        className={`text-[14px] font-extrabold mt-0.5 mono ${
          highlight ? "text-red-600" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
