import { useState, type SyntheticEvent } from 'react';
import { courses } from '@/data/loadCourses';
import { usePlannerStore } from '@/store/plannerStore';
import type { PlannerEntry } from '@/types/planner';

interface Props {
  termId: string;
  index: number;
  entry: PlannerEntry | null;
}

function normalize(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, ' ');
}

// One course slot box. For now it's a typeable text field holding a course code;
// a later ticket turns it into a drag-and-drop target. The slot's positional
// identity is (termId, index) — committing writes through the store's setSlot.
export default function Slot({ termId, index, entry }: Props) {
  const setSlot = usePlannerStore((s) => s.setSlot);

  const filledCode = entry?.kind === 'course' ? entry.code : '';
  const [input, setInput] = useState(filledCode);
  const [error, setError] = useState<string | null>(null);

  // Re-sync the box when the committed code changes underneath us (e.g. a
  // template load or future drag-drop replaces the slot). Adjusting state during
  // render — React's recommended alternative to a syncing effect.
  const [lastFilled, setLastFilled] = useState(filledCode);
  if (filledCode !== lastFilled) {
    setLastFilled(filledCode);
    setInput(filledCode);
    setError(null);
  }

  // elective / choose entries aren't typeable yet (separate ticket). Render them
  // read-only so a future template's placeholder can't be silently overwritten.
  if (entry !== null && entry.kind !== 'course') {
    const label =
      entry.kind === 'elective' ? entry.category : entry.description;
    return (
      <div className="flex h-12 items-center rounded border border-dashed border-gray-300 bg-gray-50 px-2 text-xs text-gray-500 italic">
        {label}
      </div>
    );
  }

  function commit(e: SyntheticEvent) {
    e.preventDefault();
    const code = normalize(input);

    if (code === '') {
      if (filledCode !== '') setSlot(termId, index, null);
      setError(null);
      return;
    }

    if (!courses.has(code)) {
      setError('Unknown course code');
      return;
    }

    setSlot(termId, index, { kind: 'course', code });
    setInput(code);
    setError(null);
  }

  return (
    <form onSubmit={commit} className="flex h-12 flex-col justify-center">
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setError(null);
        }}
        onBlur={commit}
        placeholder="e.g. COMP 1405"
        aria-label={`Course slot ${index + 1}`}
        aria-invalid={error !== null}
        className={`w-full rounded border px-2 py-1 text-xs ${
          error !== null ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {error !== null && (
        <p className="px-1 text-[10px] text-red-600">{error}</p>
      )}
    </form>
  );
}
