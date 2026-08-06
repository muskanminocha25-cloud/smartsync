"use client";
import { useState } from "react";
import Link from "next/link";
import { Zap, ArrowLeft, Mail } from "lucide-react";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center"><Zap size={18} className="text-white" /></div>
          <span className="text-xl font-bold">SmartSync</span>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6">
              <Mail size={28} className="text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Check your inbox</h1>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              We've sent a reset link to <span className="text-white font-medium">{email}</span>.<br />
              It expires in 1 hour.
            </p>
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center justify-center gap-2 transition-colors">
              <ArrowLeft size={15} /> Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Forgot password?</h1>
            <p className="text-slate-400 mb-8 text-sm">Enter your email and we'll send you a reset link.</p>
            {error && <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@college.edu"
                  className="w-full bg-[#0f0f23] border border-indigo-500/25 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-colors text-sm" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 text-sm shadow-lg shadow-indigo-500/20">
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
            <Link href="/login" className="mt-6 text-slate-500 hover:text-slate-300 text-sm flex items-center gap-2 transition-colors">
              <ArrowLeft size={14} /> Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}