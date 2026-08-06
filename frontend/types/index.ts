// ── User ─────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  course: string;
  created_at: string;
}

// ── Resume ───────────────────────────────────────────────────
export interface Resume {
  id: string;
  user_id: string;
  name: string;
  file_url: string;
  target_position: string;
  is_active: boolean;
  created_at: string;
  analysis?: ResumeAnalysis;
}

export interface ResumeAnalysis {
  id: string;
  resume_id: string;
  match_score: number;        // 0-100
  strengths: string[];
  missing_skills: SkillGap[];
  suggestions: string[];
  raw_summary: string;
  created_at: string;
}

export interface SkillGap {
  skill: string;
  importance: "critical" | "important" | "nice-to-have";
  description: string;
}

// ── Blueprint ────────────────────────────────────────────────
export interface Blueprint {
  id: string;
  resume_id: string;
  timeline_days: number;
  target_position: string;
  days: BlueprintDay[];
  created_at: string;
}

export interface BlueprintDay {
  id: string;
  blueprint_id: string;
  day_number: number;
  date: string;
  theme: string;
  tasks: DayTask[];
  resources: Resource[];
  completed: boolean;
}

export interface DayTask {
  id: string;
  description: string;
  duration_minutes: number;
  type: "study" | "practice" | "project" | "revision";
  completed: boolean;
}

export interface Resource {
  title: string;
  url?: string;
  type: "video" | "article" | "book" | "practice";
}

// ── Task Tracker ─────────────────────────────────────────────
export interface TrackerTask {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  custom: boolean;
  created_at: string;
}

// ── Chat ─────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// ── API Response Wrappers ─────────────────────────────────────
export interface APIResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface AuthResponse {
  token: string;
  token_type: string;
  user: User;
}