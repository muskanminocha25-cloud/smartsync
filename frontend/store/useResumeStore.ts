import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Resume } from "@/types";

interface ResumeStore {
  resumes: Resume[];
  activeResume: Resume | null;

  setResumes: (resumes: Resume[]) => void;
  addResume: (resume: Resume) => void;
  setActiveResume: (resume: Resume) => void;
  updateAnalysis: (resumeId: string, analysis: Resume["analysis"]) => void;
  clearResumes: () => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      resumes: [],
      activeResume: null,

      setResumes: (resumes) => {
        const active = resumes.find((r) => r.is_active) || resumes[0] || null;
        set({ resumes, activeResume: active });
      },

      addResume: (resume) =>
        set((state) => ({ resumes: [...state.resumes, resume] })),

      setActiveResume: (resume) => set({ activeResume: resume }),

      updateAnalysis: (resumeId, analysis) =>
        set((state) => ({
          resumes: state.resumes.map((r) =>
            r.id === resumeId ? { ...r, analysis } : r
          ),
          activeResume:
            state.activeResume?.id === resumeId
              ? { ...state.activeResume, analysis }
              : state.activeResume,
        })),

      clearResumes: () => set({ resumes: [], activeResume: null }),
    }),
    {
      name: "smartsync-resumes",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);