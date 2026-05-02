"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { useData, useLang } from "./Providers";
import { useToast } from "./Toast";
import { ALL_DEPARTMENTS, TITLES_BY_DEPT, titleAr } from "@/lib/seed";
import { Avatar, fileToResizedDataUrl } from "./Avatar";
import { money } from "@/lib/i18n";
import type { Employee } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  employee?: Employee | null;
}

const EMPTY: Omit<Employee, "id"> = {
  name_en: "",
  name_ar: "",
  title_en: "Sales Manager",
  title_ar: "مدير مبيعات",
  photoUrl: undefined,
  allowances: 0,
  commission: 0,
  raise: 0,
  raiseDate: undefined,
  department: "Sales",
  phone: "",
  email: "",
  address: "",
  nationalId: "",
  dob: "",
  maritalStatus: undefined,
  childrenCount: 0,
  education: "",
  previousExperience: "",
  workPhone: "",
  emergencyPhone: "",
  type: "full",
  contractType: undefined,
  hiringDate: new Date().toISOString().slice(0, 10),
  location: "",
  manager: "",
  salary: 0,
  paymentMethod: "bank",
  bankAccount: "",
  status: "active",
};

export function EmployeeModal({ open, onClose, employee }: Props) {
  const { t, lang } = useLang();
  const { addEmployee, updateEmployee } = useData();
  const { show: toast } = useToast();
  const [form, setForm] = useState<Omit<Employee, "id">>(EMPTY);

  useEffect(() => {
    if (open) {
      if (employee) {
        const { id: _id, ...rest } = employee;
        setForm({ ...EMPTY, ...rest });
      } else {
        setForm({ ...EMPTY, hiringDate: new Date().toISOString().slice(0, 10) });
      }
    }
  }, [open, employee]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload: Omit<Employee, "id"> = {
      ...form,
      name_ar: form.name_ar || form.name_en,
      title_ar: form.title_ar || form.title_en,
      salary: Number(form.salary) || 0,
      allowances: Number(form.allowances) || 0,
      commission: Number(form.commission) || 0,
      raise: Number(form.raise) || 0,
      raiseDate: form.raiseDate || undefined,
      childrenCount:
        form.maritalStatus === "single" ? 0 : Number(form.childrenCount) || 0,
    };
    if (employee) {
      updateEmployee(employee.id, payload);
    } else {
      addEmployee(payload);
    }
    toast(t("saved"));
    onClose();
  };

  const set = <K extends keyof typeof form>(key: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [key]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={employee ? t("edit") : t("add_employee")}
      maxWidth="max-w-[820px]"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-ghost">
            {t("cancel")}
          </button>
          <button type="submit" form="empForm" className="btn btn-primary">
            {t("save")}
          </button>
        </>
      }
    >
      <form id="empForm" onSubmit={handleSubmit} className="p-5">
        {/* ============ PERSONAL ============ */}
        <Section icon="👤" title={t("section_personal")}>
          <PhotoField
            value={form.photoUrl}
            onChange={(url) => set("photoUrl", url)}
          />
          <Field className="sm:col-span-2" label={t("full_name")}>
            <input
              value={form.name_en}
              onChange={(e) => set("name_en", e.target.value)}
              required
            />
          </Field>
          <Field label={t("phone")}>
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              required
            />
          </Field>
          <Field label={t("email")}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
            />
          </Field>
          <Field className="sm:col-span-2" label={t("address")}>
            <input
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
          <Field label={t("national_id")}>
            <input
              value={form.nationalId}
              onChange={(e) => set("nationalId", e.target.value)}
            />
          </Field>
          <Field label={t("dob")}>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => set("dob", e.target.value)}
            />
          </Field>
          <Field label={t("marital_status")}>
            <select
              value={form.maritalStatus ?? ""}
              onChange={(e) => {
                const v = (e.target.value || undefined) as Employee["maritalStatus"];
                setForm((p) => ({
                  ...p,
                  maritalStatus: v,
                  childrenCount: v === "single" ? 0 : p.childrenCount,
                }));
              }}
            >
              <option value="">{t("select_marital")}</option>
              <option value="single">{t("ms_single")}</option>
              <option value="married">{t("ms_married")}</option>
              <option value="divorced">{t("ms_divorced")}</option>
              <option value="widowed">{t("ms_widowed")}</option>
            </select>
          </Field>
          <Field label={t("children_count")}>
            <input
              type="number"
              min={0}
              max={20}
              step={1}
              value={form.maritalStatus === "single" ? 0 : form.childrenCount ?? 0}
              disabled={form.maritalStatus === "single"}
              onChange={(e) => set("childrenCount", Number(e.target.value))}
              className={form.maritalStatus === "single" ? "opacity-60 cursor-not-allowed" : ""}
            />
          </Field>
        </Section>

        {/* ============ EDUCATION & EXPERIENCE ============ */}
        <Section icon="🎓" title={t("section_education")}>
          <Field className="sm:col-span-2" label={t("education_label")}>
            <input
              value={form.education ?? ""}
              onChange={(e) => set("education", e.target.value)}
              placeholder="Bachelor's Degree, Diploma, etc."
            />
          </Field>
          <Field className="sm:col-span-2" label={t("previous_experience")}>
            <textarea
              rows={3}
              value={form.previousExperience ?? ""}
              onChange={(e) => set("previousExperience", e.target.value)}
            />
          </Field>
        </Section>

        {/* ============ CONTACT ============ */}
        <Section icon="📞" title={t("section_contact")}>
          <Field label={t("work_phone")}>
            <input
              type="tel"
              value={form.workPhone ?? ""}
              onChange={(e) => set("workPhone", e.target.value)}
            />
          </Field>
          <Field label={t("emergency_phone")}>
            <input
              type="tel"
              value={form.emergencyPhone ?? ""}
              onChange={(e) => set("emergencyPhone", e.target.value)}
            />
          </Field>
        </Section>

        {/* ============ WORK ============ */}
        <Section icon="💼" title={t("section_work")}>
          <Field label={t("department")}>
            <select
              value={form.department}
              onChange={(e) => {
                const newDept = e.target.value as Employee["department"];
                const firstTitle = TITLES_BY_DEPT[newDept][0] ?? "";
                setForm((p) => ({
                  ...p,
                  department: newDept,
                  title_en: firstTitle,
                  title_ar: titleAr(firstTitle),
                }));
              }}
            >
              {ALL_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {t(`dept_${d}` as const)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("job_title")}>
            <select
              value={form.title_en}
              onChange={(e) => {
                const newTitle = e.target.value;
                setForm((p) => ({
                  ...p,
                  title_en: newTitle,
                  title_ar: titleAr(newTitle),
                }));
              }}
              required
            >
              {(TITLES_BY_DEPT[form.department] ?? []).map((titleEn) => (
                <option key={titleEn} value={titleEn}>
                  {lang === "ar" ? titleAr(titleEn) : titleEn}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("emp_type")}>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value as Employee["type"])}
            >
              <option value="full">{t("t_full")}</option>
              <option value="part">{t("t_part")}</option>
              <option value="contract">{t("t_contract")}</option>
              <option value="intern">{t("t_intern")}</option>
            </select>
          </Field>
          <Field label={t("contract_type")}>
            <select
              value={form.contractType ?? ""}
              onChange={(e) =>
                set(
                  "contractType",
                  (e.target.value || undefined) as Employee["contractType"]
                )
              }
            >
              <option value="">{t("select_contract")}</option>
              <option value="training">{t("ct_training")}</option>
              <option value="probation">{t("ct_probation")}</option>
              <option value="permanent">{t("ct_permanent")}</option>
              <option value="fixed">{t("ct_fixed")}</option>
              <option value="open">{t("ct_open")}</option>
            </select>
          </Field>
          <Field label={t("hiring_date")}>
            <input
              type="date"
              value={form.hiringDate}
              onChange={(e) => set("hiringDate", e.target.value)}
              required
            />
          </Field>
          <Field label={t("work_location")}>
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </Field>
          <Field label={t("manager")}>
            <input
              value={form.manager}
              onChange={(e) => set("manager", e.target.value)}
            />
          </Field>
          <Field label={t("status")}>
            <select
              value={form.status}
              onChange={(e) =>
                set("status", e.target.value as Employee["status"])
              }
            >
              <option value="active">{t("st_active")}</option>
              <option value="inactive">{t("st_inactive")}</option>
              <option value="leave">{t("st_leave")}</option>
              <option value="terminated">{t("st_terminated")}</option>
            </select>
          </Field>
        </Section>

        {/* ============ PAYROLL ============ */}
        <Section icon="💳" title={t("section_payroll")}>
          <Field label={`${t("monthly_salary")} (${t("currency")})`}>
            <input
              type="number"
              min={0}
              step={100}
              value={form.salary}
              onChange={(e) => set("salary", Number(e.target.value))}
              required
            />
          </Field>
          <Field label={`${t("allowances")} (${t("currency")})`}>
            <input
              type="number"
              min={0}
              step={50}
              value={form.allowances ?? 0}
              onChange={(e) => set("allowances", Number(e.target.value))}
            />
          </Field>
          <Field label={`${t("commission")} (${t("currency")})`}>
            <input
              type="number"
              min={0}
              step={50}
              value={form.commission ?? 0}
              onChange={(e) => set("commission", Number(e.target.value))}
            />
          </Field>
          <Field label={`${t("raise_amount")} (${t("currency")})`}>
            <input
              type="number"
              min={0}
              step={50}
              value={form.raise ?? 0}
              onChange={(e) => set("raise", Number(e.target.value))}
            />
          </Field>
          <Field label={t("raise_date")}>
            <input
              type="date"
              value={form.raiseDate ?? ""}
              onChange={(e) => set("raiseDate", e.target.value || undefined)}
            />
          </Field>
          <TotalSummary
            base={form.salary}
            allowances={form.allowances ?? 0}
            commission={form.commission ?? 0}
            raise={form.raise ?? 0}
          />
          <Field label={t("payment_method")}>
            <select
              value={form.paymentMethod}
              onChange={(e) =>
                set(
                  "paymentMethod",
                  e.target.value as Employee["paymentMethod"]
                )
              }
            >
              <option value="bank">{t("pm_bank")}</option>
              <option value="cash">{t("pm_cash")}</option>
              <option value="cheque">{t("pm_cheque")}</option>
            </select>
          </Field>
          <Field label={t("bank_account")}>
            <input
              value={form.bankAccount}
              onChange={(e) => set("bankAccount", e.target.value)}
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
    <fieldset className="border border-line rounded-[12px] p-4 mb-4">
      <legend className="px-2 flex items-center gap-2 text-[12px] font-bold text-ink uppercase tracking-wider">
        <span className="text-base">{icon}</span>
        {title}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">{children}</div>
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

function TotalSummary({
  base,
  allowances,
  commission,
  raise,
}: {
  base: number;
  allowances: number;
  commission: number;
  raise: number;
}) {
  const { t, lang } = useLang();
  const total =
    (Number(base) || 0) +
    (Number(allowances) || 0) +
    (Number(commission) || 0) +
    (Number(raise) || 0);
  return (
    <div className="sm:col-span-2 bg-accent-soft border border-amber-300 rounded-[12px] p-3 flex items-center justify-between">
      <div className="text-[12px] text-amber-900 font-semibold uppercase tracking-wider">
        {t("total_compensation")}
      </div>
      <div className="text-[20px] font-extrabold mono text-ink">
        {money(total, lang)}
      </div>
    </div>
  );
}

function PhotoField({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (url: string | undefined) => void;
}) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file, 320, 0.85);
      onChange(dataUrl);
    } catch (err) {
      console.error("Photo upload failed", err);
      alert("Could not load this image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sm:col-span-2 flex items-center gap-4">
      <Avatar src={value} size="xl" />
      <div className="flex-1">
        <div className="text-[12px] text-muted font-semibold mb-1.5">
          {t("profile_photo")}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="btn btn-soft btn-sm"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {value ? t("change_photo") : t("upload_photo")}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="btn btn-danger btn-sm"
            >
              {t("remove_photo")}
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </div>
        <div className="text-[11px] text-muted mt-1.5">{t("photo_hint")}</div>
      </div>
    </div>
  );
}
