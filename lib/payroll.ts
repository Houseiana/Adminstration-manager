import { autoUnpaidForMonth } from "./leaves";
import { lateSummaryForMonth } from "./lateness";
import type {
  AdjustmentMap,
  Employee,
  LateRecord,
  LeaveRecord,
  PayrollAdjustment,
} from "./types";

export interface MonthInfo {
  total: number;
  workDays: number;
  fri: number;
  sat: number;
  off: number;
}

export interface PayrollResult {
  monthInfo: MonthInfo;
  monthlySalary: number;
  dailySalary: number;
  eligibleWorkDays: number;
  unpaidDays: number;
  unpaidFromLeaves: number;
  unpaidManual: number;
  workedDays: number;
  earned: number;
  deductions: number;
  deductionsManual: number;
  deductionsFromLate: number;
  lateMinutes: number;
  bonuses: number;
  net: number;
  status: PayrollAdjustment["status"];
  notes: string;
}

// Working days = Sun..Thu (Fri & Sat off)
export function calcMonthDays(year: number, month: number): MonthInfo {
  const total = new Date(year, month + 1, 0).getDate();
  let workDays = 0;
  let fri = 0;
  let sat = 0;
  for (let d = 1; d <= total; d++) {
    const day = new Date(year, month, d).getDay();
    if (day === 5) fri++;
    else if (day === 6) sat++;
    else workDays++;
  }
  return { total, workDays, fri, sat, off: fri + sat };
}

export function calcEmployeeWorkingDays(
  emp: Employee,
  year: number,
  month: number
): MonthInfo & { eligibleWorkDays: number } {
  const monthInfo = calcMonthDays(year, month);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month, totalDays);
  const hire = emp.hiringDate ? new Date(emp.hiringDate) : startDate;
  const term = emp.terminationDate ? new Date(emp.terminationDate) : null;

  const actualStart = hire > startDate ? hire : startDate;
  const actualEnd = term && term < endDate ? term : endDate;

  if (
    actualStart > endDate ||
    actualEnd < startDate ||
    actualEnd < actualStart
  ) {
    return { ...monthInfo, eligibleWorkDays: 0 };
  }

  let eligible = 0;
  for (
    const d = new Date(actualStart);
    d <= actualEnd;
    d.setDate(d.getDate() + 1)
  ) {
    const dy = d.getDay();
    if (dy !== 5 && dy !== 6) eligible++;
  }
  return { ...monthInfo, eligibleWorkDays: eligible };
}

export function adjKey(empId: string, year: number, month: number): string {
  return `${empId}-${year}-${month}`;
}

export function calcPayroll(
  emp: Employee,
  year: number,
  month: number,
  adjustments: AdjustmentMap,
  leaves: LeaveRecord[] = [],
  lateRecords: LateRecord[] = []
): PayrollResult {
  const days = calcEmployeeWorkingDays(emp, year, month);
  const adj: PayrollAdjustment = adjustments[adjKey(emp.id, year, month)] ?? {
    unpaid: 0,
    deductions: 0,
    bonuses: 0,
    status: "draft",
  };

  const monthlySalary = Number(emp.salary) || 0;
  const dailySalary = days.workDays > 0 ? monthlySalary / days.workDays : 0;

  const unpaidFromLeaves = autoUnpaidForMonth(emp.id, year, month, leaves);
  const unpaidManual = Number(adj.unpaid) || 0;
  const totalUnpaidRaw = unpaidFromLeaves + unpaidManual;
  const unpaid = Math.min(totalUnpaidRaw, days.eligibleWorkDays);

  const workedDays = Math.max(0, days.eligibleWorkDays - unpaid);
  const earned = dailySalary * workedDays;

  const lateSummary = lateSummaryForMonth(
    emp.id,
    year,
    month,
    lateRecords,
    monthlySalary,
    days.workDays
  );
  const deductionsFromLate = lateSummary.totalDeduction;
  const deductionsManual = Number(adj.deductions) || 0;
  const deductions = deductionsManual + deductionsFromLate;
  const bonuses = Number(adj.bonuses) || 0;
  const net = Math.max(0, earned - deductions + bonuses);

  return {
    monthInfo: days,
    monthlySalary,
    dailySalary,
    eligibleWorkDays: days.eligibleWorkDays,
    unpaidDays: unpaid,
    unpaidFromLeaves,
    unpaidManual,
    workedDays,
    earned,
    deductions,
    deductionsManual,
    deductionsFromLate,
    lateMinutes: lateSummary.totalMinutes,
    bonuses,
    net,
    status: adj.status || "draft",
    notes: adj.notes || "",
  };
}
