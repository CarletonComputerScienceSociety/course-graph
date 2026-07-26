// TODO (volunteer tickets):
// - Course palette panel + drag-and-drop course tiles onto slots (see CoursePalette)
// - Prereq validation: re-add the violation banner (validatePlan + ViolationList
//   still exist; map each term's slots → compact entries, dropping nulls)
// - "Start from template" dropdown (store's loadTemplate) + freshness disclaimer
// - Render elective / choose entry kinds as styled tiles
// - "Add slot" / drag-overflow to grow a term up to MAX_SLOTS_PER_TERM
// - Add / remove terms (summer, year 5+); co-op term rendering
// - Prereq connector lines between slots; in-planner course detail panel
// - Plan export/import as JSON; share via URL hash; reset-plan button

import { usePlannerStore } from '@/store/plannerStore';
import CoursePalette from '@/components/CoursePalette';
import TermGrid from '@/components/TermGrid';

export default function Planner() {
  const terms = usePlannerStore((s) => s.terms);

  return (
    <div className="flex h-full overflow-hidden">
      <CoursePalette />

      <main className="flex flex-1 flex-col gap-4 overflow-auto p-4">
        <p className="rounded bg-yellow-100 px-3 py-2 text-sm text-yellow-800">
          This tool validates prerequisite ordering only. It does not check
          whether courses are offered in specific terms. Verify with the
          registrar.
        </p>

        <TermGrid terms={terms} />
      </main>
    </div>
  );
}
