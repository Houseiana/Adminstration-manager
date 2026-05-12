export type EmployeeStatus = "active" | "inactive" | "leave" | "terminated";
export type EmploymentType = "full" | "part" | "contract" | "intern";
export type PaymentMethod = "bank" | "cash" | "cheque";
export type PayrollStatus = "draft" | "pending" | "approved" | "paid";
export type MaritalStatus = "single" | "married" | "divorced" | "widowed";
export type ContractType =
  | "training"
  | "probation"
  | "permanent"
  | "fixed"
  | "open";

export type Department =
  | "Administration"
  | "Sales"
  | "Data Entry"
  | "Operations"
  | "Media"
  | "Technology"
  | "Secretariat"
  | "Public Relations"
  | "Finance";

export interface Employee {
  id: string;
  name_en: string;
  name_ar: string;
  title_en: string;
  title_ar: string;
  photoUrl?: string;
  department: Department;
  phone: string;
  email: string;
  address: string;
  nationalId: string;
  dob: string;
  maritalStatus?: MaritalStatus;
  childrenCount?: number;
  education?: string;
  previousExperience?: string;
  workPhone?: string;
  emergencyPhone?: string;
  type: EmploymentType;
  contractType?: ContractType;
  hiringDate: string;
  terminationDate?: string;
  location: string;
  manager: string;
  salary: number;
  allowances?: number;
  commission?: number;
  raise?: number;
  raiseDate?: string;
  paymentMethod: PaymentMethod;
  bankAccount: string;
  status: EmployeeStatus;
}

export interface PayrollAdjustment {
  unpaid: number;
  deductions: number;
  bonuses: number;
  notes?: string;
  status: PayrollStatus;
}

export type AdjustmentMap = Record<string, PayrollAdjustment>;

export type LeaveType = "permission" | "absence" | "casual" | "sick";

export interface LeaveRecord {
  id: string;
  empId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  notes?: string;
  medicalReport?: boolean;
  createdAt: string;
}

export interface LateRecord {
  id: string;
  empId: string;
  date: string;
  lateMinutes: number;
  notes?: string;
  createdAt: string;
}

export type ActivityType =
  | "hired"
  | "salary_changed"
  | "promoted"
  | "transferred"
  | "status_changed"
  | "type_changed"
  | "contract_changed"
  | "penalty"
  | "bonus"
  | "award"
  | "note";

export type PenaltySeverity =
  | "warning"
  | "fine"
  | "suspension"
  | "termination";

export interface EmployeeActivity {
  id: string;
  empId: string;
  type: ActivityType;
  date: string;
  title: string;
  description?: string;
  oldValue?: string | number;
  newValue?: string | number;
  amount?: number;
  severity?: PenaltySeverity;
  createdAt: string;
}

export interface ExpenseEntry {
  id: string;
  category: string;
  year: number;
  month: number;
  amount: number;
  vendorName?: string;
  supplierName?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  authorizedBy?: string;
  expenseDate?: string;
  invoiceNumber?: string;
  hasInvoice: boolean;
  noInvoiceReason?: string;
  notes?: string;
  createdAt: string;
}

export type Lang = "en" | "ar";
