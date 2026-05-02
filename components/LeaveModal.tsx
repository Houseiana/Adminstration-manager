"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { useData, useLang } from "./Providers";
import { useToast } from "./Toast";
import {
  CASUAL_CAP,
  CASUAL_WINDOW_DAYS,
  casualUsage,
  leaveMultiplier,
  leaveWorkingDays,
} from "@/lib/leaves";
import type { LeaveRecord, LeaveType } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  leave?: LeaveRecord | null;
  defaultEmpId?: string;
}

const TODAY = () => new Date().toISOString().slice(0, 10);

export function LeaveModal({ open, onClose, leave, defaultEmpId }: Props) {
  const { t, lang } = useLang();
  const { employees, leaves, addLeave, updateLeave } = useData();
  const { show: toast } = useToast();

  const [empId, setEmpId] = useState("");
  const [type, setType] = useState<LeaveType>("permission");
  const [startDate, setStartDate] = useState(TODAY());
  const [endDate, setEndDate] = useState(TODAY());
  const [notes, setNotes] = useState("");
  const [medicalReport, setMedicalReport] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (leave) {
      setEmpId(leave.empId);
      setType(leave.type);
      setStartDate(leave.startDate);
      setEndDate(leave.endDate);
      setNotes(leave.notes ?? "");
      setMedicalReport(Boolean(leave.medicalReport));
    } else {
      setEmpId(defaultEmpId ?? employees[0]?.id ?? "");
      setType("permission");
      setStartDate(TODAY());
      setEndDate(TODAY());
      setNotes("");
      setMedicalReport(false);
    }
  }, [open, leave, defaultEmpId, employees]);

  const previewWorkingDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return leaveWorkingDays({
      id: "",
      empId: empId,
      type,
      startDate,
      endDate,
      createdAt: "",
    });
  }, [startDate, endDate, empId, type]);

  // For casual: determine if this leave would be over-cap.
  const casualWillBeOverCap = useMemo(() => {
    if (type !== "casual" || !empId) return false;
    const ref = startDate ? new Date(startDate) : new Date();
    const cutoff = new Date(ref);
    cutoff.setDate(cutoff.getDate() - CASUAL_WINDOW_DAYS);
    const priorCount = leaves.filter(
      (l) =>
        l.empId === empId &&
        l.type === "casual" &&
        (!leave || l.id !== leave.id) &&
        new Date(l.startDate) >= cutoff &&
        new Date(l.startDate) <= ref
    ).length;
    return priorCount + 1 > CASUAL_CAP;
  }, [type, empId, startDate, leaves, leave]);

  const previewMultiplier = useMemo(
    () => leaveMultiplier(type, casualWillBeOverCap, medicalReport),
    [type, casualWillBeOverCap, medicalReport]
  );

  const previewDeducted = previewWorkingDays * previewMultiplier;

  const usage = useMemo(
    () =>
      empId
        ? casualUsage(empId, leaves.filter((l) => !leave || l.id !== leave.id))
        : { used: 0, cap: CASUAL_CAP },
    [empId, leaves, leave]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!empId || !startDate || !endDate) return;
    if (new Date(endDate) < new Date(startDate)) {
      alert(lang === "ar" ? "تاريخ النهاية قبل تاريخ البداية" : "End date is before start date");
      return;
    }
    const data = {
      empId,
      type,
      startDate,
      endDate,
      notes: notes.trim() || undefined,
      medicalReport: type === "sick" ? medicalReport : undefined,
    };
    if (leave) {
      updateLeave(leave.id, data);
      toast(t("leave_updated"));
    } else {
      addLeave(data);
      toast(t("leave_added"));
    }
    onClose();
  };

  const empName = (id: string) => {
    const e = employees.find((x) => x.id === id);
    if (!e) return id;
    return lang === "ar" ? e.name_ar : e.name_en;
  };

  const typeOptions: { value: LeaveType; label: string; desc: string }[] = [
    { value: "permission", label: t("lt_permission"), desc: t("lt_permission_desc") },
    { value: "absence", label: t("lt_absence"), desc: t("lt_absence_desc") },
    { value: "casual", label: t("lt_casual"), desc: t("lt_casual_desc") },
    { value: "sick", label: t("lt_sick"), desc: t("lt_sick_desc") },
  ];
  const activeOption = typeOptions.find((o) => o.value === type)!;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={leave ? t("edit_leave") : t("add_leave")}
      maxWidth="max-w-[640px]"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-ghost">
            {t("cancel")}
          </button>
          <button type="submit" form="leaveForm" className="btn btn-primary">
            {t("save_leave")}
          </button>
        </>
      }
    >
      <form
        id="leaveForm"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-5"
      >
        <div className="field sm:col-span-2">
          <label>{t("employee")}</label>
          <select value={empId} onChange={(e) => setEmpId(e.target.value)} required>
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

        <div className="field sm:col-span-2">
          <label>{t("leave_type")}</label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {typeOptions.map((o) => (
              <button
                type="button"
                key={o.value}
                onClick={() => setType(o.value)}
                className={`text-start px-3 py-2.5 rounded-[10px] border transition ${
                  type === o.value
                    ? "border-accent bg-accent-soft"
                    : "border-line hover:border-line-strong bg-white"
                }`}
              >
                <div className="font-semibold text-[13px]">{o.label}</div>
                <div className="text-[11px] text-muted mt-0.5">{o.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>{t("start_date")}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>{t("end_date")}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        {type === "sick" && (
          <div className="sm:col-span-2 bg-blue-50 border border-blue-200 rounded-[10px] p-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={medicalReport}
                onChange={(e) => setMedicalReport(e.target.checked)}
                className="mt-0.5"
              />
              <div>
                <div className="font-semibold text-[13px]">{t("medical_report")}</div>
                <div className="text-[11px] text-muted mt-0.5">
                  {t("medical_report_hint")}
                </div>
              </div>
            </label>
          </div>
        )}

        {type === "casual" && empId && (
          <div className="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-[10px] p-3 text-[12px]">
            <div className="flex items-center justify-between font-semibold">
              <span>{t("casual_usage")}</span>
              <span className="mono">
                {usage.used} / {usage.cap}
              </span>
            </div>
            <div className="mt-1 text-muted">{activeOption.desc}</div>
            {casualWillBeOverCap && (
              <div className="mt-1.5 text-amber-800 font-semibold">
                ⚠ {t("over_cap")}
              </div>
            )}
          </div>
        )}

        <div className="field sm:col-span-2">
          <label>{t("notes")}</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="sm:col-span-2 grid grid-cols-3 gap-3 pt-3 border-t border-line">
          <Stat label={t("days")} value={String(previewWorkingDays)} />
          <Stat
            label={t("multiplier")}
            value={previewMultiplier === 0 ? "—" : `${previewMultiplier}×`}
          />
          <Stat
            label={t("deducted")}
            value={String(previewDeducted)}
            highlight={previewDeducted > 0}
          />
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
        className={`text-[18px] font-extrabold mt-0.5 mono ${
          highlight ? "text-red-600" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
