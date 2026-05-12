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
      className="modal-overlay fixed inset-0 z-[100] bg-slate-900/50 flex items-start sm:items-start justify-center p-2 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`modal bg-surface rounded-[12px] sm:rounded-[14px] w-full ${maxWidth} my-2 sm:my-10 shadow-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideHeader && (
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-line sticky top-0 bg-surface rounded-t-[12px] sm:rounded-t-[14px] z-10">
            <h3 className="text-[16px] sm:text-[17px] font-extrabold m-0 truncate pe-2">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-[10px] grid place-items-center text-muted hover:bg-slate-100 hover:text-ink transition shrink-0"
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
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-line flex justify-end gap-2 sm:gap-2.5 sticky bottom-0 bg-surface rounded-b-[12px] sm:rounded-b-[14px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
