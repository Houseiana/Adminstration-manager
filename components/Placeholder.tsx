"use client";

import { useLang } from "./Providers";

export function Placeholder() {
  const { t } = useLang();
  return (
    <div className="card">
      <div className="card-body text-center py-16">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="opacity-40 mx-auto mb-3"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div className="font-semibold text-ink">{t("placeholder_title")}</div>
        <div className="text-muted text-[13px] mt-1">{t("placeholder_sub")}</div>
      </div>
    </div>
  );
}
