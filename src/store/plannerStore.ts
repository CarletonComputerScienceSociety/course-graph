import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlannerEntry, ProgramTemplate, Season } from '@/types/planner';

// One box in a term column. `entry` is its contents (null = empty). `id` is a
// STABLE identity that survives the slot shifting position within its term — it's
// what React keys on, so a box's local UI state can't reattach to the wrong row
// when a future remove-slot / reorder ticket moves slots around. Mutations still
// address slots positionally (see setSlot); the id is for identity, not lookup.
export interface Slot {
  id: string;
  entry: PlannerEntry | null;
}

// A term holds a FIXED-LENGTH array of slots, one per visual box in the column.
// Positional identity — (termId, slotIndex) — is the stable contract every
// slot-targeting feature builds on: text entry today, drag-and-drop /
// connector-line anchors later.
export interface Term {
  id: string;
  year: number;
  season: Season;
  slots: Slot[];
}

// Default boxes seeded per term column. This is only the SEED for makeTerm — the
// real length lives per-term in `term.slots`, so a future "add slot" ticket grows
// a single term's array (up to MAX_SLOTS_PER_TERM) without touching this contract.
// Render off `term.slots.length`, never off this constant.
export const SLOTS_PER_TERM = 5;

// Documented ceiling for a term's slot count (the future grow/add-slot action
// caps here). Unused by the seed today; lives here so the limit has one home.
export const MAX_SLOTS_PER_TERM = 7;

interface PlannerState {
  terms: Term[];
  // The single slot mutation. Text entry, drag-and-drop, and template loading
  // all funnel through this: set a course/elective/choose entry at a slot, or
  // pass `null` to clear it.
  setSlot: (termId: string, index: number, entry: PlannerEntry | null) => void;
  loadTemplate: (template: ProgramTemplate) => void;
}

const SEASON_LABELS: Record<Season, string> = {
  fall: 'Fall',
  winter: 'Winter',
  summer: 'Summer',
};

// Just the season portion of a term's label, for the Fall/Winter sub-headers.
export function seasonLabel(season: Season): string {
  return SEASON_LABELS[season];
}

// Term identity is (year, season) — one term per season per year — so the id is
// derived from those: stable, unique, and readable (e.g. "y1f", "y2w", "y3s").
function termId(year: number, season: Season): string {
  return `y${year}${season[0]}`;
}

// Single source of truth for a term's display label, derived from year + season.
export function termLabel(term: Term): string {
  return `Year ${term.year} ${SEASON_LABELS[term.season]}`;
}

// Each slot gets a process-unique id. randomUUID (not a counter) so ids never
// collide across remove-then-add or across a persisted reload, where a counter
// would reset and reissue an id already saved on disk.
function makeSlot(entry: PlannerEntry | null = null): Slot {
  return { id: crypto.randomUUID(), entry };
}

// Builds a term whose slot array is padded to SLOTS_PER_TERM. Authored entries
// (templates) are placed earliest-first; remaining slots are empty. A term with
// more authored entries than SLOTS_PER_TERM grows to fit them all.
function makeTerm(
  year: number,
  season: Season,
  entries: PlannerEntry[] = [],
): Term {
  const length = Math.max(SLOTS_PER_TERM, entries.length);
  const slots = Array.from({ length }, (_, i) => makeSlot(entries[i] ?? null));
  return { id: termId(year, season), year, season, slots };
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

      setSlot: (termId, index, entry) => {
        set({
          terms: get().terms.map((t) =>
            t.id === termId
              ? {
                  ...t,
                  slots: t.slots.map((s, i) =>
                    i === index ? { ...s, entry } : s,
                  ),
                }
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
      name: 'course-graph-planner-v5',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ terms: state.terms }),
    },
  ),
);
