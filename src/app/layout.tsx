import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Fraunces, Manrope } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "DentSravni — най-изгодният зъболекарски продукт",
  description:
    "Сравнявай зъболекарски продукти по реална стойност: цена + доставка + митница. Запазай търсенията си в акаунт.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="bg"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-body)]">
        <AuthProvider>
          <Suspense fallback={<div className="h-16 border-b border-[var(--line)]/70" />}>
            <SiteHeader />
          </Suspense>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[var(--line)]/80 py-8 text-center text-sm text-[var(--muted)]">
            <div className="mx-auto max-w-6xl px-4">
              DentSravni · живи цени от български, европейски и международни
              магазини · митница по правилата за внос в България / ЕС
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
