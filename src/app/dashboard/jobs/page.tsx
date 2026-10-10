"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  Users,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Check,
  AlertCircle,
  FileCode,
} from "lucide-react";
import { DEFAULT_WEIGHTS, JOB_1_RUBRIC, JobRubric } from "@/types/rubric";

interface JobItem {
  id: number;
  title: string;
  description: string;
  candidateCount: number;
  createdAt: string;
}

export default function JobsDashboardPage() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [rubric, setRubric] = useState<JobRubric>(JOB_1_RUBRIC);
  const [generatingRubric, setGeneratingRubric] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Seed State
  const [reseeding, setReseeding] = useState(false);
  const [seedSuccessMessage, setSeedSuccessMessage] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch jobs");
      setJobs(data.jobs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleGenerateRubric = async () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      setModalError("Please enter both Job Title and Description before generating a rubric.");
      return;
    }
    setModalError(null);
    setGeneratingRubric(true);
    try {
      const res = await fetch("/api/jobs/generate-rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate rubric");
      setRubric(data.rubric);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setGeneratingRubric(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      setModalError("Job Title and Description are required.");
      return;
    }
    setCreatingJob(true);
    setModalError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          rubric,
          weights: DEFAULT_WEIGHTS,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create job");

      setShowCreateModal(false);
      setNewTitle("");
      setNewDescription("");
      setRubric(JOB_1_RUBRIC);
      await fetchJobs();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setCreatingJob(false);
    }
  };

  const handleReseed = async () => {
    if (!confirm("Reset database to Job 1 with the 5 acceptance fixture candidates?")) return;
    setReseeding(true);
    setSeedSuccessMessage(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reseed database");
      setSeedSuccessMessage("Database re-seeded with 5 benchmark candidates!");
      await fetchJobs();
      setTimeout(() => setSeedSuccessMessage(null), 5000);
    } catch (err: any) {
      alert("Error reseeding database: " + err.message);
    } finally {
      setReseeding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Recruiter Jobs Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage job postings, customize 5-component rubrics, and screen candidate resumes deterministically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReseed}
            disabled={reseeding}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            title="Reset Job 1 with 5 fixture candidates"
          >
            <RotateCcw className={`w-4 h-4 ${reseeding ? "animate-spin" : ""}`} />
            <span>{reseeding ? "Resetting..." : "Reset Benchmark Data"}</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Job</span>
          </button>
        </div>
      </div>

      {seedSuccessMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{seedSuccessMessage}</span>
        </div>
      )}

      {/* Jobs Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3"></div>
          <p className="text-slate-500 text-sm">Loading job openings...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Jobs Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            Get started by creating a new job opening or click &quot;Reset Benchmark Data&quot; to load Job 1 (Machine Learning Engineer).
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Job</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 text-xs font-mono font-bold bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                    J{job.id}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2 line-clamp-1">
                  {job.title}
                </h3>
                <p className="text-slate-600 text-xs line-clamp-3 leading-relaxed mb-4">
                  {job.description}
                </p>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>
                    <strong>{job.candidateCount}</strong> candidate
                    {job.candidateCount === 1 ? "" : "s"} applied
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex items-center justify-between text-xs font-medium">
                <Link
                  href={`/apply/${job.id}`}
                  target="_blank"
                  className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Applicant Portal</span>
                </Link>

                <Link
                  href={`/dashboard/jobs/${job.id}`}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-semibold"
                >
                  <span>Recruiter View</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Create New Job</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define job details and review the 5-component rubric before screening.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="flex-1 overflow-y-auto p-6 space-y-6">
              {modalError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Job Title
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewTitle("Machine Learning Engineer");
                      setNewDescription(
                        "We are looking for a Machine Learning Engineer to design, deploy, and scale production ML models and MLOps pipelines. Requires strong Python, SQL, core ML algorithms, Docker, cloud deployment, and API development."
                      );
                      setRubric(JOB_1_RUBRIC);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Fill Job 1 Template</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Machine Learning Engineer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Job Description
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRubric}
                    disabled={generatingRubric}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-semibold disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{generatingRubric ? "Generating Rubric..." : "Generate Rubric with AI"}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="Paste the full job description text here..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Rubric Preview & Edit */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Evaluation Rubric (5 Components)
                  </h4>
                  <span className="text-xs text-slate-500">
                    Preloaded standard template
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-indigo-700">Skills ({rubric.skills.length} items):</span>
                    <span className="text-slate-600 ml-1.5">
                      {rubric.skills.map((i) => i.name).join(", ")}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-indigo-700">Experience ({rubric.experience.length} items):</span>
                    <span className="text-slate-600 ml-1.5">
                      {rubric.experience.map((i) => i.name).join(", ")}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-indigo-700">Education ({rubric.education.length} items):</span>
                    <span className="text-slate-600 ml-1.5">
                      {rubric.education.map((i) => i.name).join(", ")}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-indigo-700">Preferred Skills ({rubric.preferred.length} items):</span>
                    <span className="text-slate-600 ml-1.5">
                      {rubric.preferred.map((i) => i.name).join(", ")}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-indigo-700">Projects ({rubric.projects.length} items):</span>
                    <span className="text-slate-600 ml-1.5">
                      {rubric.projects.map((i) => i.name).join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingJob}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {creatingJob ? "Creating Job..." : "Create Job Opening"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
