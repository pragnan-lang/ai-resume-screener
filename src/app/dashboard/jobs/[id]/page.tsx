"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  Sliders,
  Download,
  Play,
  Copy,
  Check,
  Trash2,
  X,
  ExternalLink,
  ChevronDown,
  AlertCircle,
  Award,
  Sparkles,
  FileText,
  UserCheck,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ComponentWeights, JobRubric, RubricItem } from "@/types/rubric";
import { validateWeights } from "@/lib/scoring";

interface CandidateRow {
  id: string;
  candidateCode: string;
  candidateNumber: number;
  name: string;
  email: string;
  resumeFileName: string;
  createdAt: string;
  evaluationStatus: string;
  skillsMatch: number | null;
  experienceMatch: number | null;
  educationMatch: number | null;
  preferredMatch: number | null;
  projectsMatch: number | null;
  totalScore: number | null;
  rank: number | null;
  explanation: string;
  missingSkills: string;
  itemScores: Record<string, { score: number; quote: string | null }>;
}

interface JobData {
  id: number;
  title: string;
  description: string;
  rubric: JobRubric;
  weights: ComponentWeights;
  createdAt: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params?.id as string;

  const [job, setJob] = useState<JobData | null>(null);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Screening state
  const [screening, setScreening] = useState(false);
  const [screenMessage, setScreenMessage] = useState<string | null>(null);

  // Weights Editor state
  const [showWeightsEditor, setShowWeightsEditor] = useState(false);
  const [weights, setWeights] = useState<ComponentWeights>({
    skills: 30,
    experience: 25,
    education: 10,
    preferred: 15,
    projects: 20,
  });
  const [savingWeights, setSavingWeights] = useState(false);

  // Candidate detail drawer
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRow | null>(null);
  const [deletingCandidate, setDeletingCandidate] = useState(false);

