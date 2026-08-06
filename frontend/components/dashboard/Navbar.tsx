"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Zap, BarChart2, Map, CheckSquare, MessageCircle, ChevronDown, LogOut, User, Plus } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useResumeStore } from "@/store/useResumeStore";
import { authUtils } from "@/lib/auth";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/analysis", label: "Analysis", icon: BarChart2 },
  { href: "/dashboard/blueprint", label: "Blueprint", icon: Map },
  { href: "/dashboard/tracker", label: "Tracker", icon: CheckSquare },
  { href: "/dashboard/chat", label: "Chat", icon: MessageCircle },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { resumes, activeResume, setActiveResume } = useResumeStore();
  const [resumeOpen, setResumeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => { logout(); router.push("/login"); };

  const handleSwitchResume = async (resumeId: string) => {
    try {
      const res = await api.put(`/resume/set-active/${resumeId}`);
      setActiveResume(res.data);
      setResumeOpen(false);
      router.refresh();
    } catch {}
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-[#0a0a1a]/90 backdrop-blur-xl border-b border-indigo-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-4">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow shadow-indigo-500/30">
                <Zap size={15} className="text-white" />
              </div>
              <span className="font-bold text-base hidden sm:block">SmartSync</span>
            </Link>

            {/* Desktop Tabs */}
            <div className="hidden md:flex items-center gap-1 ml-4">
              {TABS.map(tab => {
                const active = pathname.startsWith(tab.href);
                return (
                  <Link key={tab.href} href={tab.href}
                    className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      active ? "bg-indigo-500/15 text-indigo-300" : "text-slate-400 hover:text-slate-200 hover:bg-white/5")}>
                    <tab.icon size={15} />
                    {tab.label}
                  </Link>
                );
              })}
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {/* Resume Dropdown */}
              {resumes.length > 0 && (
                <div className="relative">
                  <button onClick={() => { setResumeOpen(!resumeOpen); setProfileOpen(false); }}
                    className="flex items-center gap-2 bg-[#111126] border border-indigo-500/20 rounded-xl px-3 py-2 text-sm text-slate-300 hover:border-indigo-500/40 transition-all max-w-[140px] sm:max-w-[200px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">{activeResume?.name || "Select Resume"}</span>
                    <ChevronDown size={13} className={cn("flex-shrink-0 transition-transform", resumeOpen && "rotate-180")} />
                  </button>

                  {resumeOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-[#111126] border border-indigo-500/20 rounded-2xl shadow-xl shadow-black/30 py-2 z-50">
                      <p className="text-xs text-slate-500 px-4 pb-2 pt-1">Your Resumes</p>
                      {resumes.map(r => (
                        <button key={r.id} onClick={() => handleSwitchResume(r.id)}
                          className={cn("w-full text-left px-4 py-2.5 hover:bg-indigo-500/10 transition-colors flex items-center gap-3",
                            r.is_active && "bg-indigo-500/10")}>
                          <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", r.is_active ? "bg-emerald-400" : "bg-slate-600")} />
                          <div className="min-w-0">
                            <p className="text-sm text-slate-200 truncate">{r.name}</p>
                            <p className="text-xs text-slate-500 truncate">{r.target_position}</p>
                          </div>
                          {r.analysis && (
                            <span className="ml-auto text-xs font-bold text-indigo-400 flex-shrink-0">{r.analysis.match_score}%</span>
                          )}
                        </button>
                      ))}
                      <div className="border-t border-indigo-500/10 mt-2 pt-2 px-4">
                        <Link href="/onboarding" onClick={() => setResumeOpen(false)}
                          className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 py-1.5 transition-colors">
                          <Plus size={13} /> Add new resume
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Profile Dropdown */}
              <div className="relative">
                <button onClick={() => { setProfileOpen(!profileOpen); setResumeOpen(false); }}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-sm hover:border-indigo-500/60 transition-all">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[#111126] border border-indigo-500/20 rounded-2xl shadow-xl shadow-black/30 py-2 z-50">
                    <div className="px-4 py-3 border-b border-indigo-500/10">
                      <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                      <LogOut size={14} /> Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a1a]/95 backdrop-blur-xl border-t border-indigo-500/10">
        <div className="flex justify-around py-2">
          {TABS.map(tab => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link key={tab.href} href={tab.href}
                className={cn("flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all",
                  active ? "text-indigo-400" : "text-slate-600")}>
                <tab.icon size={20} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Close dropdowns on outside click */}
      {(resumeOpen || profileOpen) && (
        <div className="fixed inset-0 z-30" onClick={() => { setResumeOpen(false); setProfileOpen(false); }} />
      )}
    </>
  );
}