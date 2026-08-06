"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart2, Map, CheckSquare, MessageCircle, TrendingUp, Target, Calendar, Award } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useResumeStore } from "@/store/useResumeStore";
import api from "@/lib/api";

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="bg-[#111126] border border-indigo-500/15 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-300 mb-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

const QUICK_LINKS = [
  { href: "/dashboard/analysis", icon: BarChart2, label: "Resume Analysis", sub: "See your score and skill gaps", color: "from-indigo-500/20 to-indigo-500/5" },
  { href: "/dashboard/blueprint", icon: Map, label: "Daily Blueprint", sub: "Your day-by-day prep plan", color: "from-violet-500/20 to-violet-500/5" },
  { href: "/dashboard/tracker", icon: CheckSquare, label: "Progress Tracker", sub: "Tasks and milestones", color: "from-emerald-500/20 to-emerald-500/5" },
  { href: "/dashboard/chat", icon: MessageCircle, label: "Placement Chat", sub: "Ask anything, get straight answers", color: "from-pink-500/20 to-pink-500/5" },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { activeResume } = useResumeStore();
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    api.get("/analytics").then(r => setAnalytics(r.data)).catch(() => {});
  }, []);

  const score = activeResume?.analysis?.match_score ?? 0;
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="animate-fade-in space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Hey, {firstName} 👋</h1>
          <p className="text-slate-400 text-sm mt-1">
            {activeResume ? `Targeting: ${activeResume.target_position}` : "Upload a resume to get started"}
          </p>
        </div>
        {activeResume?.analysis && (
          <div className="flex items-center gap-3 bg-[#111126] border border-indigo-500/20 rounded-2xl px-4 py-3 self-start sm:self-auto">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Target size={15} className="text-indigo-400" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Active Resume</div>
              <div className="text-sm font-medium text-white">{activeResume.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Award} label="Resume Score" value={score > 0 ? `${score}%` : "—"} sub={score > 0 ? "Match strength" : "Upload a resume"} color="bg-indigo-500/80" />
        <StatCard icon={CheckSquare} label="Tasks Done" value={analytics ? `${analytics.completed_tasks}/${analytics.total_tasks}` : "—"} sub={analytics ? `${analytics.completion_rate}% completion` : "Loading…"} color="bg-emerald-500/80" />
        <StatCard icon={Map} label="Blueprint" value={analytics ? `${analytics.days_completed}/${analytics.days_total}` : "—"} sub={analytics ? `${analytics.blueprint_progress}% done` : "Not started"} color="bg-violet-500/80" />
        <StatCard icon={TrendingUp} label="Skill Gaps" value={activeResume?.analysis?.missing_skills?.length ?? "—"} sub="Areas to improve" color="bg-amber-500/80" />
      </div>

      {/* Progress Bar */}
      {analytics && analytics.days_total > 0 && (
        <div className="bg-[#111126] border border-indigo-500/15 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-white text-sm">Blueprint Progress</h3>
            <span className="text-indigo-400 text-sm font-bold">{analytics.blueprint_progress}%</span>
          </div>
          <div className="h-2.5 bg-[#0a0a1a] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700" style={{ width: `${analytics.blueprint_progress}%` }} />
          </div>
          <p className="text-slate-500 text-xs mt-2">{analytics.days_completed} of {analytics.days_total} days completed</p>
        </div>
      )}

      {/* Score History */}
      {analytics?.score_history?.length > 1 && (
        <div className="bg-[#111126] border border-indigo-500/15 rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Score History</h3>
          <div className="flex items-end gap-3 h-20">
            {analytics.score_history.map((h: any, i: number) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-xs text-indigo-400 font-bold">{h.score}</span>
                <div className="w-full bg-gradient-to-t from-indigo-500/80 to-violet-500/60 rounded-t-lg" style={{ height: `${(h.score / 100) * 64}px`, minHeight: "8px" }} />
                <span className="text-[10px] text-slate-600 truncate w-full text-center">{h.resume_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Nav */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Jump to</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {QUICK_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className={`bg-gradient-to-br ${l.color} border border-indigo-500/15 rounded-2xl p-5 hover:border-indigo-500/40 transition-all group`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <l.icon size={18} className="text-slate-300" />
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{l.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{l.sub}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}