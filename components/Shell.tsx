"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useData, useLang } from "./Providers";

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { ready, loadError, refresh } = useData();
  const { t } = useLang();
  const pathname = usePathname();

  // Bare layout for the login page — no sidebar / topbar.
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <main className="flex flex-col min-w-0 flex-1">
        <Topbar onMenu={() => setOpen((v) => !v)} />
        {loadError && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center justify-between gap-3 text-[12px]">
            <div className="text-red-700">
              <span className="font-bold">⚠ {t("load_error_title")}:</span>{" "}
              <span>{loadError}</span>
            </div>
            <button
              onClick={() => refresh()}
              className="btn btn-soft btn-sm whitespace-nowrap"
            >
              ↻ {t("load_error_retry")}
            </button>
          </div>
        )}
        <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] w-full mx-auto flex-1">
          {ready ? (
            children
          ) : (
            <div className="text-muted text-sm flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-muted border-t-transparent rounded-full animate-spin" />
              {t("syncing")}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
