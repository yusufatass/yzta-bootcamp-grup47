"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/lib/theme";

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans flex flex-col">
      {/* Thinner Sticky Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md px-6 py-2.5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Image
              src="/mascot/logo.png"
              alt="Antigravity logo"
              width={51}
              height={28}
              style={{ width: 'auto', height: 'auto' }}
              className="object-contain"
              priority
            />
            <span>Unstructured Notes</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            >
              Go to Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Showcase */}
      <main className="flex-1 flex flex-col justify-center items-center py-16 px-6">
        <div className="max-w-4xl text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20 shadow-sm animate-pulse">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span>PREMIUM SHIELD ACTIVE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            Supercharge Your Focus with <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">AI Magic</span>
          </h1>
          <p className="text-sm sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Experience frictionless note-taking. Dump your raw thoughts and let our dual-LLM structure clean, organize, and format them instantly.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full">
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
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Unstructured Input</h3>
                <p className="text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed">
                  Simply dump raw meeting recordings, lecture highlights, voice transcripts, or chaotic thoughts. Don't worry about spelling, ordering, or structure—we handle the mess.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 hover:shadow-lg dark:hover:shadow-zinc-950/60 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[420px]">
            <div className="space-y-6">
              <div className="w-full h-40 flex items-center justify-center">
                <Image
                  src="/mascot/working-on.png"
                  alt="AI Magic Formatting"
                  width={150}
                  height={150}
                  className="object-contain max-h-full max-w-full"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">AI Magic Formatting</h3>
                <p className="text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed">
                  Powered by a dual-LLM pipeline that cleans up your input. It creates elegant structured markdown with tags, titles, checkable lists, and headers automatically.
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
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Smart Organization</h3>
                <p className="text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed">
                  Easily search, retrieve, and filter note categories. No manual folders needed. Keep your personal workspace beautifully tidy, readable, and lightning fast.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Bottom Section */}
        <div className="mt-16 text-center space-y-6 bg-gradient-to-r from-amber-500/10 to-amber-600/5 dark:from-amber-500/5 dark:to-zinc-900/5 border border-amber-500/25 dark:border-amber-500/15 rounded-3xl p-8 sm:p-12 max-w-3xl w-full">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
            Ready to experience frictionless clarity?
          </h2>
          <p className="text-sm text-zinc-550 dark:text-zinc-400 max-w-xl mx-auto">
            Join thousands of users turning raw information into actionable, structured notes instantly.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-750 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-sm"
            >
              Start Free 30-Day Trial
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
