"use client";

import Link from "next/link";
import {
  Sparkles,
  Briefcase,
  UserCheck,
  ShieldCheck,
  Sliders,
  FileSpreadsheet,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explainable AI &amp; Deterministic Scoring</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight max-w-4xl mx-auto leading-tight mb-6">
          Screen &amp; Rank Resumes with{" "}
          <span className="text-indigo-600 bg-clip-text">100% Explainable Math</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          A unified hiring platform. Recruiters evaluate applicants with verifiable resume evidence quotes, while candidates enjoy blind, bias-free screening.
        </p>

        {/* Dual Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left mb-16">
          {/* Recruiter Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-7 flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-5 shadow-sm">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Recruiter Portal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Manage job openings, tune rubric weights in real time, extract verbatim evidence quotes, and export ranked tables to Google Sheets.
              </p>
            </div>

            <div className="space-y-2">
              <Link
                href="/dashboard/jobs"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-2xs"
              >
                <span>Enter Recruiter Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center text-xs text-indigo-600 hover:text-indigo-800 font-semibold py-1.5"
              >
                Sign in with recruiter credentials →
              </Link>
            </div>
          </div>

          {/* Applicant Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-7 flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition-all">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-5 shadow-sm">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Candidate Portal
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Explore open positions, upload your resume with personal demographic PII redaction, and track your submission status transparently.
              </p>
            </div>

            <div className="space-y-2">
              <Link
                href="/portal"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-2xs"
              >
                <span>Explore Careers &amp; Apply</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center text-xs text-emerald-700 hover:text-emerald-900 font-semibold py-1.5"
              >
                Sign in to check application status →
              </Link>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="border-t border-slate-200 pt-12 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
            <ShieldCheck className="w-6 h-6 text-indigo-600 mb-2" />
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Deterministic Scoring
            </h4>
            <p className="text-xs text-slate-500">
              The LLM extracts evidence only. All scores and competition ranks use verifiable formulas.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
            <Sliders className="w-6 h-6 text-indigo-600 mb-2" />
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Dynamic Weights Editor
            </h4>
            <p className="text-xs text-slate-500">
              Recalculate rankings instantly when criteria weights change without re-calling the LLM.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/70 shadow-2xs">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600 mb-2" />
            <h4 className="text-sm font-bold text-slate-900 mb-1">
              Clean Sheets Export
            </h4>
            <p className="text-xs text-slate-500">
              Download clean CSV and XLSX files ready for instant import into Google Sheets.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
