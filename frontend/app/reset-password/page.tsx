"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setError(""); setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: any) { setError(err.response?.data?.detail || "Invalid or expired link."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center"><Zap size={18} className="text-white" /></div>
          <span className="text-xl font-bold">SmartSync</span>
        </div>
        {done ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold mb-2">Password updated!</h1>
            <p className="text-slate-400 text-sm">Redirecting you to login…</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">Set new password</h1>
            <p className="text-slate-400 text-sm mb-8">Choose something strong and memorable.</p>
            {error && <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                <div className="relative">
                  <input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 characters"
                    className="w-full bg-[#0f0f23] border border-indigo-500/25 text-white rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-colors text-sm" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50 text-sm">
                {loading ? "Updating…" : "Update Password"}
              </button>
            </form>
            <Link href="/login" className="block text-center text-slate-500 hover:text-slate-300 text-sm mt-5 transition-colors">Back to login</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}