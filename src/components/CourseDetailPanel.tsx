import type { Course, Prereq } from '@/types/course';
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

function renderPrereq(node: Prereq, isRoot: boolean): React.ReactNode {
  switch (node.kind) {
    case 'course': {
      if (node.minGrade !== undefined) {
        return (
          <span className="break-words">
            {node.code} [Grade &ge; {node.minGrade}]
          </span>
        );
      }

      return <span className="break-words">{node.code}</span>;
    }

    case 'all': {
      if (node.of.length === 1) {
        return renderPrereq(node.of[0], false);
      }

      return (
        <>
          <p>{isRoot ? 'Complete all of the following: ' : 'All of: '}</p>
          <ul className="list-disc pl-5 space-y-1">
            {node.of.map((prereq: Prereq) => (
              <li>{renderPrereq(prereq, false)}</li>
            ))}
          </ul>
        </>
      );
    }

    case 'any': {
      if (node.of.length === 1) {
        return renderPrereq(node.of[0], false);
      }

      return (
        <>
          <p>{isRoot ? 'Complete any of the following: ' : 'Any of: '}</p>
          <ul className="list-disc pl-5 space-y-1">
            {node.of.map((prereq: Prereq) => (
              <li>{renderPrereq(prereq, false)}</li>
            ))}
          </ul>
        </>
      );
    }

    case 'credits': {
      return (
        <>
          <p>
            {isRoot
              ? `Complete ${node.credits} credit(s) from:`
              : `${node.credits} credit(s) from:`}
          </p>
          <ul className="list-disc pl-5 space-y-1">
            {node.from.map((prereq: Prereq) => (
              <li>{renderPrereq(prereq, false)}</li>
            ))}
          </ul>
        </>
      );
    }

    case 'raw': {
      return <span className="italic text-gray-500">{node.text}</span>;
    }

    default: {
      const _exhaustive: never = node;
      return _exhaustive;
    }
  }
}

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

        {course.prereqRaw && course.prereq && (
          <div>
            <h3 className="font-semibold mb-2">Prerequisite(s)</h3>
            <h4 className="font-semibold ml-3">Calendar text</h4>
            <p className="ml-6 mb-2">{course.prereqRaw}</p>
            {course.prereq.kind !== 'raw' && (
              <>
                <h4 className="font-semibold ml-3">Structured view</h4>
                <div className="ml-6">{renderPrereq(course.prereq, true)}</div>
              </>
            )}
          </div>
        )}

        {course.prereqRaw && (
          <div>
            <h3 className="font-semibold mb-2">Prerequisite(s)</h3>
            <h4 className="font-semibold ml-3">Calendar text</h4>
            <p className="ml-6 mb-2">{course.prereqRaw}</p>
          </div>
        )}

        {course.prereqRaw === '' && course.prereq === null && (
          <div>
            <h3 className="font-semibold">Prerequisite(s)</h3>
            <p className="ml-4">None</p>
          </div>
        )}
      </div>
    </aside>
  );
}
