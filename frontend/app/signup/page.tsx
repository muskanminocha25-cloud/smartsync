"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { authUtils } from "@/lib/auth";
import api from "@/lib/api";

const COURSES = ["B.Tech CSE", "B.Tech IT", "B.Tech ECE", "B.Tech EEE", "BCA", "MCA", "B.Sc CS", "MBA Tech", "Other"];

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({ name: "", email: "", course: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError(""); setLoading(true);
    try {
      const res = await api.post("/auth/signup", form);
      authUtils.setToken(res.data.token);
      setUser(res.data.user);
      router.push("/onboarding");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-5/12 relative items-center justify-center p-16 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 40% 50%, rgba(99,102,241,0.15) 0%, transparent 65%)" }} />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="relative z-10 max-w-xs">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30"><Zap size={20} className="text-white" /></div>
            <span className="text-xl font-bold">SmartSync</span>
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">Start your prep.<br /><span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">The right way.</span></h2>
          <p className="text-slate-400">Upload your resume once and get a personalized roadmap built around your gaps — not a generic template.</p>
        </div>
      </div>

      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-16 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center"><Zap size={18} className="text-white" /></div>
            <span className="text-xl font-bold">SmartSync</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Create your account</h1>
          <p className="text-slate-400 mb-8 text-sm">Free forever. No card needed.</p>

          {error && <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input type="text" value={form.name} onChange={e => set("name", e.target.value)} required placeholder="Rahul Sharma"
                  className="w-full bg-[#0f0f23] border border-indigo-500/25 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-colors text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Course</label>
                <select value={form.course} onChange={e => set("course", e.target.value)} required
                  className="w-full bg-[#0f0f23] border border-indigo-500/25 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm appearance-none">
                  <option value="">Select course</option>
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)} required placeholder="you@college.edu"
                className="w-full bg-[#0f0f23] border border-indigo-500/25 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-colors text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input type={show ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} required placeholder="Min. 8 characters"
                  className="w-full bg-[#0f0f23] border border-indigo-500/25 text-white rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-colors text-sm" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 text-sm shadow-lg shadow-indigo-500/20 mt-2">
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
          <p className="text-center text-slate-500 mt-6 text-sm">Already have an account? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Log in</Link></p>
        </div>
      </div>
    </div>
  );
}