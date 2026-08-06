import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Blueprint, TrackerTask } from "@/types";

interface BlueprintStore {
  blueprint: Blueprint | null;
  tasks: TrackerTask[];
  isGenerating: boolean;

  setBlueprint: (blueprint: Blueprint) => void;
  setTasks: (tasks: TrackerTask[]) => void;
  setGenerating: (generating: boolean) => void;
  toggleTask: (taskId: string) => void;
  addCustomTask: (task: TrackerTask) => void;
  clearBlueprint: () => void;
}

export const useBlueprintStore = create<BlueprintStore>()(
  persist(
    (set) => ({
      blueprint: null,
      tasks: [],
      isGenerating: false,

      setBlueprint: (blueprint) => set({ blueprint }),
      setTasks: (tasks) => set({ tasks }),
      setGenerating: (isGenerating) => set({ isGenerating }),

      toggleTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        })),

      addCustomTask: (task) =>
        set((state) => ({ tasks: [...state.tasks, task] })),

      clearBlueprint: () => set({ blueprint: null, tasks: [] }),
    }),
    {
      name: "smartsync-blueprint",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);