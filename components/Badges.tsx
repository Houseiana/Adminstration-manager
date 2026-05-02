"use client";

import { useLang } from "./Providers";
import type { EmployeeStatus, PayrollStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  const { t } = useLang();
  const map: Record<EmployeeStatus, string> = {
    active: "badge-green",
    inactive: "badge-gray",
    leave: "badge-blue",
    terminated: "badge-red",
  };
  const labelKey = `st_${status}` as const;
  return <span className={`badge ${map[status]}`}>{t(labelKey)}</span>;
}

export function PayrollStatusBadge({ status }: { status: PayrollStatus }) {
  const { t } = useLang();
  const map: Record<PayrollStatus, string> = {
    draft: "badge-gray",
    pending: "badge-yellow",
    approved: "badge-blue",
    paid: "badge-green",
  };
  const labelKey = `ps_${status}` as const;
  return <span className={`badge ${map[status]}`}>{t(labelKey)}</span>;
}
