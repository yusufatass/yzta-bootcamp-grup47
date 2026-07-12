"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";

export type ThemeMode = "light" | "dark" | "custom";

export interface CustomColors {
  bg: string;
  panelBg: string;
  text: string;
  border: string;
  borderDarker: string;
  borderLighter: string;
  textMuted: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  accentLight: string;
}

export interface PresetTheme {
  id: string;
  name: string;
  isDark: boolean;
  colors: {
    bg: string;
    panelBg: string;
    text: string;
    accent: string;
  };
}

// Helper to blend hex colors for sub-shades
function blendHex(c1: string, c2: string, p: number): string {
  try {
    const r1 = parseInt(c1.slice(1, 3), 16);
    const g1 = parseInt(c1.slice(3, 5), 16);
    const b1 = parseInt(c1.slice(5, 7), 16);

    const r2 = parseInt(c2.slice(1, 3), 16);
    const g2 = parseInt(c2.slice(3, 5), 16);
    const b2 = parseInt(c2.slice(5, 7), 16);

    const r = Math.round(r1 * (1 - p) + r2 * p);
    const g = Math.round(g1 * (1 - p) + g2 * p);
    const b = Math.round(b1 * (1 - p) + b2 * p);

    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  } catch {
    return c1;
  }
}

export function generateFullColors(
  bg: string,
  panelBg: string,
  text: string,
  accent: string,
  isDark: boolean
): CustomColors {
  const border = blendHex(bg, text, 0.12);
  const borderDarker = blendHex(bg, text, 0.20);
  const borderLighter = blendHex(bg, text, 0.06);
  const textMuted = blendHex(bg, text, 0.45);
  const textSecondary = blendHex(bg, text, 0.65);
  const accentHover = blendHex(accent, isDark ? "#ffffff" : "#000000", 0.12);
  const accentLight = blendHex(bg, accent, 0.10);

  return {
    bg,
    panelBg,
    text,
    border,
    borderDarker,
    borderLighter,
    textMuted,
    textSecondary,
    accent,
    accentHover,
    accentLight,
  };
}

export const PRESETS: PresetTheme[] = [
  {
    id: "sepia",
    name: "Sepia",
    isDark: false,
    colors: {
      bg: "#f4efe2",
      panelBg: "#fcfaf2",
      text: "#2b2b2b",
      accent: "#8c6239",
    },
  },
  {
    id: "forest",
    name: "Forest",
    isDark: false,
    colors: {
      bg: "#eef1ed",
      panelBg: "#f7f9f6",
      text: "#1e2f23",
      accent: "#2a6f97",
    },
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    isDark: true,
    colors: {
      bg: "#0a0915",
      panelBg: "#13112b",
      text: "#00f5ff",
      accent: "#ff007f",
    },
  },
  {
    id: "nord",
    name: "Nord Ice",
    isDark: true,
    colors: {
      bg: "#2e3440",
      panelBg: "#3b4252",
      text: "#eceff4",
      accent: "#88c0d0",
    },
  },
];

