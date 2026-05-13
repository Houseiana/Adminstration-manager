import type { LeaveRecord, LeaveType } from "./types";

export const CASUAL_CAP = 3;
export const CASUAL_WINDOW_DAYS = 90;

// Multiplier = unpaid days deducted per 1 working day of leave
export function leaveMultiplier(
  type: LeaveType,
  isCasualOverCap: boolean,
  hasMedicalReport: boolean
): number {
  switch (type) {
    case "permission":
      return 1;
    case "absence":
      return 3;
    case "casual":
      return isCasualOverCap ? 1 : 0;
    case "sick":
      return hasMedicalReport ? 1 : 3;
    case "half_day":
      // Permission > 2 hours (arrival or departure) → 0.5 day deducted.
      return 0.5;
  }
}

function isWorkDay(d: Date): boolean {
  const dy = d.getDay();
  return dy !== 5 && dy !== 6;
}

// Working days (Sun-Thu) in a leave's date range — globally.
export function leaveWorkingDays(leave: LeaveRecord): number {
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  if (end < start) return 0;
  let count = 0;
  for (
    const d = new Date(start);
    d <= end;
    d.setDate(d.getDate() + 1)
  ) {
    if (isWorkDay(d)) count++;
  }
  return count;
}

// Working days of a leave that fall within a specific month.
export function leaveWorkingDaysInMonth(
  leave: LeaveRecord,
  year: number,
  month: number
): number {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  const lo = start > monthStart ? start : monthStart;
  const hi = end < monthEnd ? end : monthEnd;
  if (hi < lo) return 0;
  let count = 0;
  for (
    const d = new Date(lo);
    d <= hi;
    d.setDate(d.getDate() + 1)
  ) {
    if (isWorkDay(d)) count++;
  }
  return count;
}

// Determine over-cap status per casual leave for an employee.
// Logic: chronologically, the (CASUAL_CAP+1)th casual within any
// CASUAL_WINDOW_DAYS-day rolling window is over-cap.
export function casualOverCapMap(
  empLeaves: LeaveRecord[]
): Map<string, boolean> {
  const result = new Map<string, boolean>();
  const casuals = empLeaves
    .filter((l) => l.type === "casual")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  for (let i = 0; i < casuals.length; i++) {
    const cur = casuals[i];
    const curStart = new Date(cur.startDate);
    const cutoff = new Date(curStart);
    cutoff.setDate(cutoff.getDate() - CASUAL_WINDOW_DAYS);

    let priorInWindow = 0;
    for (let j = 0; j < i; j++) {
      const prevStart = new Date(casuals[j].startDate);
      if (prevStart >= cutoff && prevStart <= curStart) priorInWindow++;
    }
    result.set(cur.id, priorInWindow + 1 > CASUAL_CAP);
  }
  return result;
}

export interface ProcessedLeave {
  leave: LeaveRecord;
  workingDays: number;
  multiplier: number;
  unpaidDays: number;
  overCap: boolean;
}

export function processEmployeeLeaves(
  empLeaves: LeaveRecord[]
): ProcessedLeave[] {
  const overCap = casualOverCapMap(empLeaves);
  return empLeaves
    .slice()
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((leave) => {
      const wd = leaveWorkingDays(leave);
      const isOver = overCap.get(leave.id) ?? false;
      const m = leaveMultiplier(
        leave.type,
        isOver,
        Boolean(leave.medicalReport)
      );
      return {
        leave,
        workingDays: wd,
        multiplier: m,
        unpaidDays: wd * m,
        overCap: isOver,
      };
    });
}

// Total auto-unpaid days for a given employee in a specific month,
// pro-rated by the portion of each leave that falls in that month.
export function autoUnpaidForMonth(
  empId: string,
  year: number,
  month: number,
  allLeaves: LeaveRecord[]
): number {
  const empLeaves = allLeaves.filter((l) => l.empId === empId);
  const overCap = casualOverCapMap(empLeaves);

  let total = 0;
  for (const leave of empLeaves) {
    const wdInMonth = leaveWorkingDaysInMonth(leave, year, month);
    if (wdInMonth === 0) continue;
    const isOver = overCap.get(leave.id) ?? false;
    const m = leaveMultiplier(
      leave.type,
      isOver,
      Boolean(leave.medicalReport)
    );
    total += wdInMonth * m;
  }
  return total;
}

// Casual usage in past N days as of a reference date (default: today)
export function casualUsage(
  empId: string,
  allLeaves: LeaveRecord[],
  refDate: Date = new Date()
): { used: number; cap: number } {
  const cutoff = new Date(refDate);
  cutoff.setDate(cutoff.getDate() - CASUAL_WINDOW_DAYS);
  const used = allLeaves.filter(
    (l) =>
      l.empId === empId &&
      l.type === "casual" &&
      new Date(l.startDate) >= cutoff &&
      new Date(l.startDate) <= refDate
  ).length;
  return { used, cap: CASUAL_CAP };
}
