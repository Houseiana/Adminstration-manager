"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useData } from "./Providers";

export function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { ready } = useData();

  return (
    <div className="flex min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <main className="flex flex-col min-w-0 flex-1">
        <Topbar onMenu={() => setOpen((v) => !v)} />
        <div className="p-6 max-w-[1600px] w-full mx-auto flex-1">
          {ready ? children : <div className="text-muted text-sm">Loading…</div>}
        </div>
      </main>
    </div>
  );
}
