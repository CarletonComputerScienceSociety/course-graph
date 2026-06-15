// TODO (volunteer tickets):
// - Drag-and-drop courses between terms
// - Course palette sidebar with draggable course cards
// - Autocomplete on the course input
// - Co-op term special rendering (when COOP courses are added)
// - Configurable program length (not always 8 terms)
// - Polished violation rendering (cards, line numbers, jump-to)
// - Plan export/import as JSON
// - Share plan via URL hash
// - Reset plan button with confirm dialog
// - Render elective placeholder entries (with category label, italic, distinct border color)
// - Render choose-from-set entries (with credit count + description)
// - "Start from template" dropdown at the top of the planner; loads a ProgramTemplate via the store's loadTemplate action
// - Template freshness disclaimer banner shown when a template is loaded (uses validFor and lastReviewed fields)
// - First curated template content: BCS General (separate PR, content not engineering)
// - Subsequent templates: BCS Honours, BCS SE Stream, BCS AI Stream, BMath Data Science, Cybersecurity minor
// - In-planner course detail panel (shared component with Explorer)
// - In-planner prereq highlighting (click a course, highlight its prereqs in earlier terms and unlocks in later terms)

import { useMemo } from 'react';
import { usePlannerStore, termLabel, type Term } from '@/store/plannerStore';
import { courses } from '@/data/loadCourses';
import { validatePlan } from '@/lib/validatePlan';
import TermCell from '@/components/TermCell';
import ViolationList from '@/components/ViolationList';
import type { Season } from '@/types/planner';

interface YearGrouping {
  year: number;
  seasons: { season: Season; term: Term }[];
}

function createYearGrouping(terms: Term[]): YearGrouping[] {
  const years = new Map<number, Map<Season, Term>>();

  for (const term of terms) {
    let seasonMap = years.get(term.year);
    if (!seasonMap) {
      const map = new Map<Season, Term>();
      years.set(term.year, map);
      seasonMap = map;
    }

    seasonMap.set(term.season, term);
  }

  return [...years.entries()].map(([year, seasons]) => ({
    year,
    seasons: [...seasons.entries()].map(([season, term]) => ({
      season,
      term,
    })),
  }));
}

export default function Planner() {
  const terms = usePlannerStore((s) => s.terms);

  const violations = useMemo(
    () =>
      validatePlan(
        terms.map((t) => ({
          termId: t.id,
          label: termLabel(t),
          entries: t.entries,
        })),
        courses,
      ),
    [terms],
  );

  const grouping = useMemo(() => createYearGrouping(terms), [terms]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <ViolationList violations={violations} />

      <p className="rounded bg-yellow-100 px-3 py-2 text-sm text-yellow-800">
        This tool validates prerequisite ordering only. It does not check
        whether courses are offered in specific terms. Verify with the
        registrar.
      </p>

      <div className="flex w-full h-full gap-2 overflow-x-scroll">
        {grouping.map((yearGrouping) => (
          <div className="flex flex-col flex-1 min-w-96 rounded border border-gray-300">
            <h3 className="font-bold text-xl text-center border-b border-gray-300 p-1">
              YEAR {yearGrouping.year}
            </h3>

            <div className="flex h-full flex-1 p-1 gap-1">
              {yearGrouping.seasons.map((seasonGrouping) => (
                <div className="h-full flex-1 border border-gray-300">
                  <h4 className="font-semibold text-lg text-center border-b border-gray-300">
                    {seasonGrouping.season.toUpperCase()}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
