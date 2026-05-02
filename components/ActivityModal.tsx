"use client";

import { FormEvent, useEffect, useState } from "react";
import { Modal } from "./Modal";
import { useData, useLang } from "./Providers";
import { useToast } from "./Toast";
import type {
  ActivityType,
  EmployeeActivity,
  PenaltySeverity,
} from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  empId: string;
  activity?: EmployeeActivity | null;
}

// Manual entries the user can log themselves.
// Auto-logged ones (hired, salary_changed, etc.) come from updateEmployee.
const MANUAL_TYPES: ActivityType[] = ["penalty", "bonus", "award", "note"];

const TODAY = () => new Date().toISOString().slice(0, 10);

export function ActivityModal({ open, onClose, empId, activity }: Props) {
  const { t } = useLang();
  const { addActivity, updateActivity } = useData();
  const { show: toast } = useToast();

  const [type, setType] = useState<ActivityType>("penalty");
  const [date, setDate] = useState(TODAY());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [severity, setSeverity] = useState<PenaltySeverity>("warning");

  useEffect(() => {
    if (!open) return;
    if (activity) {
      setType(activity.type);
      setDate(activity.date);
      setTitle(activity.title);
      setDescription(activity.description ?? "");
      setAmount(activity.amount ?? 0);
      setSeverity(activity.severity ?? "warning");
    } else {
      setType("penalty");
      setDate(TODAY());
      setTitle("");
      setDescription("");
      setAmount(0);
      setSeverity("warning");
    }
  }, [open, activity]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const data: Omit<EmployeeActivity, "id" | "createdAt"> = {
      empId,
      type,
      date,
      title: title.trim(),
      description: description.trim() || undefined,
      amount: amount > 0 ? amount : undefined,
      severity: type === "penalty" ? severity : undefined,
    };
    if (activity) {
      updateActivity(activity.id, data);
      toast(t("activity_updated"));
    } else {
      addActivity(data);
      toast(t("activity_added"));
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={activity ? t("edit_activity") : t("add_activity")}
      maxWidth="max-w-[560px]"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-ghost">
            {t("cancel")}
          </button>
          <button type="submit" form="activityForm" className="btn btn-primary">
            {t("save_activity")}
          </button>
        </>
      }
    >
      <form
        id="activityForm"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-5"
      >
        <div className="field sm:col-span-2">
          <label>{t("activity_type")}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
            {MANUAL_TYPES.map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setType(tp)}
                className={`px-3 py-2.5 rounded-[10px] border text-[12px] font-semibold transition ${
                  type === tp
                    ? "border-accent bg-accent-soft text-amber-900"
                    : "border-line hover:border-line-strong bg-white text-muted"
                }`}
              >
                {ACT_ICONS[tp]} {t(`at_act_${tp}` as const)}
              </button>
            ))}
          </div>
        </div>

        {type === "penalty" && (
          <div className="field sm:col-span-2">
            <label>{t("severity")}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
              {(
                ["warning", "fine", "suspension", "termination"] as const
              ).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`px-2.5 py-2 rounded-lg border text-[11px] font-semibold transition ${
                    severity === s
                      ? "border-red-400 bg-red-50 text-red-700"
                      : "border-line hover:border-line-strong bg-white text-muted"
                  }`}
                >
                  {t(`severity_${s}` as const)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field sm:col-span-2">
          <label>{t("activity_title")}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label>{t("activity_date")}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {(type === "penalty" || type === "bonus") && (
          <div className="field">
            <label>
              {t("amount_optional")} ({t("currency")})
            </label>
            <input
              type="number"
              min={0}
              step={50}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
        )}

        <div className="field sm:col-span-2">
          <label>{t("activity_description")}</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

export const ACT_ICONS: Record<ActivityType, string> = {
  hired: "🎉",
  salary_changed: "💰",
  promoted: "⬆️",
  transferred: "🔀",
  status_changed: "🟡",
  type_changed: "🔄",
  contract_changed: "📄",
  penalty: "⚠️",
  bonus: "🎁",
  award: "🏆",
  note: "📝",
};

export const ACT_COLORS: Record<ActivityType, string> = {
  hired: "bg-green-100 text-green-700 border-green-200",
  salary_changed: "bg-amber-100 text-amber-800 border-amber-200",
  promoted: "bg-blue-100 text-blue-700 border-blue-200",
  transferred: "bg-purple-100 text-purple-700 border-purple-200",
  status_changed: "bg-slate-100 text-slate-700 border-slate-200",
  type_changed: "bg-slate-100 text-slate-700 border-slate-200",
  contract_changed: "bg-slate-100 text-slate-700 border-slate-200",
  penalty: "bg-red-100 text-red-700 border-red-200",
  bonus: "bg-green-100 text-green-700 border-green-200",
  award: "bg-amber-100 text-amber-800 border-amber-200",
  note: "bg-blue-50 text-blue-700 border-blue-100",
};
