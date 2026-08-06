"use client";

import { useEffect, useState } from "react";
import { RotateCw, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import api from "@/lib/api";

function ScoreRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(score), 200); return () => clearTimeout(t); }, [score]);
  const r = 80, c = 2 * Math.PI * r;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 75 ? "Strong Match" : score >= 50 ? "Good Fit" : score >= 35 ? "Needs Work" : "Major Gaps";
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-52 h-52">
        <svg className="-rotate-90 w-full h-full">
          <circle cx="104" cy="104" r={r} fill="none" stroke="#1a1a3e" strokeWidth="14" />
          <circle cx="104" cy="104" r={r} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c - (animated / 100) * c}
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-extrabold text-white">{score}</span>
          <span className="text-slate-400 text-sm">out of 100</span>
        </div>
      </div>
      <span className="text-sm font-semibold px-4 py-1.5 rounded-full mt-3" style={{ color, backgroundColor: `${color}18`, border: `1px solid ${color}40` }}>{label}</span>
    </div>
  );
}

const importanceMeta: any = {
  critical: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", dot: "bg-red-400" },
  important: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", dot: "bg-amber-400" },
  "nice-to-have": { color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/30", dot: "bg-slate-400" },
};

export default function AnalysisPage() {
  const { activeResume, updateAnalysis } = useResumeStore();
  const [reanalyzing, setReanalyzing] = useState(false);

  const analysis = activeResume?.analysis;

  const handleReanalyze = async () => {
    if (!activeResume) return;
    setReanalyzing(true);
    try {
      const res = await api.post(`/resume/reanalyze/${activeResume.id}`);
      updateAnalysis(activeResume.id, res.data);
    } catch {} finally { setReanalyzing(false); }
  };

  if (!activeResume) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-slate-400 text-sm">No active resume. Please upload one.</p>
    </div>
  );

  if (!analysis) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-slate-400 text-sm">No analysis found for this resume.</p>
      <button onClick={handleReanalyze} disabled={reanalyzing}
        className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
        {reanalyzing ? "Analyzing…" : "Analyze Now"}
      </button>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Resume Analysis</h1>
          <p className="text-slate-400 text-sm mt-1">For: <span className="text-white">{activeResume.target_position}</span></p>
        </div>
        <button onClick={handleReanalyze} disabled={reanalyzing}
          className="flex items-center gap-2 bg-[#111126] border border-indigo-500/20 hover:border-indigo-500/40 text-slate-300 text-sm px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 self-start sm:self-auto">
          <RotateCw size={14} className={reanalyzing ? "animate-spin" : ""} />
          {reanalyzing ? "Analyzing…" : "Re-analyze"}
        </button>
      </div>

      {/* Score section */}
      <div className="bg-[#111126] border border-indigo-500/15 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          <ScoreRing score={analysis.match_score} />
          <div className="flex-1 w-full">
            {analysis.raw_summary && (
              <div className="bg-[#0f0f23] border border-indigo-500/15 rounded-2xl p-5 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Info size={14} className="text-indigo-400" />
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">AI Summary</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{analysis.raw_summary}</p>
              </div>
            )}
            {/* Strengths */}
            {analysis.strengths?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-400" /> What's working
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.strengths.map((s: string, i: number) => (
                    <span key={i} className="text-xs bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 px-3 py-1.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skill Gaps */}
      {analysis.missing_skills?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-400" /> Skill Gaps
            <span className="text-sm font-normal text-slate-500 ml-1">({analysis.missing_skills.length} areas to focus on)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {analysis.missing_skills.map((skill: any, i: number) => {
              const m = importanceMeta[skill.importance] || importanceMeta["nice-to-have"];
              return (
                <div key={i} className={`border rounded-2xl p-4 ${m.bg}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${m.dot}`} />
                      <span className="font-semibold text-white text-sm">{skill.skill}</span>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${m.color} bg-black/20`}>{skill.importance}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pl-4">{skill.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {analysis.suggestions?.length > 0 && (
        <div className="bg-[#111126] border border-indigo-500/15 rounded-2xl p-5 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">What to do next</h2>
          <div className="space-y-3">
            {analysis.suggestions.map((s: string, i: number) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center flex-shrink-0 text-indigo-400 text-xs font-bold">{i + 1}</div>
                <p className="text-slate-300 text-sm leading-relaxed pt-0.5">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}