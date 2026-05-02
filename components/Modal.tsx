"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  hideHeader?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-[760px]",
  hideHeader = false,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay fixed inset-0 z-[100] bg-slate-900/50 flex items-start justify-center p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`modal bg-surface rounded-[14px] w-full ${maxWidth} my-10 shadow-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideHeader && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <h3 className="text-[17px] font-extrabold m-0">{title}</h3>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-[10px] grid place-items-center text-muted hover:bg-slate-100 hover:text-ink transition"
              aria-label="Close"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        {children}
        {footer && (
          <div className="px-5 py-4 border-t border-line flex justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
