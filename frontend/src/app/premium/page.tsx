"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/lib/theme";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/lib/i18n";
import { getCurrentUser, getAuthToken, clearAuthToken, UserMe } from "@/lib/api";

export default function PremiumPage() {
  const t = useTranslations("Premium");
  const tHeader = useTranslations("Header");

  const [mounted, setMounted] = React.useState(false);
  const [user, setUser] = React.useState<UserMe | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showToast, setShowToast] = React.useState(false);

  const triggerDemoToast = () => {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    const checkUser = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        clearAuthToken();
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [mounted]);

  const isPremium = user && !user.trial_ended;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans flex flex-col">
      {/* Thinner Sticky Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md px-6 py-2.5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Image
              src="/mascot/logo.png"
              alt="Note Sloth Logo"
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
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              {t("goToWorkspace")}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Showcase */}
      <main className="flex-1 flex flex-col justify-center items-center py-16 px-6">
        <div className="max-w-4xl text-center space-y-4 mb-16">
          {(!mounted || loading) ? (
            <div className="w-40 h-6 bg-zinc-200/50 dark:bg-zinc-800/50 rounded animate-pulse"></div>
          ) : isPremium ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20 shadow-sm animate-pulse">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{t("shieldActive")}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-zinc-200/60 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
              <span>{t("upgradeBadge")}</span>
            </div>
          )}
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
            {t("titlePart1")}<span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">{t("titleHighlight")}</span>{t("titlePart2")}
          </h1>
          <p className="text-sm sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl w-full">
          {/* Card 1 */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 hover:shadow-lg dark:hover:shadow-zinc-950/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[420px]">
            <div className="space-y-6">
              <div className="w-full h-40 flex items-center justify-center">
                <Image
                  src="/mascot/onboarding-organize.png"
                  alt="Unstructured Note Taking"
                  width={150}
                  height={150}
                  className="object-contain max-h-full max-w-full"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t("feature1Title")}</h3>
                <p className="text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed">
                  {t("feature1Desc")}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 hover:shadow-lg dark:hover:shadow-zinc-950/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[420px]">
            <div className="space-y-6">
              <div className="w-full h-40 flex items-center justify-center">
                <Image
                  src="/mascot/spellcheck-correct.png"
                  alt="AI Magic Formatting"
                  width={150}
                  height={150}
                  className="object-contain max-h-full max-w-full"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t("feature2Title")}</h3>
                <p className="text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed">
                  {t("feature2Desc")}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 hover:shadow-lg dark:hover:shadow-zinc-950/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[420px]">
            <div className="space-y-6">
              <div className="w-full h-40 flex items-center justify-center">
                <Image
                  src="/mascot/success-thumbsup.png"
                  alt="Smart Organization"
                  width={150}
                  height={150}
                  className="object-contain max-h-full max-w-full"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t("feature3Title")}</h3>
                <p className="text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed">
                  {t("feature3Desc")}
                </p>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 hover:shadow-lg dark:hover:shadow-zinc-950/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[420px]">
            <div className="space-y-6">
              <div className="w-full h-40 flex items-center justify-center">
                <Image
                  src="/mascot/safesloth.png"
                  alt="Privacy and Security"
                  width={150}
                  height={150}
                  className="object-contain max-h-full max-w-full"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t("feature4Title")}</h3>
                <p className="text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed">
                  {t("feature4Desc")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Bottom Section */}
        <div className="mt-16 text-center space-y-6 bg-gradient-to-r from-amber-500/10 to-amber-600/5 dark:from-amber-500/5 dark:to-zinc-900/5 border border-amber-500/25 dark:border-amber-500/15 rounded-3xl p-8 sm:p-12 max-w-3xl w-full">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
            {t("ctaTitle")}
          </h2>
          <p className="text-sm text-zinc-550 dark:text-zinc-400 max-w-xl mx-auto">
            {t("ctaSubtitle")}
          </p>
          <div className="pt-2">
            {isPremium ? (
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-750 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm"
              >
                {t("goToWorkspace")}
              </Link>
            ) : (
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-750 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm"
              >
                {t("ctaButton")}
              </Link>
            )}
          </div>
        </div>

        {/* Pricing Plans Section */}
        <section className="mt-24 max-w-5xl w-full space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t("pricingTitle")}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
              {t("pricingSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Card 1: FREE */}
            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 hover:shadow-xl dark:hover:shadow-zinc-950/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
                    {t("freePlanTitle")}
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{t("freePlanPrice")}</span>
                    <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t("freePlanPriceSub")}</span>
                  </div>
                </div>

                <ul className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                  {[
                    { label: t("freePlanFeature1"), allowed: true },
                    { label: t("freePlanFeature2"), allowed: true },
                    { label: t("freePlanFeature3"), allowed: true },
                    { label: t("freePlanFeature4"), allowed: false }
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-zinc-650 dark:text-zinc-350">
                      {feat.allowed ? (
                        <svg className="w-5 h-5 text-zinc-550 dark:text-zinc-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-500/70 dark:text-red-400/60 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={feat.allowed ? "" : "text-zinc-400 dark:text-zinc-550 line-through/none"}>{feat.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href="/"
                  className="block w-full text-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold py-3.5 text-sm transition-all duration-200"
                >
                  {t("freePlanButton")}
                </Link>
              </div>
            </div>

            {/* Card 2: NOTE SLOTH PLUS */}
            <div className="bg-white dark:bg-zinc-900/60 border border-amber-500/20 dark:border-amber-500/30 rounded-3xl p-8 hover:shadow-xl dark:hover:shadow-zinc-950/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative">
              {/* Highlighted Badge */}
              <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase shadow-md">
                {t("plusPlanBadge")}
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold tracking-widest text-amber-600 dark:text-amber-400 uppercase">
                    {t("plusPlanTitle")}
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{t("plusPlanPrice")}</span>
                    <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{t("plusPlanPriceSub")}</span>
                    <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 ml-1">{t("plusPlanPriceYr")}</span>
                  </div>
                </div>

                <ul className="space-y-4 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                  {[
                    t("plusPlanFeature1"),
                    t("plusPlanFeature2"),
                    t("plusPlanFeature3"),
                    t("plusPlanFeature4"),
                    t("plusPlanFeature5"),
                    t("plusPlanFeature6")
                  ].map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-zinc-650 dark:text-zinc-350">
                      <svg className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={triggerDemoToast}
                  className="block w-full text-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3.5 text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  {t("plusPlanButton")}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Mode Notification Toast */}
        {showToast && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-950 px-5 py-3.5 rounded-2xl shadow-2xl border border-zinc-800 dark:border-zinc-200 flex items-center gap-3 animate-bounce">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold">{t("demoToast")}</span>
          </div>
        )}
      </main>
    </div>
  );
}
