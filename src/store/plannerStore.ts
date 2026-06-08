import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlannerEntry, ProgramTemplate, Season } from '@/types/planner';

export interface Term {
  id: string;
  year: number;
  season: Season;
  entries: PlannerEntry[];
}

interface PlannerState {
  terms: Term[];
  addCourse: (termId: string, code: string) => void;
  removeEntry: (termId: string, index: number) => void;
  loadTemplate: (template: ProgramTemplate) => void;
}

const SEASON_LABELS: Record<Season, string> = {
  fall: 'Fall',
  winter: 'Winter',
  summer: 'Summer',
};

// Term identity is (year, season) — one term per season per year — so the id is
// derived from those: stable, unique, and readable (e.g. "y1f", "y2w", "y3s").
function termId(year: number, season: Season): string {
  return `y${year}${season[0]}`;
}

// Single source of truth for a term's display label, derived from year + season.
export function termLabel(term: Term): string {
  return `Year ${term.year} ${SEASON_LABELS[term.season]}`;
}

function makeTerm(
  year: number,
  season: Season,
  entries: PlannerEntry[] = [],
): Term {
  return { id: termId(year, season), year, season, entries };
}

const DEFAULT_TERMS: Term[] = [
  makeTerm(1, 'fall'),
  makeTerm(1, 'winter'),
  makeTerm(2, 'fall'),
  makeTerm(2, 'winter'),
  makeTerm(3, 'fall'),
  makeTerm(3, 'winter'),
  makeTerm(4, 'fall'),
  makeTerm(4, 'winter'),
];

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      terms: DEFAULT_TERMS,

      addCourse: (termId, code) => {
        set({
          terms: get().terms.map((t) =>
            t.id === termId &&
            !t.entries.some((e) => e.kind === 'course' && e.code === code)
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
          terms: template.terms.map((t) =>
            makeTerm(t.year, t.season, t.entries),
          ),
        });
      },
    }),
    {
      name: 'course-graph-planner-v3',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ terms: state.terms }),
    },
  ),
);
