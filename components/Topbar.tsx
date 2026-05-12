"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "./Providers";
import type { I18NKey } from "@/lib/i18n";

interface TopbarProps {
  onMenu: () => void;
}

interface CurrentUser {
  userId: string;
  username: string;
  name: string;
  role: string;
}

const ROUTE_CRUMBS: Record<string, I18NKey[]> = {
  "/": ["nav_dashboard"],
  "/employees": ["nav_hr", "nav_employees"],
  "/payroll": ["nav_hr", "nav_payroll"],
  "/attendance": ["nav_hr", "nav_attendance"],
  "/leaves": ["nav_hr", "nav_leaves"],
  "/finance": ["nav_finance"],
  "/operations": ["nav_operations"],
  "/reports": ["nav_reports"],
  "/settings": ["nav_settings"],
};

export function Topbar({ onMenu }: TopbarProps) {
  const { t, lang, setLang } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/login");
    router.refresh();
  };

  const initial = user?.name?.charAt(0).toUpperCase() ?? "?";

  let crumbs: I18NKey[] = ROUTE_CRUMBS[pathname] || ["nav_dashboard"];
  if (pathname.startsWith("/employees/") && pathname !== "/employees") {
    crumbs = ["nav_hr", "nav_employees", "emp_details_title"];
  }

  return (
    <header className="topbar h-16 bg-surface border-b border-line flex items-center px-3 sm:px-6 gap-2 sm:gap-3 sticky top-0 z-50">
      <button
        onClick={onMenu}
        aria-label="Menu"
        className="lg:hidden w-9 h-9 rounded-[10px] grid place-items-center text-muted hover:bg-slate-100 hover:text-ink transition"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="flex items-center gap-1.5 sm:gap-2 text-muted text-[12px] sm:text-[13px] font-medium min-w-0 overflow-hidden">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          // On mobile, only show the last segment to save space.
          const hiddenOnMobile = !isLast ? "hidden sm:flex" : "flex";
          return (
            <span
              key={c + i}
              className={`${hiddenOnMobile} items-center gap-1.5 sm:gap-2 truncate min-w-0`}
            >
              <span
                className={`${
                  isLast ? "text-ink font-semibold" : ""
                } truncate`}
              >
                {t(c)}
              </span>
              {!isLast && (
                <span className="text-line-strong shrink-0">/</span>
              )}
            </span>
          );
        })}
      </div>

      <div className="flex-1" />

      <div className="hidden md:flex items-center gap-2 bg-slate-100 border border-transparent focus-within:bg-white focus-within:border-accent rounded-[10px] px-3 py-2 w-[260px] transition">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-muted shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder={t("search_ph")}
          className="bg-transparent outline-none w-full text-[14px]"
        />
      </div>

      <button
        onClick={() => setLang(lang === "en" ? "ar" : "en")}
        className="flex items-center gap-1 bg-ink text-white px-2 sm:px-2.5 py-1.5 rounded-[10px] font-semibold text-[12px] shrink-0"
        aria-label="Switch language"
      >
        <span className="text-accent">{lang === "en" ? "EN" : "ع"}</span>
        <span>/</span>
        <span>{lang === "en" ? "ع" : "EN"}</span>
      </button>

      <button
        aria-label="Notifications"
        className="hidden sm:grid w-9 h-9 rounded-[10px] place-items-center text-muted hover:bg-slate-100 hover:text-ink transition shrink-0"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      {/* Mobile: bare avatar */}
      <div
        className="md:hidden w-9 h-9 rounded-full bg-gradient-to-br from-accent to-accent-strong grid place-items-center font-bold text-ink shrink-0"
        title={user?.name ?? ""}
      >
        {initial}
      </div>
      {/* md+: full user chip */}
      <div className="hidden md:flex items-center gap-2.5 bg-slate-100 rounded-full pe-3 ps-1 py-1 shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-strong grid place-items-center font-bold text-ink">
          {initial}
        </div>
        <div className="leading-tight pe-1">
          <div className="font-semibold text-[13px] truncate max-w-[140px]">
            {user?.name ?? "—"}
          </div>
          <div className="text-[11px] text-muted truncate max-w-[140px]">
            {user?.username ?? t("role_admin")}
          </div>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        title={t("sign_out")}
        aria-label={t("sign_out")}
        className="w-9 h-9 rounded-[10px] grid place-items-center text-muted hover:bg-slate-100 hover:text-red-600 transition shrink-0"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    </header>
  );
}
