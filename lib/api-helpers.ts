import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SessionPayload,
  verifySessionToken,
} from "./auth";
import type {
  Employee,
  EmployeeActivity,
  ExpenseEntry,
  LateRecord,
  LeaveRecord,
  PayrollAdjustment,
} from "./types";

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<
  | { session: SessionPayload; error: null }
  | { session: null; error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

// ---------- Serializers (snake_case row → camelCase TS type) ----------

type Row = Record<string, unknown>;

function num(v: unknown, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  return Number(v);
}

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  return String(v);
}

export function toEmployee(row: Row): Employee {
  return {
    id: String(row.id),
    name_en: String(row.name_en ?? ""),
    name_ar: String(row.name_ar ?? ""),
    title_en: String(row.title_en ?? ""),
    title_ar: String(row.title_ar ?? ""),
    photoUrl: str(row.photo_url),
    department: row.department as Employee["department"],
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    address: String(row.address ?? ""),
    nationalId: String(row.national_id ?? ""),
    dob: str(row.dob) ?? "",
    maritalStatus: row.marital_status as Employee["maritalStatus"],
    childrenCount: num(row.children_count, 0),
    education: str(row.education),
    previousExperience: str(row.previous_experience),
    workPhone: str(row.work_phone),
    emergencyPhone: str(row.emergency_phone),
    type: row.type as Employee["type"],
    contractType: row.contract_type as Employee["contractType"],
    hiringDate: str(row.hiring_date) ?? "",
    terminationDate: str(row.termination_date),
    location: String(row.location ?? ""),
    manager: String(row.manager ?? ""),
    salary: num(row.salary),
    allowances: num(row.allowances, 0),
    commission: num(row.commission, 0),
    raise: num(row.raise_amount, 0),
    raiseDate: str(row.raise_date),
    paymentMethod: (row.payment_method as Employee["paymentMethod"]) ?? "bank",
    bankAccount: String(row.bank_account ?? ""),
    status: (row.status as Employee["status"]) ?? "active",
  };
}

export function toLeave(row: Row): LeaveRecord {
  return {
    id: String(row.id),
    empId: String(row.emp_id),
    type: row.type as LeaveRecord["type"],
    startDate: str(row.start_date) ?? "",
    endDate: str(row.end_date) ?? "",
    notes: str(row.notes),
    medicalReport: Boolean(row.medical_report),
    createdAt: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at ?? ""),
  };
}

export function toLate(row: Row): LateRecord {
  return {
    id: String(row.id),
    empId: String(row.emp_id),
    date: str(row.date) ?? "",
    lateMinutes: num(row.late_minutes, 0),
    notes: str(row.notes),
    createdAt: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at ?? ""),
  };
}

export function toActivity(row: Row): EmployeeActivity {
  const sev = row.severity;
  const amt = row.amount;
  return {
    id: String(row.id),
    empId: String(row.emp_id),
    type: row.type as EmployeeActivity["type"],
    date: str(row.date) ?? "",
    title: String(row.title ?? ""),
    description: str(row.description),
    oldValue: str(row.old_value),
    newValue: str(row.new_value),
    amount: amt === null || amt === undefined ? undefined : Number(amt),
    severity: sev as EmployeeActivity["severity"] | undefined,
    createdAt: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at ?? ""),
  };
}

export function toExpense(row: Row): ExpenseEntry {
  return {
    id: String(row.id),
    category: String(row.category ?? ""),
    year: Number(row.year),
    month: Number(row.month),
    amount: num(row.amount, 0),
    vendorName: str(row.vendor_name),
    authorizedBy: str(row.authorized_by),
    expenseDate: str(row.expense_date),
    invoiceNumber: str(row.invoice_number),
    hasInvoice:
      row.has_invoice === null || row.has_invoice === undefined
        ? true
        : Boolean(row.has_invoice),
    noInvoiceReason: str(row.no_invoice_reason),
    notes: str(row.notes),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at ?? ""),
  };
}

export function toAdjustment(row: Row): PayrollAdjustment & {
  empId: string;
  year: number;
  month: number;
} {
  return {
    empId: String(row.emp_id),
    year: Number(row.year),
    month: Number(row.month),
    unpaid: num(row.unpaid, 0),
    deductions: num(row.deductions, 0),
    bonuses: num(row.bonuses, 0),
    notes: str(row.notes),
    status: (row.status as PayrollAdjustment["status"]) ?? "draft",
  };
}
