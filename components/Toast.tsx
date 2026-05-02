"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ToastContextValue {
  show: (msg: string) => void;
}

const Ctx = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string>("");
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((m: string) => {
    setMsg(m);
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 2200);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {visible && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-ink text-white px-5 py-3 rounded-[10px] font-semibold text-[13px] shadow-lg"
          role="status"
        >
          {msg}
        </div>
      )}
    </Ctx.Provider>
  );
}
