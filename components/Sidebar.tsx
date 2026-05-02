"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLang } from "./Providers";
import type { I18NKey } from "@/lib/i18n";

interface NavLink {
  href: string;
  labelKey: I18NKey;
  icon: React.ReactNode;
}

interface NavGroup {
  labelKey: I18NKey;
  icon: React.ReactNode;
  children: NavLink[];
}

const ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  hr: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  finance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  ops: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};

const TOP_LINK: NavLink = {
  href: "/",
  labelKey: "nav_dashboard",
  icon: ICONS.dashboard,
};

const HR_GROUP: NavGroup = {
  labelKey: "nav_hr",
  icon: ICONS.hr,
  children: [
    { href: "/employees", labelKey: "nav_employees", icon: <span /> },
    { href: "/payroll", labelKey: "nav_payroll", icon: <span /> },
    { href: "/attendance", labelKey: "nav_attendance", icon: <span /> },
    { href: "/leaves", labelKey: "nav_leaves", icon: <span /> },
  ],
};

const OTHER_LINKS: NavLink[] = [
  { href: "/finance", labelKey: "nav_finance", icon: ICONS.finance },
  { href: "/operations", labelKey: "nav_operations", icon: ICONS.ops },
  { href: "/reports", labelKey: "nav_reports", icon: ICONS.reports },
];

const SYSTEM_LINKS: NavLink[] = [
  { href: "/settings", labelKey: "nav_settings", icon: ICONS.settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t, lang } = useLang();
  const pathname = usePathname();
  const [hrOpen, setHrOpen] = useState(true);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[80] bg-black/40 lg:hidden transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <aside
        className={`bg-surface border-line w-[260px] shrink-0 sticky top-0 h-screen overflow-y-auto p-4 flex flex-col gap-1.5 z-[90] transition-transform fixed lg:static
          ${lang === "ar" ? "border-l left-auto right-0" : "border-r left-0"}
          ${open ? "translate-x-0" : lang === "ar" ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex items-center gap-2.5 px-2.5 pb-4 border-b border-line mb-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-accent grid place-items-center font-extrabold text-ink text-lg">
            A
          </div>
          <div>
            <div className="font-extrabold text-[15px] tracking-tight">
              {t("brand")}
            </div>
            <div className="text-[11px] text-muted uppercase tracking-wider font-medium">
              {t("brand_sub")}
            </div>
          </div>
        </div>

        <NavLabel>{t("nav_main")}</NavLabel>

        <NavItemLink link={TOP_LINK} active={isActive(TOP_LINK.href)} t={t} onClose={onClose} />

        {/* HR group */}
        <div
          onClick={() => setHrOpen((v) => !v)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] cursor-pointer select-none transition ${
            HR_GROUP.children.some((c) => isActive(c.href))
              ? "bg-ink text-white"
              : "text-muted hover:bg-slate-100 hover:text-ink"
          }`}
        >
          <span className="w-[18px] h-[18px] shrink-0">{HR_GROUP.icon}</span>
          <span className="font-medium">{t(HR_GROUP.labelKey)}</span>
          <span
            className={`ms-auto w-3.5 h-3.5 transition-transform ${
              hrOpen ? "rotate-90" : ""
            } ${lang === "ar" ? "scale-x-[-1]" : ""}`}
          >
            {ICONS.arrow}
          </span>
        </div>
        {hrOpen && (
          <div className={`flex flex-col gap-0.5 mt-0.5 ${lang === "ar" ? "pr-9" : "pl-9"}`}>
            {HR_GROUP.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={onClose}
                className={`px-3 py-2 rounded-lg text-[13px] cursor-pointer ${
                  isActive(child.href)
                    ? "bg-accent-soft text-amber-800 font-semibold"
                    : "text-muted hover:bg-slate-100 hover:text-ink"
                }`}
              >
                {t(child.labelKey)}
              </Link>
            ))}
          </div>
        )}

        {OTHER_LINKS.map((link) => (
          <NavItemLink
            key={link.href}
            link={link}
            active={isActive(link.href)}
            t={t}
            onClose={onClose}
          />
        ))}

        <NavLabel>{t("nav_system")}</NavLabel>
        {SYSTEM_LINKS.map((link) => (
          <NavItemLink
            key={link.href}
            link={link}
            active={isActive(link.href)}
            t={t}
            onClose={onClose}
          />
        ))}
      </aside>
    </>
  );
}

function NavLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] text-muted uppercase tracking-wider px-3 pt-3.5 pb-1.5 font-semibold">
      {children}
    </div>
  );
}

function NavItemLink({
  link,
  active,
  t,
  onClose,
}: {
  link: NavLink;
  active: boolean;
  t: (k: I18NKey) => string;
  onClose: () => void;
}) {
  return (
    <Link
      href={link.href}
      onClick={onClose}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] font-medium transition ${
        active
          ? "bg-ink text-white [&_.nav-icon]:text-accent"
          : "text-muted hover:bg-slate-100 hover:text-ink"
      }`}
    >
      <span className="nav-icon w-[18px] h-[18px] shrink-0">{link.icon}</span>
      <span>{t(link.labelKey)}</span>
    </Link>
  );
}
