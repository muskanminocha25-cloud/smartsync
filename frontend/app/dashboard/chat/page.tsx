"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Trash2, Sparkles, User } from "lucide-react";
import { useResumeStore } from "@/store/useResumeStore";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message { id: string; role: "user" | "assistant"; content: string; created_at: string; }

export default function ChatPage() {
  const { activeResume } = useResumeStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.get("/chat/history").then(r => setMessages(r.data)).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim(), created_at: new Date().toISOString() };
    setMessages(p => [...p, userMsg]);
    const currentInput = input.trim();
    setInput(""); setLoading(true);
    try {
      const res = await api.post("/chat/send", { message: currentInput, session_id: sessionId });
      if (!sessionId) setSessionId(res.data.session_id);
      setMessages(p => [...p, res.data.message]);
    } catch { setMessages(p => [...p, { id: Date.now().toString(), role: "assistant", content: "I'm having trouble responding right now. Please try again.", created_at: new Date().toISOString() }]); }
    finally { setLoading(false); }
  };

  const handleClear = async () => {
    setClearing(true);
    try { await api.delete("/chat/clear"); setMessages([]); setSessionId(null); } catch {}
    finally { setClearing(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Placement Chat</h1>
          {activeResume && (
            <p className="text-slate-500 text-xs mt-0.5">
              Context: <span className="text-indigo-400">{activeResume.target_position}</span>
              {activeResume.analysis && <span className="ml-1 text-slate-500">• Score: {activeResume.analysis.match_score}/100</span>}
            </p>
          )}
        </div>
        {messages.length > 0 && (
          <button onClick={handleClear} disabled={clearing}
            className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-xs px-3 py-2 rounded-xl hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20">
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2 scrollbar-thin">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <Sparkles size={22} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-white font-semibold mb-1">Ask me anything</p>
              <p className="text-slate-500 text-sm max-w-xs">I know your resume, your skill gaps, and your timeline. Ask me about what to study, how to prepare, or what to expect.</p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {["What should I focus on first?", "How do I learn System Design fast?", "What DSA topics matter most for SDE?"].map(q => (
                <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="text-left text-sm text-slate-400 hover:text-indigo-300 bg-[#111126] hover:bg-indigo-500/10 border border-indigo-500/15 hover:border-indigo-500/30 rounded-xl px-4 py-2.5 transition-all">{q}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow shadow-indigo-500/30">
                <Sparkles size={13} className="text-white" />
              </div>
            )}
            <div className={cn("max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              msg.role === "user"
                ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white rounded-tr-sm"
                : "bg-[#111126] border border-indigo-500/15 text-slate-200 rounded-tl-sm whitespace-pre-wrap")}>
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-xl bg-[#111126] border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={13} className="text-slate-400" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles size={13} className="text-white" />
            </div>
            <div className="bg-[#111126] border border-indigo-500/15 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex-shrink-0 bg-[#111126] border border-indigo-500/25 rounded-2xl p-3 focus-within:border-indigo-500/50 transition-all">
        <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Ask about your prep, skills, or what to do next…"
          rows={1} style={{ resize: "none", minHeight: "44px", maxHeight: "120px" }}
          className="w-full bg-transparent text-white text-sm placeholder:text-slate-600 focus:outline-none" />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-slate-600 hidden sm:block">Press Enter to send · Shift+Enter for new line</span>
          <button onClick={handleSend} disabled={!input.trim() || loading}
            className="ml-auto flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-all disabled:opacity-40 shadow shadow-indigo-500/20">
            <Send size={13} /> Send
          </button>
        </div>
      </div>
    </div>
  );
}