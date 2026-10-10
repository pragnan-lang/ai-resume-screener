"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  UserCheck,
  LogOut,
  LogIn,
  User,
} from "lucide-react";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "RECRUITER" | "APPLICANT";
}

export default function NavbarAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) {
    return <div className="w-20 h-8"></div>;
  }

  return (
    <div className="flex items-center gap-3">
      {user ? (
        <>
          {user.role === "RECRUITER" ? (
            <Link
              href="/dashboard/jobs"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>Jobs Dashboard</span>
            </Link>
          ) : (
            <Link
              href="/portal"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>My Applications</span>
            </Link>
          )}

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                user.role === "RECRUITER"
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {user.role}
            </span>
            <span className="text-xs font-medium text-slate-700 hidden sm:inline">
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/portal"
            className="text-xs font-medium text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 hidden sm:inline-block"
          >
            Applicant Portal
          </Link>
          <Link
            href="/dashboard/jobs"
            className="text-xs font-medium text-slate-600 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 hidden sm:inline-block"
          >
            Recruiter Portal
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        </div>
      )}
    </div>
  );
}
