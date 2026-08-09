"use client";

import { useEffect, useState } from "react";
import { Plus, CheckCircle, Circle, Trash2, Edit2, X, Check } from "lucide-react";
import { useBlueprintStore } from "@/store/useBlueprintStore";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { TrackerTask } from "@/types";

const PRIORITY_META: any = {
  high: { label: "High", color: "text-red-400 bg-red-500/10 border-red-500/25" },
  medium: { label: "Medium", color: "text-amber-400 bg-amber-500/10 border-amber-500/25" },
  low: { label: "Low", color: "text-slate-400 bg-slate-500/10 border-slate-500/25" },
};
type Filter = "all" | "pending" | "done" | "custom";

export default function TrackerPage() {
  const { tasks, setTasks, toggleTask, addCustomTask } = useBlueprintStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", due_date: "" });
  const [editTitle, setEditTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/tasks/").then(r => { setTasks(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleToggle = async (taskId: string) => {
    toggleTask(taskId);
    try { await api.patch(`/tasks/${taskId}/toggle`); } catch { toggleTask(taskId); }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      const res = await api.post("/tasks/", { ...newTask, due_date: newTask.due_date || undefined });
      addCustomTask(res.data);
      setNewTask({ title: "", description: "", priority: "medium", due_date: "" });
      setShowAdd(false);
    } catch {}
  };

  const handleDelete = async (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    try { await api.delete(`/tasks/${taskId}`); } catch {}
  };

  const handleEdit = async (taskId: string) => {
    if (!editTitle.trim()) return;
    setTasks(tasks.map(t => t.id === taskId ? { ...t, title: editTitle } : t));
    try { await api.put(`/tasks/${taskId}`, { title: editTitle }); } catch {}
    setEditId(null);
  };

  const filtered = tasks.filter(t => {
    if (filter === "pending") return !t.completed;
    if (filter === "done") return t.completed;
    if (filter === "custom") return t.custom;
    return true;
  });
  const done = tasks.filter(t => t.completed).length;
  const total = tasks.length;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${total})` },
    { key: "pending", label: `Pending (${total - done})` },
    { key: "done", label: `Done (${done})` },
    { key: "custom", label: "Custom" },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Progress Tracker</h1>
          <p className="text-slate-400 text-sm mt-1">{done} of {total} tasks completed</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-indigo-500/20 self-start sm:self-auto">
          <Plus size={15} /> Add Task
        </button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Overall progress</span>
            <span className="text-indigo-400 font-semibold">{Math.round((done / total) * 100)}%</span>
          </div>
          <div className="h-2 bg-[#111126] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500" style={{ width: `${(done / total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={cn("flex-shrink-0 text-xs font-medium px-4 py-2 rounded-xl transition-all border",
              filter === f.key ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300" : "border-indigo-500/15 text-slate-400 hover:border-indigo-500/30 hover:text-slate-200")}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Add Task Form */}
      {showAdd && (
        <div className="bg-[#111126] border border-indigo-500/30 rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-white text-sm">New Task</h3>
          <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
            placeholder="Task title…" onKeyDown={e => e.key === "Enter" && handleAddTask()}
            className="w-full bg-[#0f0f23] border border-indigo-500/25 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-colors" />
          <input value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
            placeholder="Description (optional)"
            className="w-full bg-[#0f0f23] border border-indigo-500/25 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-600 transition-colors" />
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value }))}
              className="flex-1 bg-[#0f0f23] border border-indigo-500/25 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors">
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <input type="date" value={newTask.due_date} onChange={e => setNewTask(p => ({ ...p, due_date: e.target.value }))}
              className="flex-1 bg-[#0f0f23] border border-indigo-500/25 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleAddTask} className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition-all text-sm">Add Task</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 text-sm transition-colors"><X size={15} /></button>
          </div>
        </div>
      )}

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-[#111126] rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">No tasks here yet. Add one above.</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(task => {
            const pm = PRIORITY_META[task.priority] || PRIORITY_META.medium;
            return (
              <div key={task.id}
                className={cn("group flex items-start gap-4 bg-[#111126] border rounded-2xl p-4 transition-all",
                  task.completed ? "border-emerald-500/15 opacity-60" : "border-indigo-500/10 hover:border-indigo-500/25")}>
                <button onClick={() => handleToggle(task.id)}
                  className="mt-0.5 flex-shrink-0 text-slate-500 hover:text-emerald-400 transition-colors">
                  {task.completed ? <CheckCircle size={20} className="text-emerald-400" /> : <Circle size={20} />}
                </button>
                <div className="flex-1 min-w-0">
                  {editId === task.id ? (
                    <div className="flex items-center gap-2">
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus
                        onKeyDown={e => { if (e.key === "Enter") handleEdit(task.id); if (e.key === "Escape") setEditId(null); }}
                        className="flex-1 bg-[#0f0f23] border border-indigo-500/40 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500" />
                      <button onClick={() => handleEdit(task.id)} className="text-emerald-400 hover:text-emerald-300"><Check size={15} /></button>
                      <button onClick={() => setEditId(null)} className="text-slate-500 hover:text-slate-300"><X size={15} /></button>
                    </div>
                  ) : (
                    <>
                      <p className={cn("text-sm font-medium", task.completed ? "line-through text-slate-500" : "text-white")}>{task.title}</p>
                      {task.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border", pm.color)}>{pm.label}</span>
                        {task.due_date && <span className="text-xs text-slate-600">{new Date(task.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>}
                        {task.custom && <span className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">Custom</span>}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => { setEditId(task.id); setEditTitle(task.title); }} className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400 transition-colors"><Edit2 size={13} /></button>
                  <button onClick={() => handleDelete(task.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}