import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Unstructured Notes — AI-Assisted Note Taking",
  description: "Write freely, let AI organize. A fast, minimal note-taking app with AI categorization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* 
          Blocking script: reads localStorage before first paint to avoid flash.
          Default is "dark" when no preference is stored.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('themeMode') || localStorage.getItem('theme') || 'dark';
                  if (mode === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.remove('theme-custom');
                  } else if (mode === 'custom') {
                    document.documentElement.classList.add('theme-custom');
                    var colorsStr = localStorage.getItem('customColors');
                    if (colorsStr) {
                      var colors = JSON.parse(colorsStr);
                      document.documentElement.style.setProperty('--custom-bg', colors.bg);
                      document.documentElement.style.setProperty('--custom-panel-bg', colors.panelBg);
                      document.documentElement.style.setProperty('--custom-text', colors.text);
                      document.documentElement.style.setProperty('--custom-border', colors.border);
                      document.documentElement.style.setProperty('--custom-border-darker', colors.borderDarker);
                      document.documentElement.style.setProperty('--custom-border-lighter', colors.borderLighter);
                      document.documentElement.style.setProperty('--custom-text-muted', colors.textMuted);
                      document.documentElement.style.setProperty('--custom-text-secondary', colors.textSecondary);
                      document.documentElement.style.setProperty('--custom-accent', colors.accent);
                      document.documentElement.style.setProperty('--custom-accent-hover', colors.accentHover);
                      document.documentElement.style.setProperty('--custom-accent-light', colors.accentLight);
                    }
                    var isDark = localStorage.getItem('customIsDark') === 'true';
                    if (isDark) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('theme-custom');
                  }
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <I18nProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
