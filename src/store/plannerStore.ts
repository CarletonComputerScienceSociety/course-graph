import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlannerEntry, ProgramTemplate } from '@/types/planner';

export interface Term {
  id: string;
  label: string;
  entries: PlannerEntry[];
}

interface PlannerState {
  terms: Term[];
  addCourse: (termId: string, code: string) => void;
  removeEntry: (termId: string, index: number) => void;
  loadTemplate: (template: ProgramTemplate) => void;
}

const DEFAULT_TERMS: Term[] = [
  { id: 'y1f', label: 'Year 1 Fall', entries: [] },
  { id: 'y1w', label: 'Year 1 Winter', entries: [] },
  { id: 'y2f', label: 'Year 2 Fall', entries: [] },
  { id: 'y2w', label: 'Year 2 Winter', entries: [] },
  { id: 'y3f', label: 'Year 3 Fall', entries: [] },
  { id: 'y3w', label: 'Year 3 Winter', entries: [] },
  { id: 'y4f', label: 'Year 4 Fall', entries: [] },
  { id: 'y4w', label: 'Year 4 Winter', entries: [] },
];

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      terms: DEFAULT_TERMS,

      addCourse: (termId, code) => {
        set({
          terms: get().terms.map((t) =>
            t.id === termId && !t.entries.some((e) => e.kind === 'course' && e.code === code)
              ? { ...t, entries: [...t.entries, { kind: 'course', code }] }
              : t,
          ),
        });
      },

      removeEntry: (termId, index) => {
        set({
          terms: get().terms.map((t) =>
            t.id === termId
              ? { ...t, entries: t.entries.filter((_, i) => i !== index) }
              : t,
          ),
        });
      },

      loadTemplate: (template) => {
        set({
          terms: template.terms.map((templateTerm, i) => ({
            id: DEFAULT_TERMS[i]?.id ?? `term-${i}`,
            label: templateTerm.label,
            entries: templateTerm.entries,
          })),
        });
      },
    }),
    {
      name: 'course-graph-planner-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ terms: state.terms }),
    },
  ),
);
