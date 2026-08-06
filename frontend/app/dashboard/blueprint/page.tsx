"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, CheckCircle, Clock, BookOpen, Play, Code, RefreshCw, ExternalLink } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import { useBlueprintStore } from "@/store/useBlueprintStore";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const TIMELINES = [30, 60, 90];
const taskTypeIcon: any = { study: BookOpen, practice: Code, project: Play, revision: RefreshCw };
const taskTypeColor: any = { study: "text-indigo-400 bg-indigo-500/10", practice: "text-violet-400 bg-violet-500/10", project: "text-emerald-400 bg-emerald-500/10", revision: "text-amber-400 bg-amber-500/10" };

export default function BlueprintPage() {
  const { activeResume } = useResumeStore();
  const { blueprint, setBlueprint, isGenerating, setGenerating } = useBlueprintStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [timeline, setTimeline] = useState(30);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/blueprint/active").then(r => setBlueprint(r.data)).catch(() => {});
  }, []);

  const handleGenerate = async () => {
    if (!activeResume) return;
    setError(""); setGenerating(true);
    try {
      const res = await api.post("/blueprint/generate", { resume_id: activeResume.id, timeline_days: timeline });
      setBlueprint(res.data);
    } catch (e: any) { setError(e.response?.data?.detail || "Generation failed. Please try again."); }
    finally { setGenerating(false); }
  };

  const toggleDay = async (dayId: string) => {
    try {
      await api.patch(`/blueprint/day/${dayId}/complete`);
      if (blueprint) {
        const updated = { ...blueprint, days: blueprint.days.map((d: any) => d.id === dayId ? { ...d, is_completed: !d.is_completed } : d) };
        setBlueprint(updated);
      }
    } catch {}
  };

  if (isGenerating) return (
    <div className="flex flex-col items-center justify-center h-64 gap-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center animate-glow">
        <Play size={24} className="text-indigo-400" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-white mb-1">Building your blueprint…</p>
        <p className="text-slate-400 text-sm">Generating all {timeline} days. This takes about 20–30 seconds.</p>
      </div>
      <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
    </div>
  );

  if (!blueprint) return (
    <div className="animate-fade-in">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Daily Blueprint</h1>
      <p className="text-slate-400 text-sm mb-8">Generate a personalized day-by-day study plan based on your resume analysis.</p>
      {!activeResume?.analysis ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-amber-400 text-sm">
          Please analyze your resume first before generating a blueprint.
        </div>
      ) : (
        <div className="bg-[#111126] border border-indigo-500/15 rounded-3xl p-6 sm:p-8 max-w-md">
          {error && <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
          <h2 className="font-semibold text-white mb-5">Choose your timeline</h2>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {TIMELINES.map(t => (
              <button key={t} onClick={() => setTimeline(t)}
                className={cn("p-4 rounded-2xl border-2 text-center transition-all", timeline === t ? "border-indigo-500 bg-indigo-500/15" : "border-indigo-500/20 hover:border-indigo-500/40 bg-[#0f0f23]")}>
                <div className="text-xl font-bold text-white">{t}</div>
                <div className="text-xs text-slate-400 mt-0.5">days</div>
              </button>
            ))}
          </div>
          <button onClick={handleGenerate}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 text-sm">
            Generate {timeline}-Day Blueprint
          </button>
        </div>
      )}
    </div>
  );

  const completedDays = blueprint.days?.filter((d: any) => d.is_completed).length ?? 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Daily Blueprint</h1>
          <p className="text-slate-400 text-sm mt-1">{blueprint.timeline_days}-day plan for <span className="text-white">{blueprint.target_position}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#111126] border border-indigo-500/15 rounded-xl px-4 py-2.5 text-sm">
            <span className="text-indigo-400 font-bold">{completedDays}</span>
            <span className="text-slate-400">/{blueprint.timeline_days} days done</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="h-2 bg-[#111126] rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
          style={{ width: `${(completedDays / blueprint.timeline_days) * 100}%` }} />
      </div>

      {/* Day Cards */}
      <div className="space-y-2 sm:space-y-3">
        {blueprint.days?.map((day: any) => {
          const isExpanded = expanded === day.id;
          const isToday = new Date(day.date).toDateString() === new Date().toDateString();
          return (
            <div key={day.id}
              className={cn("border rounded-2xl overflow-hidden transition-all",
                day.is_completed ? "border-emerald-500/25 bg-emerald-500/5" : isToday ? "border-indigo-500/40 bg-indigo-500/5" : "border-indigo-500/10 bg-[#111126]")}>
              <button onClick={() => setExpanded(isExpanded ? null : day.id)}
                className="w-full flex items-center gap-4 p-4 sm:p-5 text-left">
                {/* Day number */}
                <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm",
                  day.is_completed ? "bg-emerald-500/20 text-emerald-400" : isToday ? "bg-indigo-500/20 text-indigo-400" : "bg-[#0f0f23] text-slate-400")}>
                  {day.is_completed ? <CheckCircle size={18} /> : `${day.day_number}`}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm">{day.theme}</span>
                    {isToday && <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">Today</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">{new Date(day.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs text-slate-500">{day.tasks?.length ?? 0} tasks</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div onClick={e => { e.stopPropagation(); toggleDay(day.id); }}
                    className={cn("w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all",
                      day.is_completed ? "bg-emerald-500 border-emerald-500" : "border-slate-600 hover:border-emerald-500")}>
                    {day.is_completed && <CheckCircle size={14} className="text-white" />}
                  </div>
                    <ChevronDown size={15} className={cn("text-slate-500 transition-transform", isExpanded && "rotate-180")} />
                </div>
              </button>
            
              {isExpanded && (
                <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-indigo-500/10 space-y-5">
                  {/* Tasks */}
                  {day.tasks?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Tasks</h4>
                      <div className="space-y-2.5">
                        {day.tasks.map((task: any, i: number) => {
                          const TIcon = taskTypeIcon[task.type] || BookOpen;
                          const tColor = taskTypeColor[task.type] || taskTypeColor.study;
                          return (
                            <div key={i} className="flex items-start gap-3 bg-[#0f0f23] rounded-xl p-3">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tColor}`}>
                                <TIcon size={13} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-200">{task.description}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock size={11} className="text-slate-600" />
                                  <span className="text-xs text-slate-500">{task.duration_minutes} min</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${tColor}`}>{task.type}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Resources */}
                  {day.resources?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Resources</h4>
                      <div className="space-y-2">
                        {day.resources.map((r: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 bg-[#0f0f23] rounded-xl px-3 py-2.5">
                            <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                              <BookOpen size={11} className="text-violet-400" />
                            </div>
                            <span className="text-sm text-slate-300 flex-1 truncate">{r.title}</span>
                            {r.url && (
                              <a href={r.url} target="_blank" rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 flex-shrink-0 transition-colors">
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}