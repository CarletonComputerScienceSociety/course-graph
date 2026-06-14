import { useState, type FormEvent } from 'react';
import { courses } from '@/data/loadCourses';
import { usePlannerStore } from '@/store/plannerStore';
import type { PlannerEntry } from '@/types/planner';

interface Props {
  termId: string;
  label: string;
  entries: PlannerEntry[];
}

function normalize(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, ' ');
}

export default function TermCell({ termId, label, entries }: Props) {
  const { addCourse, removeEntry } = usePlannerStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const code = normalize(input);

    if (!courses.has(code)) {
      setError('Unknown course code');
      return;
    }

    addCourse(termId, code);
    setInput('');
    setError(null);
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-gray-300 p-3">
      <p className="text-sm font-semibold text-gray-800">{label}</p>

      <ul className="flex flex-col gap-1">
        {entries.map((entry, index) => {
          if (entry.kind !== 'course') {
            // TODO: render non-course entry kinds (ticket: planner visual redesign)
            return null;
          }
          return (
            <li
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <span>{entry.code}</span>
              <button
                onClick={() => removeEntry(termId, index)}
                className="ml-2 text-gray-400 hover:text-red-600"
                aria-label={`Remove ${entry.code}`}
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>

      <form onSubmit={submit} className="flex flex-col gap-1">
        <div className="flex gap-1">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            placeholder="e.g. COMP 1405"
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
          />
          <button
            type="submit"
            className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
          >
            Add
          </button>
        </div>
        {error !== null && <p className="text-xs text-red-600">{error}</p>}
      </form>
    </div>
  );
}
