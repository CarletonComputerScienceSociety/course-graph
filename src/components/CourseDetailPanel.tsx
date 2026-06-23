import type { Course } from '@/types/course';
import { useEffect, useRef } from 'react';

interface Props {
  course: Course | null;
  onClose: () => void;
}

// SCAFFOLD — contract + outline only.
//
// Prop-driven and page-agnostic on purpose: the same component is reused by the
// Explorer (wired today) and, later, the Planner. Each consumer supplies its own
// `course` / `onClose` — do NOT couple this to any store.
//
// This is intentionally skeletal. What's locked: the props contract, the
// open/close behaviour (renders nothing when `course` is null), and the drawer
// shell. Rendering the actual course fields and styling is in scope for the ticket.

export default function CourseDetailPanel({ course, onClose }: Props) {
  const panelRef = useRef<HTMLElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (course) {
      prevFocusRef.current = document.activeElement as HTMLElement;
      panelRef.current?.focus();
    } else {
      prevFocusRef.current?.focus();
      prevFocusRef.current = null;
    }
  }, [course]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (course === null) return null;

  return (
    <aside
      className="absolute inset-y-0 right-0 z-10 w-90 max-sm:w-5/6 overflow-y-auto border-l border-gray-200 bg-white p-4 shadow-lg"
      aria-label={`Details for ${course.code}`}
      ref={panelRef}
      tabIndex={-1}
    >
      <div className="flex items-start justify-between gap-2 border-b border-gray-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-red-600">
            {course.code} [{course.credits} credit]
          </h2>
          <p className="mt-1 text-base font-semibold text-gray-900">
            {course.title}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close course details"
          className="text-gray-400 hover:text-red-600"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 mt-4">
        {course.description && (
          <div>
            <h3 className="font-semibold">Description</h3>
            <p>{course.description}</p>
          </div>
        )}

        {course.precludes && course.precludes.length > 0 && (
          <div>
            <h3 className="font-semibold">Precludes</h3>
            <p>{course.precludes.join(', ')}</p>
          </div>
        )}

        {course.prereqRaw && (
          <div>
            <h3 className="font-semibold">Prerequisite(s)</h3>
            <p>{course.prereqRaw}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