  // Link copy feedback
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error("Failed to load job details.");
      const data = await res.json();
      setJob(data.job);
      setCandidates(data.candidates || []);
      if (data.job?.weights) {
        setWeights(data.job.weights);
      }
    } catch (err: any) {
      setError(err.message || "Error loading job.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) fetchJobData();
  }, [jobId]);

  // Weights sum validation
  const weightValidation = useMemo(() => validateWeights(weights), [weights]);

  const handleWeightChange = (key: keyof ComponentWeights, val: string) => {
    const num = parseFloat(val) || 0;
    setWeights((prev) => ({
      ...prev,
      [key]: num,
    }));
  };

  const handleSaveWeights = async () => {
    if (!weightValidation.isValid) return;
    try {
      setSavingWeights(true);
      const res = await fetch(`/api/jobs/${jobId}/weights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update weights.");
      setShowWeightsEditor(false);
      await fetchJobData();
    } catch (err: any) {
      alert("Error saving weights: " + err.message);
    } finally {
      setSavingWeights(false);
    }
  };

  const handleScreenResumes = async () => {
    try {
      setScreening(true);
      setScreenMessage(null);
      const res = await fetch(`/api/jobs/${jobId}/screen`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to screen resumes.");
      setScreenMessage(data.message);
      await fetchJobData();
      setTimeout(() => setScreenMessage(null), 5000);
    } catch (err: any) {
      alert("Screening error: " + err.message);
    } finally {
      setScreening(false);
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm("Are you sure you want to permanently delete this candidate's data and uploaded resume?")) {
      return;
    }
    try {
      setDeletingCandidate(true);
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete candidate.");
      setSelectedCandidate(null);
      await fetchJobData();
    } catch (err: any) {
      alert("Error deleting candidate: " + err.message);
    } finally {
      setDeletingCandidate(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/apply/${jobId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Export to clean XLSX / CSV that imports cleanly into Google Sheets
  const handleExport = (format: "xlsx" | "csv") => {
    if (!job || candidates.length === 0) return;

    // Exact required columns order:
    // Candidate ID | Candidate Name | Skills Match | Experience Match | Education Match | Preferred Skills | Projects Match | Total Score | Rank | Explanation | Missing Skills
    const rows = candidates.map((c) => ({
      "Candidate ID": c.candidateCode,
      "Candidate Name": c.name,
      "Skills Match": c.skillsMatch !== null ? c.skillsMatch.toFixed(1) : "N/A",
      "Experience Match": c.experienceMatch !== null ? c.experienceMatch.toFixed(1) : "N/A",
      "Education Match": c.educationMatch !== null ? c.educationMatch.toFixed(1) : "N/A",
      "Preferred Skills": c.preferredMatch !== null ? c.preferredMatch.toFixed(1) : "N/A",
      "Projects Match": c.projectsMatch !== null ? c.projectsMatch.toFixed(1) : "N/A",
      "Total Score": c.totalScore !== null ? c.totalScore.toFixed(1) : "N/A",
      "Rank": c.rank !== null ? c.rank : "N/A",
      "Explanation": c.explanation,
      "Missing Skills": c.missingSkills,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-fit column widths
    const colWidths = [
      { wch: 14 }, // Candidate ID
      { wch: 22 }, // Candidate Name
      { wch: 14 }, // Skills Match
      { wch: 18 }, // Experience Match
      { wch: 16 }, // Education Match
      { wch: 16 }, // Preferred Skills
      { wch: 15 }, // Projects Match
      { wch: 13 }, // Total Score
      { wch: 8 },  // Rank
      { wch: 50 }, // Explanation
      { wch: 40 }, // Missing Skills
    ];
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ranked Candidates");

    const safeTitle = job.title.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `${safeTitle}_J${job.id}_Screening_Results.${format}`;

    if (format === "csv") {
      XLSX.writeFile(workbook, filename, { bookType: "csv" });
    } else {
      XLSX.writeFile(workbook, filename, { bookType: "xlsx" });
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3"></div>
        <p className="text-slate-500 text-sm">Loading ranked candidates...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Job Error</h2>
        <p className="text-slate-600 text-sm mb-4">{error || "Job not found."}</p>
        <Link
          href="/dashboard/jobs"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          ← Return to Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. Mandatory Human-Review Safety Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs sm:text-sm flex items-start gap-3 shadow-sm">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Human Review Required:</span>{" "}
          <span>
            Scores support human review and are not final hiring decisions. All rankings are algorithmic evaluations of resume evidence and should be reviewed alongside human interviews and evaluations.
          </span>
        </div>
      </div>

      {screenMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{screenMessage}</span>
        </div>
      )}

      {/* Top Header & Action Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                Job #{job.id}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {candidates.length} candidate{candidates.length === 1 ? "" : "s"} total
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {job.title}
            </h1>
            <p className="text-slate-500 text-xs mt-1 max-w-3xl line-clamp-2">
              {job.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Copy Public Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors shadow-sm"
              title="Copy public link for applicants"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Applicant Link</span>
                </>
              )}
            </button>

            {/* Weights Editor Toggle */}
            <button
              onClick={() => setShowWeightsEditor(!showWeightsEditor)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors shadow-sm"
            >
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Weights Editor</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  showWeightsEditor ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Export Dropdown / Buttons */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 shadow-sm overflow-hidden text-xs font-semibold">
              <button
                onClick={() => handleExport("xlsx")}
                className="px-3 py-2 text-slate-700 hover:bg-slate-100 border-r border-slate-200 flex items-center gap-1"
                title="Export Excel formatted for Google Sheets"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export XLSX</span>
              </button>
              <button
                onClick={() => handleExport("csv")}
                className="px-2.5 py-2 text-slate-700 hover:bg-slate-100"
                title="Export CSV"
              >
                <span>CSV</span>
              </button>
            </div>

            {/* Screen new resumes */}
            <button
              onClick={handleScreenResumes}
              disabled={screening}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${screening ? "animate-spin" : ""}`} />
              <span>{screening ? "Screening..." : "Screen new resumes"}</span>
            </button>
          </div>
        </div>

        {/* Weights Editor Drawer / Panel */}
        {showWeightsEditor && (
          <div className="mt-5 pt-5 border-t border-slate-100 bg-slate-50/70 p-4 rounded-xl border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Scoring Weights (Must sum to 100%)
                </h4>
                <p className="text-xs text-slate-500">
                  Adjust component weights. Updating will instantly recalculate all candidate totals and ranks.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                    weightValidation.isValid
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  Sum: {weightValidation.sum}%
                </span>
                <button
                  onClick={handleSaveWeights}
                  disabled={!weightValidation.isValid || savingWeights}
                  className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  {savingWeights ? "Recalculating..." : "Save & Recalculate"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Skills (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.skills}
                  onChange={(e) => handleWeightChange("skills", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Experience (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.experience}
                  onChange={(e) => handleWeightChange("experience", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Education (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.education}
                  onChange={(e) => handleWeightChange("education", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Preferred (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.preferred}
                  onChange={(e) => handleWeightChange("preferred", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Projects (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={weights.projects}
                  onChange={(e) => handleWeightChange("projects", e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Table - EXACT Column Order:
          Candidate ID | Candidate Name | Skills Match | Experience Match | Education Match | Preferred Skills | Projects Match | Total Score | Rank | Explanation | Missing Skills */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Screened & Ranked Candidates
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Sorted by Rank ascending • Click any row for evidence drawer
          </span>
        </div>

        {candidates.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">No candidates have applied yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Share the applicant portal link or submit a resume to begin screening.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 select-none">
                  <th className="py-3.5 px-4 whitespace-nowrap">Candidate ID</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Candidate Name</th>
                  <th className="py-3.5 px-3 whitespace-nowrap text-right">Skills Match</th>
                  <th className="py-3.5 px-3 whitespace-nowrap text-right">Experience Match</th>
                  <th className="py-3.5 px-3 whitespace-nowrap text-right">Education Match</th>
                  <th className="py-3.5 px-3 whitespace-nowrap text-right">Preferred Skills</th>
                  <th className="py-3.5 px-3 whitespace-nowrap text-right">Projects Match</th>
                  <th className="py-3.5 px-3 whitespace-nowrap text-right text-indigo-700">Total Score</th>
                  <th className="py-3.5 px-3 whitespace-nowrap text-center">Rank</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Explanation</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Missing Skills</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((c) => {
                  const isTopRank = c.rank === 1;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCandidate(c)}
                      className={`hover:bg-indigo-50/40 cursor-pointer transition-colors ${
                        selectedCandidate?.id === c.id ? "bg-indigo-50/60" : ""
                      }`}
                    >
                      {/* Candidate ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {c.candidateCode}
                        </span>
                      </td>

                      {/* Candidate Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{c.email}</div>
                      </td>

                      {/* Skills Match */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                        {c.skillsMatch !== null ? `${c.skillsMatch.toFixed(1)}%` : "—"}
                      </td>

                      {/* Experience Match */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                        {c.experienceMatch !== null ? `${c.experienceMatch.toFixed(1)}%` : "—"}
                      </td>

                      {/* Education Match */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                        {c.educationMatch !== null ? `${c.educationMatch.toFixed(1)}%` : "—"}
                      </td>

                      {/* Preferred Skills */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                        {c.preferredMatch !== null ? `${c.preferredMatch.toFixed(1)}%` : "—"}
                      </td>

                      {/* Projects Match */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                        {c.projectsMatch !== null ? `${c.projectsMatch.toFixed(1)}%` : "—"}
                      </td>

                      {/* Total Score */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        {c.totalScore !== null ? (
                          <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md">
                            {c.totalScore.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">Pending</span>
                        )}
                      </td>

                      {/* Rank */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {c.rank !== null ? (
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                              isTopRank
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {c.rank}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Explanation */}
                      <td className="py-3.5 px-4 text-slate-600 leading-snug">
                        <p className="line-clamp-2">{c.explanation}</p>
                      </td>

                      {/* Missing Skills */}
                      <td className="py-3.5 px-4 text-slate-500 leading-snug">
                        <p className="line-clamp-2">
                          {c.missingSkills || <span className="text-slate-400 italic">None</span>}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate Detail Drawer */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-indigo-50 text-indigo-700 rounded border border-indigo-200/60">
                    {selectedCandidate.candidateCode}
                  </span>
                  {selectedCandidate.rank !== null && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-amber-50 text-amber-800 rounded border border-amber-200/60">
                      Rank #{selectedCandidate.rank}
                    </span>
                  )}
                  {selectedCandidate.totalScore !== null && (
                    <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-100 text-slate-700 rounded border border-slate-200">
                      Score: {selectedCandidate.totalScore.toFixed(1)}/100
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedCandidate.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedCandidate.email} • File: {selectedCandidate.resumeFileName}
                </p>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Explanation Box */}
              <div className="bg-indigo-50/50 border border-indigo-200/70 rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-900 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Screening Explanation</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedCandidate.explanation}
                </p>
              </div>

              {/* Missing Skills */}
              {selectedCandidate.missingSkills && (
                <div className="border border-amber-200/80 bg-amber-50/50 rounded-xl p-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">
                    Gaps &amp; Missing Skills
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {selectedCandidate.missingSkills}
                  </p>
                </div>
              )}

              {/* Per-Item Breakdown & Evidence Quotes */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
                  Rubric Items &amp; Verified Evidence Quotes
                </h4>

                <div className="space-y-4">
                  {[
                    { title: "Skills Match", items: job.rubric.skills },
                    { title: "Experience Match", items: job.rubric.experience },
                    { title: "Education Match", items: job.rubric.education },
                    { title: "Preferred Skills", items: job.rubric.preferred },
                    { title: "Projects Match", items: job.rubric.projects },
                  ].map((category) => (
                    <div key={category.title} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-100/70 px-4 py-2 border-b border-slate-200 font-bold text-xs text-slate-700">
                        {category.title}
                      </div>
                      <div className="divide-y divide-slate-100">
                        {category.items.map((item: RubricItem) => {
                          const evalItem = selectedCandidate.itemScores[item.id];
                          const score = evalItem ? evalItem.score : 0;
                          const quote = evalItem?.quote;

                          const scoreBadgeColor =
                            score === 1
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : score === 0.75
                              ? "bg-teal-100 text-teal-800 border-teal-300"
                              : score === 0.5
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : score === 0.25
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-slate-100 text-slate-500 border-slate-200";

                          return (
                            <div key={item.id} className="p-3.5 text-xs">
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div>
                                  <span className="font-mono font-semibold text-slate-500 mr-1.5">
                                    [{item.id}]
                                  </span>
                                  <span className="font-semibold text-slate-900">
                                    {item.name}
                                  </span>
                                  {item.description && (
                                    <span className="text-slate-500 block text-[11px] mt-0.5">
                                      {item.description}
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`font-mono font-bold px-2 py-0.5 rounded border text-[11px] flex-shrink-0 ${scoreBadgeColor}`}
                                >
                                  {score}
                                </span>
                              </div>

                              {quote ? (
                                <div className="mt-2 pl-3 border-l-2 border-indigo-400 bg-slate-50/80 py-1.5 pr-2 rounded-r text-slate-700 italic text-[11px] leading-relaxed">
                                  &ldquo;{quote}&rdquo;
                                </div>
                              ) : (
                                <div className="mt-1 text-[11px] text-slate-400 italic">
                                  No evidence quote identified on resume.
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer: Delete Candidate Data */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Privacy: Permanent deletion removes candidate record, scores, and file.
              </span>
              <button
                onClick={() => handleDeleteCandidate(selectedCandidate.id)}
                disabled={deletingCandidate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingCandidate ? "Deleting..." : "Delete Candidate Data"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
