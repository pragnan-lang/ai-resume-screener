import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import NavbarAuth from "@/components/NavbarAuth";

export const metadata: Metadata = {
  title: "AI Resume Screener",
  description: "Explainable, deterministic resume screening and ranking system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">AI Resume Screener</span>
                <span className="ml-2 hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/60">
                  Explainable AI
                </span>
              </div>
            </Link>

            <NavbarAuth />
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AI Resume Screener. Deterministic Math &amp; Explainable Evidence Extraction.</p>
        </footer>
      </body>
    </html>
  );
}
