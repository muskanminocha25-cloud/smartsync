"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useResumeStore } from "@/store/useResumeStore";
import api from "@/lib/api";
import Navbar from "@/components/dashboard/Navbar";
import { authUtils } from "@/lib/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { setResumes } = useResumeStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!authUtils.isLoggedIn()) { router.push("/login"); return; }
    const init = async () => {
      try {
        const [userRes, resumesRes] = await Promise.all([api.get("/auth/me"), api.get("/resume/all")]);
        setUser(userRes.data);
        if (resumesRes.data.length === 0) { router.push("/onboarding"); return; }
        setResumes(resumesRes.data);
        setReady(true);
      } catch { router.push("/login"); }
    };
    init();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center animate-glow">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}