"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  FileCheck2,
  Calendar,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

interface Application {
  id: string;
  candidateCode: string;
  jobId: number;
  jobTitle: string;
  resumeFileName: string;
  appliedAt: string;
  status: string;
}

interface OpenJob {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

interface UserProfile {
  name: string;
  email: string;
  role: string;
}

export default function ApplicantPortalPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [openJobs, setOpenJobs] = useState<OpenJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load user info
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        if (meData.authenticated) {
          setUser(meData.user);
        }

        // Load applicant applications
        const appsRes = await fetch("/api/portal/applications");
        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setApplications(appsData.applications || []);
        }

        // Load open jobs
        const jobsRes = await fetch("/api/jobs");
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setOpenJobs(jobsData.jobs || []);
        }
      } catch (err) {
        console.error("Error loading portal data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3"></div>
        <p className="text-slate-500 text-sm">Loading applicant dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-600">
              <FileCheck2 className="w-4 h-4" />
              <span>Applicant Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome, {user?.name || "Candidate"}!
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Track the status of your submitted resumes and discover new career opportunities.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3.5 py-2 rounded-xl text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Blind Screening: PII Redacted for Fairness</span>
          </div>
        </div>
      </div>

      {/* 1. My Submitted Applications Section */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>My Submitted Applications</span>
          </h2>
          <span className="text-xs text-slate-500">
            {applications.length} submitted application{applications.length === 1 ? "" : "s"}
          </span>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-xs text-slate-500 shadow-sm">
            You haven&apos;t submitted any applications yet. Browse the open positions below to apply!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                      Ref: {app.candidateCode}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{app.status}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {app.jobTitle}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Resume file: <span className="font-mono">{app.resumeFileName}</span>
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Applied on {new Date(app.appliedAt).toLocaleDateString()}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 italic">
                    Under Human Recruiter Review
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Open Positions Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <span>Open Career Opportunities</span>
          </h2>
          <span className="text-xs text-slate-500">
            {openJobs.length} active position{openJobs.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {openJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 rounded border border-indigo-200/60 mb-2 inline-block">
                  Job #{job.id}
                </span>
                <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-1">
                  {job.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                  {job.description}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">Full-time</span>
                <Link
                  href={`/apply/${job.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-2xs"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