interface ThemeContextValue {
  themeMode: ThemeMode;
  theme: "dark" | "light"; // Legacy compatibility
  toggle: () => void; // Legacy compatibility
  customColors: CustomColors;
  customIsDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setCustomColors: (colors: CustomColors, isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeMode: "dark",
  theme: "dark",
  toggle: () => {},
  customColors: generateFullColors("#f4efe2", "#fcfaf2", "#2b2b2b", "#8c6239", false),
  customIsDark: false,
  setThemeMode: () => {},
  setCustomColors: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("dark");
  const [customColors, setCustomColorsState] = useState<CustomColors>(() =>
    generateFullColors("#f4efe2", "#fcfaf2", "#2b2b2b", "#8c6239", false)
  );
  const [customIsDark, setCustomIsDarkState] = useState<boolean>(false);

  useEffect(() => {
    try {
      const storedMode = localStorage.getItem("themeMode") as ThemeMode;
      const storedColors = localStorage.getItem("customColors");
      const storedIsDark = localStorage.getItem("customIsDark") === "true";

      if (storedMode) {
        setThemeModeState(storedMode);
      }
      if (storedColors) {
        setCustomColorsState(JSON.parse(storedColors));
      }
      setCustomIsDarkState(storedIsDark);
    } catch {}
  }, []);

  const applyTheme = (mode: ThemeMode, colors: CustomColors, isDark: boolean) => {
    const root = document.documentElement;
    root.classList.remove("dark", "theme-custom");

    if (mode === "light") {
      root.classList.remove("dark");
    } else if (mode === "dark") {
      root.classList.add("dark");
    } else if (mode === "custom") {
      root.classList.add("theme-custom");
      if (isDark) {
        root.classList.add("dark");
      }
      
      // Apply variables dynamically
      Object.entries(colors).forEach(([key, val]) => {
        // Convert camelCase or normal keys to css variable names (e.g. borderDarker -> border-darker)
        const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        root.style.setProperty(`--custom-${cssKey}`, val);
      });
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    applyTheme(mode, customColors, customIsDark);
    try {
      localStorage.setItem("themeMode", mode);
    } catch {}
  };

  const setCustomColors = (colors: CustomColors, isDark: boolean) => {
    setCustomColorsState(colors);
    setCustomIsDarkState(isDark);
    applyTheme(themeMode, colors, isDark);
    try {
      localStorage.setItem("customColors", JSON.stringify(colors));
      localStorage.setItem("customIsDark", String(isDark));
    } catch {}
  };

  // Legacy Toggle for compatibility
  const toggle = () => {
    if (themeMode === "dark") {
      setThemeMode("light");
    } else {
      setThemeMode("dark");
    }
  };

  // Map themeMode to legacy theme for backward compatibility
  const theme = themeMode === "dark" || (themeMode === "custom" && customIsDark) ? "dark" : "light";

  // Run on mount to initialize correctly
  useEffect(() => {
    applyTheme(themeMode, customColors, customIsDark);
  }, [themeMode, customColors, customIsDark]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        theme,
        toggle,
        customColors,
        customIsDark,
        setThemeMode,
        setCustomColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** Beautiful Theme Popover Selector Button */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const t = useTranslations("Theme");
  const {
    themeMode,
    theme,
    customColors,
    customIsDark,
    setThemeMode,
    setCustomColors,
  } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectPreset = (preset: PresetTheme) => {
    const full = generateFullColors(
      preset.colors.bg,
      preset.colors.panelBg,
      preset.colors.text,
      preset.colors.accent,
      preset.isDark
    );
    setCustomColors(full, preset.isDark);
    setThemeMode("custom");
  };

  const handleCustomColorChange = (key: keyof CustomColors, val: string) => {
    const nextColors = { ...customColors, [key]: val };
    const full = generateFullColors(
      key === "bg" ? val : nextColors.bg,
      key === "panelBg" ? val : nextColors.panelBg,
      key === "text" ? val : nextColors.text,
      key === "accent" ? val : nextColors.accent,
      customIsDark
    );
    setCustomColors(full, customIsDark);
  };

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t("themeSettings")}
        title={t("themeSettings")}
        className={`rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-all border border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-1.5 ${
          isOpen ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 scale-95" : ""
        } ${className}`}
      >
        <svg className="h-4.5 w-4.5 animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M4.098 19.902a3.75 3.75 0 015.304 0l6.401-6.402M4.098 19.902l9.713-9.712m-9.713 9.712l-1.33 1.33A1 1 0 005.187 23h1.365a1 1 0 00.707-.293l1.33-1.33m0 0l11.24-11.24a3.75 3.75 0 10-5.304-5.304L5.187 15.93m15.528 2.218a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm-3.472-9.437a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM3.75 6.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 010-1.5zM5.25 3a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H6a.75.75 0 01-.75-.75z" />
        </svg>
        <span className="text-xs font-semibold hidden md:inline">
          {themeMode === "light" ? t("light") : themeMode === "dark" ? t("dark") : t("custom")}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl z-50 p-4 font-sans focus:outline-none transition-all">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
              {t("themeSettings")}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs cursor-pointer"
            >
              {t("close")}
            </button>
          </div>

          {/* Mode Selector Segment */}
          <div className="grid grid-cols-3 gap-1.5 bg-zinc-50 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 mb-4">
            <button
              type="button"
              onClick={() => setThemeMode("light")}
              className={`py-1.5 text-xs font-semibold rounded-lg text-center transition-all cursor-pointer ${
                themeMode === "light"
                  ? "bg-white text-zinc-900 shadow dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {t("light")}
            </button>
            <button
              type="button"
              onClick={() => setThemeMode("dark")}
              className={`py-1.5 text-xs font-semibold rounded-lg text-center transition-all cursor-pointer ${
                themeMode === "dark"
                  ? "bg-white text-zinc-900 shadow dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {t("dark")}
            </button>
            <button
              type="button"
              onClick={() => setThemeMode("custom")}
              className={`py-1.5 text-xs font-semibold rounded-lg text-center transition-all cursor-pointer ${
                themeMode === "custom"
                  ? "bg-white text-zinc-900 shadow dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {t("custom")}
            </button>
          </div>

          {/* Custom Settings Sub-panel */}
          {themeMode === "custom" && (
            <div className="space-y-4 animate-fadeIn">
              {/* Presets grid */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  {t("presetPalettes")}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPreset(p)}
                      className="flex items-center gap-2 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-left transition-colors group cursor-pointer"
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-zinc-300/40 flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: p.colors.bg }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.colors.accent }}></span>
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 truncate">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Customizer */}
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  {t("customizeColors")}
                </span>
                <div className="space-y-2">
                  {/* Background Picker */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-950/20">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{t("background")}</span>
                    <input
                      type="color"
                      value={customColors.bg}
                      onChange={(e) => handleCustomColorChange("bg", e.target.value)}
                      className="h-5 w-8 border-0 bg-transparent cursor-pointer rounded overflow-hidden"
                    />
                  </div>

                  {/* Panel Background Picker */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-950/20">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{t("cardsPanels")}</span>
                    <input
                      type="color"
                      value={customColors.panelBg}
                      onChange={(e) => handleCustomColorChange("panelBg", e.target.value)}
                      className="h-5 w-8 border-0 bg-transparent cursor-pointer rounded overflow-hidden"
                    />
                  </div>

                  {/* Text Picker */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-950/20">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{t("textColor")}</span>
                    <input
                      type="color"
                      value={customColors.text}
                      onChange={(e) => handleCustomColorChange("text", e.target.value)}
                      className="h-5 w-8 border-0 bg-transparent cursor-pointer rounded overflow-hidden"
                    />
                  </div>

                  {/* Accent Picker */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-950/20">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{t("accentColor")}</span>
                    <input
                      type="color"
                      value={customColors.accent}
                      onChange={(e) => handleCustomColorChange("accent", e.target.value)}
                      className="h-5 w-8 border-0 bg-transparent cursor-pointer rounded overflow-hidden"
                    />
                  </div>

                  {/* Dark Mode Toggle for Custom */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-950/20">
                    <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{t("isDarkModeBased")}</span>
                    <button
                      type="button"
                      onClick={() => setCustomColors(customColors, !customIsDark)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        customIsDark ? "bg-blue-600" : "bg-zinc-200 dark:bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          customIsDark ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
