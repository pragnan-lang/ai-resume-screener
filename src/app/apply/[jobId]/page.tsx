"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  ArrowRight,
  Briefcase,
} from "lucide-react";

interface JobInfo {
  id: number;
  title: string;
  description: string;
}

export default function ApplyPage() {
  const params = useParams();
  const jobId = params?.jobId as string;

  const [job, setJob] = useState<JobInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submittedCandidateId, setSubmittedCandidateId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJob() {
      try {
        setLoading(true);
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) {
          throw new Error("Job not found or unavailable.");
        }
        const data = await res.json();
        setJob(data.job);
      } catch (err: any) {
        setError(err.message || "Failed to load job details.");
      } finally {
        setLoading(false);
      }
    }

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf", "docx", "txt"].includes(ext)) {
      setSubmitError("Invalid file type. Please upload a PDF, DOCX, or TXT file.");
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("File is too large. Maximum allowed size is 5 MB.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!name.trim()) {
      setSubmitError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setSubmitError("Please enter a valid email address.");
      return;
    }
    if (!selectedFile) {
      setSubmitError("Please upload your resume.");
      return;
    }
    if (!consent) {
      setSubmitError("You must agree to the processing consent checkbox to apply.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("consent", "true");
      formData.append("resume", selectedFile);

      const res = await fetch(`/api/apply/${jobId}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application.");
      }

      setSubmittedCandidateId(data.candidateId);
    } catch (err: any) {
      setSubmitError(err.message || "Error submitting application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-4"></div>
        <p className="text-slate-600">Loading job opening...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Job Not Found</h2>
        <p className="text-slate-600 mb-6">{error || "This job posting does not exist."}</p>
      </div>
    );
  }

  // Confirmation screen
  if (submittedCandidateId) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Application Received!
          </h2>
          <p className="text-slate-600 mb-6">
            Thank you, <span className="font-semibold text-slate-800">{name}</span>. Your application for{" "}
            <span className="font-semibold text-slate-800">{job.title}</span> has been securely submitted.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 inline-block text-left w-full">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
              Application Reference ID
            </div>
            <div className="text-lg font-mono font-bold text-indigo-700">
              {submittedCandidateId}
            </div>
            <div className="text-xs text-slate-500 mt-2">
              A confirmation has been recorded for <span className="font-medium text-slate-700">{email}</span>.
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 text-xs text-slate-500 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Candidate privacy protected: Personal details are redacted during algorithmic screening.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      {/* Job Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold mb-2">
          <Briefcase className="w-4 h-4" />
          <span>Job Application</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
          {job.title}
        </h1>
        <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">
          {job.description}
        </p>
      </div>

      {/* Application Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-1">
          Submit Your Details
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Please provide your current resume in PDF, DOCX, or TXT format (max 5 MB).
        </p>

        {submitError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane.doe@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Resume Upload <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-indigo-400 transition-colors bg-slate-50/50">
              <div className="space-y-2 text-center">
                <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
                <div className="flex text-sm text-slate-600 justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept=".pdf,.docx,.txt"
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500">
                  PDF, DOCX, or TXT up to 5MB
                </p>
              </div>
            </div>

            {selectedFile && (
              <div className="mt-3 flex items-center gap-2 p-2.5 bg-indigo-50/60 border border-indigo-200/80 rounded-lg text-sm text-indigo-900">
                <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span className="font-medium truncate">{selectedFile.name}</span>
                <span className="text-xs text-indigo-500 ml-auto flex-shrink-0">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-600 leading-normal">
                I consent to the collection and automated processing of my resume for candidate screening purposes.
                I understand that personal demographic details are redacted during evaluation and scores assist human review.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <span>Submit Application</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
