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

import { useMemo, useState, type FormEvent } from 'react';
import { usePlannerStore, termLabel, type Term } from '@/store/plannerStore';
import { courses } from '@/data/loadCourses';
import { validatePlan } from '@/lib/validatePlan';
import ViolationList from '@/components/ViolationList';
import type { PlannerEntry, Season } from '@/types/planner';

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

interface CourseRow {
  termId: string;
  course: PlannerEntry | null;
  index: number | null;
}

function createCourseRows(term: Term): CourseRow[] {
  const entries = term.entries;
  const rows = Array.from({ length: 5 }, (_, i) => {
    const entry = entries[i];
    return {
      termId: term.id,
      course: entry ?? null,
      index: entry ? i : null,
    };
  });

  return rows;
}

function SeasonColumn({ term }: { term: Term }) {
  const [courseRows, setCourseRows] = useState<CourseRow[]>(
    createCourseRows(term),
  );

  function updateRow(updatedRow: CourseRow, rowIndex: number) {
    setCourseRows((currentRows) =>
      currentRows.map((row, i) => (i === rowIndex ? updatedRow : row)),
    );
  }

  return (
    <div className="h-full flex-1 border border-gray-300">
      <h4 className="font-semibold text-lg text-center border-b border-gray-300">
        {term.season.toUpperCase()}
      </h4>

      <div className="flex flex-col gap-1">
        {courseRows.map((row, i) => (
          <CourseInput
            key={i}
            index={i}
            courseRow={row}
            term={term}
            onUpdate={updateRow}
          />
        ))}
      </div>
    </div>
  );
}

function CourseInput({
  index,
  courseRow,
  term,
  onUpdate,
}: {
  index: number;
  courseRow: CourseRow;
  term: Term;
  onUpdate: (row: CourseRow, index: number) => void;
}) {
  const { addCourse, removeEntry } = usePlannerStore();
  const [input, setInput] = useState(
    courseRow.course?.kind === 'course' ? courseRow.course.code : '',
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    const code = input.trim().toUpperCase().replace(/\s+/g, ' ');

    if (code === '' && courseRow.index !== null) {
      removeEntry(courseRow.termId, courseRow.index);
      onUpdate(
        {
          ...courseRow,
          course: null,
          index: null,
        },
        index,
      );
      return;
    }

    if (!courses.has(code)) {
      return;
    }

    if (courseRow.index) {
      removeEntry(courseRow.termId, courseRow.index);
    }

    addCourse(courseRow.termId, code);

    const updatedRow = {
      ...courseRow,
      course: term.entries[term.entries.length],
      index: term.entries.length,
    };

    onUpdate(updatedRow, index);
  }

  return (
    <div className="flex p-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            submit(e);
            e.currentTarget.blur();
          }
        }}
        onBlur={submit}
        placeholder="e.g. COMP 1405"
        className="flex-1 rounded border border-gray-300 px-2 py-1 text-base"
      />
    </div>
  );
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
        {grouping.map((yearGrouping, i) => (
          <div
            key={i}
            className="flex flex-col flex-1 rounded border border-gray-300"
          >
            <h3 className="font-bold text-xl text-center border-b border-gray-300 p-1">
              YEAR {yearGrouping.year}
            </h3>

            <div className="flex h-full flex-1 p-1 gap-1">
              {yearGrouping.seasons.map((seasonGrouping, i) => (
                <SeasonColumn key={i} term={seasonGrouping.term} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
