import type { Course, Prereq } from '@/types/course';
import rawCourses from './courses.json';

// Vite imports JSON natively; cast to Course[] since we own the schema.
export const courseList: Course[] = rawCourses as unknown as Course[];

// Primary lookup: code → Course.
export const courses: Map<string, Course> = new Map(
  courseList.map((c) => [c.code, c]),
);

// prereqEdges: one edge per leaf `course` node in each prereq AST.
// Convention: { from: requirer, to: required } — "from" depends on "to".
// `credits` and `raw` nodes are skipped here (TODO: handle when those prereq
// kinds are added to real course data).
function collectEdges(
  requirer: string,
  prereq: Prereq | null,
): { from: string; to: string }[] {
  if (prereq === null) return [];

  switch (prereq.kind) {
    case 'course':
      return [{ from: requirer, to: prereq.code }];
    case 'all':
    case 'any':
      return prereq.of.flatMap((child) => collectEdges(requirer, child));
    case 'credits':
      // TODO: extract edges from the `from` list when credits prereqs are used
      return [];
    case 'raw':
      // TODO: parse raw text to extract dependency codes
      return [];
  }
}

export const prereqEdges: { from: string; to: string }[] = courseList.flatMap(
  (c) => collectEdges(c.code, c.prereq),
);
