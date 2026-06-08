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
import { usePlannerStore, termLabel } from '@/store/plannerStore';
import { courses } from '@/data/loadCourses';
import { validatePlan } from '@/lib/validatePlan';
import TermCell from '@/components/TermCell';
import ViolationList from '@/components/ViolationList';

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

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <ViolationList violations={violations} />

      <p className="rounded bg-yellow-100 px-3 py-2 text-sm text-yellow-800">
        This tool validates prerequisite ordering only. It does not check
        whether courses are offered in specific terms. Verify with the
        registrar.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {terms.map((term) => (
          <TermCell
            key={term.id}
            termId={term.id}
            label={termLabel(term)}
            entries={term.entries}
          />
        ))}
      </div>
    </div>
  );
}
