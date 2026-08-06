"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { authUtils } from "@/lib/auth";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      authUtils.setToken(res.data.token);
      setUser(res.data.user);
      const resumes = await api.get("/resume/all");
      router.push(resumes.data.length === 0 ? "/onboarding" : "/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col lg:flex-row">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-16 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(139,92,246,0.12) 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold">SmartSync</span>
          </div>
          <h2 className="text-5xl font-extrabold text-white leading-tight mb-5">
            Your placement
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              co-pilot.
            </span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            AI reads your resume, spots what's missing, builds you a day-by-day prep plan, and stays available to answer every question.
          </p>
          <div className="mt-10 flex flex-col gap-4">
            {["Resume scored in under 15 seconds", "Day-by-day blueprint, not vague monthly goals", "A chat that actually knows your profile"].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                </div>
                <span className="text-slate-300 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold">SmartSync</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Welcome back</h1>
          <p className="text-slate-400 mb-8 text-sm sm:text-base">Log in to continue your prep</p>

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@college.edu"
                className="w-full bg-[#0f0f23] border border-indigo-500/25 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-colors text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full bg-[#0f0f23] border border-indigo-500/25 text-white rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-colors text-sm"
                />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Forgot password?
              </Link>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 text-sm shadow-lg shadow-indigo-500/20">
              {loading ? "Logging in…" : "Log In"}
            </button>
          </form>

          <p className="text-center text-slate-500 mt-6 text-sm">
            No account?{" "}
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}