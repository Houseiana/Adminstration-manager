"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/components/Providers";

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen grid place-items-center">…</div>}
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { t, lang, setLang } = useLang();
  const router = useRouter();
  const params = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: t("network_error") }));
        if (res.status === 401) {
          setError(t("invalid_credentials"));
        } else {
          setError(data.error || t("network_error"));
        }
        setBusy(false);
        return;
      }
      const dest = params.get("from") || "/";
      router.push(dest);
      router.refresh();
    } catch {
      setError(t("network_error"));
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, #fef9c3 0%, #f7f8fa 50%, #fef9c3 100%)",
      }}
    >
      <div className="w-full max-w-[420px]">
        <button
          type="button"
          onClick={() => setLang(lang === "en" ? "ar" : "en")}
          className="mb-4 mx-auto flex items-center gap-1.5 bg-ink text-white px-3 py-1.5 rounded-[10px] font-semibold text-[12px]"
        >
          <span className="text-accent">{lang === "en" ? "EN" : "ع"}</span>
          <span>/</span>
          <span>{lang === "en" ? "ع" : "EN"}</span>
        </button>

        <div className="bg-white rounded-[16px] border border-line shadow-lg p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-[12px] bg-accent grid place-items-center font-extrabold text-ink text-2xl">
              A
            </div>
            <div>
              <div className="text-[20px] font-extrabold leading-tight">
                {t("brand")}
              </div>
              <div className="text-[12px] text-muted">{t("brand_sub")}</div>
            </div>
          </div>

          <h1 className="text-[18px] font-extrabold mb-1">{t("welcome_back")}</h1>
          <p className="text-muted text-[13px] mb-5">{t("please_sign_in")}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="field">
              <label>{t("username")}</label>
              <input
                type="text"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>{t("password")}</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-[10px] px-3 py-2 text-[13px] font-medium">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={busy || !username || !password}
              className="btn btn-primary justify-center mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? t("signing_in") : t("sign_in")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
