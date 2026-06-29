import { seasonLabel, type Term } from '@/store/plannerStore';
import TermColumn from './TermColumn';

interface Props {
  terms: Term[];
}

const ORDINALS = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'];

function yearLabel(year: number): string {
  const ordinal = ORDINALS[year - 1];
  return ordinal ? `${ordinal} Year` : `Year ${year}`;
}

// Groups consecutive terms by year, preserving the earliest-first order. Each
// group drives one year header that spans its terms' columns.
function groupByYear(terms: Term[]): { year: number; terms: Term[] }[] {
  const groups: { year: number; terms: Term[] }[] = [];
  for (const term of terms) {
    const last = groups[groups.length - 1];
    if (last && last.year === term.year) last.terms.push(term);
    else groups.push({ year: term.year, terms: [term] });
  }
  return groups;
}

// Term-by-term grid: a year-header band on top, Fall/Winter sub-headers, then a
// column of slot boxes per term. Everything is derived from the `terms` array —
// no hardcoded term/year count. A single CSS grid (one track per term) keeps the
// year spans and the slot rows aligned across columns.
//
// TODO(ticket: planner legend) — a legend for connector-line / category-colour
// meaning belongs above this band once those features land.
export default function TermGrid({ terms }: Props) {
  const yearGroups = groupByYear(terms);

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-full gap-x-3 gap-y-2"
        style={{
          gridTemplateColumns: `repeat(${terms.length}, minmax(11rem, 1fr))`,
        }}
      >
        {/* Row 1 — year headers, each spanning its terms' columns. */}
        {yearGroups.map((group) => (
          <div
            key={group.year}
            className="rounded bg-gray-100 py-1 text-center text-xs font-semibold tracking-wide text-gray-700 uppercase"
            style={{ gridColumn: `span ${group.terms.length}` }}
          >
            {yearLabel(group.year)}
          </div>
        ))}

        {/* Row 2 — Fall/Winter (season) sub-headers, one per term. */}
        {terms.map((term) => (
          <div
            key={term.id}
            className="text-center text-xs font-medium text-gray-500"
          >
            {seasonLabel(term.season)}
          </div>
        ))}

        {/* Row 3 — one slot column per term. */}
        {terms.map((term) => (
          <TermColumn key={term.id} term={term} />
        ))}
      </div>
    </div>
  );
}
