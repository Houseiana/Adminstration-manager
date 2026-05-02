import type { LateRecord } from "./types";

export const WORK_HOURS_PER_DAY = 8;
export const WORK_MINUTES_PER_DAY = WORK_HOURS_PER_DAY * 60;

// Money deducted for one minute of lateness.
export function minuteRate(
  monthlySalary: number,
  workingDaysInMonth: number
): number {
  if (workingDaysInMonth <= 0) return 0;
  const dailySalary = monthlySalary / workingDaysInMonth;
  return dailySalary / WORK_MINUTES_PER_DAY;
}

// Money deducted for a given number of late minutes.
export function calcLateDeduction(
  lateMinutes: number,
  monthlySalary: number,
  workingDaysInMonth: number
): number {
  if (lateMinutes <= 0) return 0;
  return lateMinutes * minuteRate(monthlySalary, workingDaysInMonth);
}

// Aggregate late records for an employee in a specific month.
export function lateSummaryForMonth(
  empId: string,
  year: number,
  month: number,
  lateRecords: LateRecord[],
  monthlySalary: number,
  workingDaysInMonth: number
): { totalMinutes: number; totalDeduction: number; entries: LateRecord[] } {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const entries = lateRecords.filter((r) => {
    if (r.empId !== empId) return false;
    const d = new Date(r.date);
    return d >= monthStart && d <= monthEnd;
  });
  const totalMinutes = entries.reduce(
    (s, r) => s + (Number(r.lateMinutes) || 0),
    0
  );
  const totalDeduction = calcLateDeduction(
    totalMinutes,
    monthlySalary,
    workingDaysInMonth
  );
  return { totalMinutes, totalDeduction, entries };
}
