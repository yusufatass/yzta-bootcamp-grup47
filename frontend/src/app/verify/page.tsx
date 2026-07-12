"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, clearAuthToken, getAuthToken } from "@/lib/api";
import { ThemeToggle } from "@/lib/theme";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/lib/i18n";

export default function VerifyPage() {
  const t = useTranslations("Verify");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const router = useRouter();

  // Poll user status to auto-redirect once email is verified
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const interval = setInterval(async () => {
      try {
        const user = await getCurrentUser();
        if (user.email_confirmed) {
          clearInterval(interval);
          router.push("/");
        }
      } catch (err) {
        // Ignore failures during polling (e.g. temporary network issues)
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [router]);

  const checkStatusManually = async () => {
    const token = getAuthToken();
    if (!token) {
      setError(t("noSession"));
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const user = await getCurrentUser();
      if (user.email_confirmed) {
        router.push("/");
      } else {
        setError(t("notVerified"));
      }
    } catch (err: any) {
      setError(err.message || t("checkFailed"));
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    router.push("/login");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-sm border border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <svg
            className="h-6 w-6 text-zinc-600 dark:text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("body")}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-zinc-100 p-4 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {error}
          </div>
        )}

        <div className="space-y-4 pt-4">
          <button
            onClick={checkStatusManually}
            disabled={checking}
            className="flex w-full justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:bg-zinc-400 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-700"
          >
            {checking ? t("checking") : t("verifiedButton")}
          </button>

          <button
            onClick={handleLogout}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            {t("backToLogin")}
          </button>
        </div>
      </div>
    </div>
  );
}
