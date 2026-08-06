"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Zap, Upload, CheckCircle, Clock, FileText, Sparkles } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import { useBlueprintStore } from "@/store/useBlueprintStore";
import api from "@/lib/api";

const POSITIONS = ["Software Development Engineer", "Data Analyst", "Product Manager", "Business Analyst", "Full Stack Developer", "Machine Learning Engineer", "DevOps Engineer", "UI/UX Designer"];
const TIMELINES = [{ days: 30, label: "30 Days", sub: "Focused sprint" }, { days: 60, label: "60 Days", sub: "Balanced pace" }, { days: 90, label: "90 Days", sub: "Deep preparation" }];

type Step = "details" | "analyzing" | "results" | "timeline" | "generating";

export default function OnboardingPage() {
  const router = useRouter();
  const { addResume, setActiveResume } = useResumeStore();
  const { setBlueprint } = useBlueprintStore();

  const [step, setStep] = useState<Step>("details");
  const [resumeName, setResumeName] = useState("My Resume");
  const [targetPosition, setTargetPosition] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [resume, setResume] = useState<any>(null);
  const [selectedTimeline, setSelectedTimeline] = useState(30);
  const [error, setError] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("");

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "application/pdf": [".pdf"] }, maxFiles: 1 });

  const handleAnalyze = async () => {
    if (!file || !targetPosition.trim()) { setError("Please fill in the target role and upload your PDF."); return; }
    setError("");
    setStep("analyzing");

    const msgs = ["Reading your resume…", "Understanding your experience…", "Identifying skill gaps…", "Calculating your match score…"];
    let i = 0;
    setLoadingMsg(msgs[0]);
    const interval = setInterval(() => { i++; if (i < msgs.length) setLoadingMsg(msgs[i]); }, 3500);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("resume_name", resumeName);
      form.append("target_position", targetPosition);
      const res = await api.post("/resume/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      clearInterval(interval);
      setResume(res.data);
      addResume(res.data);
      setActiveResume(res.data);
      setStep("results");
    } catch (err: any) {
      clearInterval(interval);
      setError(err.response?.data?.detail || "Analysis failed. Please try again.");
      setStep("details");
    }
  };

  const handleGenerate = async () => {
    setStep("generating");
    setLoadingMsg("Building your personalized day-by-day blueprint…");
    try {
      const res = await api.post("/blueprint/generate", { resume_id: resume.id, timeline_days: selectedTimeline });
      setBlueprint(res.data);
      router.push("/dashboard");
    } catch {
      setStep("results");
      setError("Blueprint generation failed. You can generate it from the dashboard.");
      router.push("/dashboard");
    }
  };

  const score = resume?.analysis?.match_score ?? 0;
  const scoreColor = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const scoreLabel = score >= 75 ? "Strong Match" : score >= 50 ? "Good Fit" : "Needs Work";

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25"><Zap size={18} className="text-white" /></div>
          <span className="text-lg font-bold">SmartSync</span>
        </div>

        {/* STEP: Details */}
        {step === "details" && (
          <div className="animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Let's set you up</h1>
            <p className="text-slate-400 mb-8 text-sm">Tell us your target role and upload your resume. We'll do the rest.</p>
            {error && <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">What role are you targeting?</label>
                <input value={targetPosition} onChange={e => setTargetPosition(e.target.value)} placeholder="e.g. Software Development Engineer"
                  className="w-full bg-[#0f0f23] border border-indigo-500/25 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-colors text-sm mb-3" />
                <div className="flex flex-wrap gap-2">
                  {POSITIONS.map(p => (
                    <button key={p} onClick={() => setTargetPosition(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${targetPosition === p ? "bg-indigo-500/20 border-indigo-500/60 text-indigo-300" : "border-indigo-500/15 text-slate-400 hover:border-indigo-500/40 hover:text-slate-200"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name this resume</label>
                <input value={resumeName} onChange={e => setResumeName(e.target.value)}
                  className="w-full bg-[#0f0f23] border border-indigo-500/25 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Upload your resume (PDF)</label>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragActive ? "border-indigo-500 bg-indigo-500/10" : file ? "border-emerald-500/50 bg-emerald-500/5" : "border-indigo-500/25 hover:border-indigo-500/50 hover:bg-indigo-500/5"}`}>
                  <input {...getInputProps()} />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText size={20} className="text-emerald-400" />
                      <div className="text-left">
                        <p className="text-emerald-400 font-medium text-sm">{file.name}</p>
                        <p className="text-slate-500 text-xs">{(file.size / 1024).toFixed(0)} KB • Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload size={24} className="text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">{isDragActive ? "Drop it here!" : "Drag & drop your PDF here, or click to browse"}</p>
                      <p className="text-slate-600 text-xs mt-1">PDF only, max 10MB</p>
                    </>
                  )}
                </div>
              </div>

              <button onClick={handleAnalyze}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm">
                <Sparkles size={16} /> Analyze My Resume
              </button>
            </div>
          </div>
        )}

        {/* STEP: Analyzing / Generating */}
        {(step === "analyzing" || step === "generating") && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-8 animate-glow">
              <Sparkles size={32} className="text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold mb-3">{step === "analyzing" ? "Analyzing your resume" : "Building your blueprint"}</h1>
            <p className="text-indigo-300 text-sm mb-8 min-h-[20px]">{loadingMsg}</p>
            <div className="flex justify-center gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            {step === "analyzing" && <p className="text-slate-600 text-xs mt-8">This usually takes 10–15 seconds</p>}
            {step === "generating" && <p className="text-slate-600 text-xs mt-8">Generating all {selectedTimeline} days — takes about 20–30 seconds</p>}
          </div>
        )}

        {/* STEP: Results */}
        {step === "results" && resume?.analysis && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-6">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">Analysis complete</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Here's your score</h1>
              <p className="text-slate-400 text-sm">For <span className="text-white font-medium">{targetPosition}</span></p>
            </div>

            {/* Score Circle */}
            <div className="flex justify-center mb-8">
              <div className="relative w-44 h-44">
                <svg className="-rotate-90 w-full h-full">
                  <circle cx="88" cy="88" r="72" fill="none" stroke="#1a1a3e" strokeWidth="12" />
                  <circle cx="88" cy="88" r="72" fill="none" stroke={scoreColor} strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 72}
                    strokeDashoffset={2 * Math.PI * 72 * (1 - score / 100)}
                    className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-white">{score}</span>
                  <span className="text-slate-400 text-xs">/ 100</span>
                  <span className="text-xs font-medium mt-1" style={{ color: scoreColor }}>{scoreLabel}</span>
                </div>
              </div>
            </div>

            {/* Quick gaps */}
            {resume.analysis.missing_skills?.length > 0 && (
              <div className="bg-[#111126] border border-indigo-500/15 rounded-2xl p-5 mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Top gaps to close</h3>
                <div className="space-y-2">
                  {resume.analysis.missing_skills.slice(0, 3).map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.importance === "critical" ? "bg-red-400" : s.importance === "important" ? "bg-amber-400" : "bg-slate-400"}`} />
                      <span className="text-sm text-slate-300">{s.skill}</span>
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${s.importance === "critical" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>{s.importance}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setStep("timeline")}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm">
              <Clock size={16} /> Set My Timeline
            </button>
          </div>
        )}

        {/* STEP: Timeline */}
        {step === "timeline" && (
          <div className="animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">How long do you have?</h1>
            <p className="text-slate-400 mb-8 text-sm">We'll build your day-by-day blueprint around this window.</p>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
              {TIMELINES.map(t => (
                <button key={t.days} onClick={() => setSelectedTimeline(t.days)}
                  className={`p-4 sm:p-6 rounded-2xl border-2 transition-all text-center ${selectedTimeline === t.days ? "border-indigo-500 bg-indigo-500/15" : "border-indigo-500/20 hover:border-indigo-500/50 bg-[#111126]"}`}>
                  <div className="text-xl sm:text-2xl font-bold text-white mb-1">{t.label}</div>
                  <div className="text-xs text-slate-400">{t.sub}</div>
                </button>
              ))}
            </div>

            <button onClick={handleGenerate}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 text-sm">
              <Sparkles size={16} /> Generate My {selectedTimeline}-Day Blueprint
            </button>
          </div>
        )}
      </div>
    </div>
  );
}