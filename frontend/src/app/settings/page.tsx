"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  getCurrentUser, 
  getAuthToken, 
  clearAuthToken, 
  updateProfile, 
  deleteAccount,
  UserMe 
} from "@/lib/api";
import { ThemeToggle } from "@/lib/theme";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/lib/i18n";

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const tHeader = useTranslations("Header");
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Toast / error states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastVisible(true), 10);
    setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setToastMessage(null), 300);
    }, 3000);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loadUser = async () => {
      const token = getAuthToken();
      if (!token) {
        router.push("/");
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setFirstName(currentUser.first_name || "");
        setLastName(currentUser.last_name || "");
      } catch (err) {
        clearAuthToken();
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [mounted, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await updateProfile(firstName, lastName);
      showToast(t("successProfileUpdate"));
    } catch (err: any) {
      setError(err.message || t("errorProfileUpdate"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleteModalOpen(false);
    setIsDeleting(true);
    setError(null);

    try {
      await deleteAccount();
      clearAuthToken();
      sessionStorage.clear();
      router.push("/");
    } catch (err: any) {
      setError(err.message || t("errorDeleteAccount"));
      setIsDeleting(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans flex flex-col">
        <header className="sticky top-0 z-20 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md px-6 py-2.5">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Image
                src="/mascot/logo.png"
                alt="Unstructured Notes Logo"
                width={51}
                height={28}
                className="object-contain"
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
              <span>{tHeader("title")}</span>
            </div>
            <div className="w-24 h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
          </div>
        </header>
        <main className="flex-grow flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-zinc-300 dark:border-zinc-700 border-t-zinc-900 dark:border-t-white rounded-full animate-spin"></div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">{t("loading")}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md px-6 py-2.5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Image
              src="/mascot/logo.png"
              alt="Unstructured Notes Logo"
              width={51}
              height={28}
              style={{ width: 'auto', height: 'auto' }}
              className="object-contain"
              priority
            />
            <span>{tHeader("title")}</span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <Link
              href="/"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {t("goToWorkspace")}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Settings Grid */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:py-12 space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("title")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-xs font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50 dark:border-red-900/30">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Card 1: Profile Information */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-4">
              {t("profileInfo")}
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="first_name" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {t("firstName")}
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-450 dark:focus:ring-zinc-450"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="last_name" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {t("lastName")}
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-450 dark:focus:ring-zinc-450"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500">
                  {t("email")}
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-450 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-600 cursor-not-allowed"
                />
                <p className="text-[10px] text-zinc-450 dark:text-zinc-500">
                  {t("emailDisabledNotice")}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSaving ? t("saving") : t("saveChanges")}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Danger Zone */}
          <div className="bg-white dark:bg-zinc-900 border border-red-200/50 dark:border-red-900/30 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
                {t("dangerZone")}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t("dangerZoneDesc")}
              </p>
            </div>
            
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-zinc-900 dark:text-white">{t("deleteAccount")}</p>
                <p className="text-[11px] text-zinc-550 dark:text-zinc-400 max-w-xl leading-relaxed">
                  {t("deleteAccountDesc")}
                </p>
              </div>
              <div>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full sm:w-auto rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 dark:bg-red-950/20 dark:hover:bg-red-950/30 dark:border-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 text-xs font-bold transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? t("deleting") : t("deleteAccount")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Account Confirmation Dialog */}
      <DeleteAccountConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        t={t}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-4 right-4 z-50 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 px-4 py-2.5 rounded-xl shadow-lg border border-zinc-800 dark:border-zinc-200 text-xs font-semibold flex items-center gap-2 transition-all duration-300 transform ${
            toastVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"
          }`}
        >
          <span>✅</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

interface DeleteAccountConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: any;
}

function DeleteAccountConfirmationDialog({ isOpen, onClose, onConfirm, t }: DeleteAccountConfirmationDialogProps) {
  const [animateShow, setAnimateShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const raf = requestAnimationFrame(() => setAnimateShow(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setAnimateShow(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm transition-opacity duration-200 ${
        animateShow ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-xl transition-all duration-200 transform text-center ${
          animateShow ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex justify-center mb-4">
          <Image
            src="/mascot/logout-goodby.png"
            alt="Sloth waving goodbye"
            width={120}
            height={120}
            className="object-contain"
            style={{ width: 'auto', height: 'auto' }}
            priority
          />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t("deleteAccount")}</h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {t("dialogBody")}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            autoFocus
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors focus:ring-2 focus:ring-zinc-500 focus:outline-none cursor-pointer"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 sm:flex-initial rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 dark:bg-red-950/20 dark:hover:bg-red-950/30 dark:border-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 text-sm font-semibold transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none cursor-pointer"
          >
            {t("deleteAccount")}
          </button>
        </div>
      </div>
    </div>
  );
}
