import { describe, it, expect } from 'vitest';
import { courses, courseList, prereqEdges } from '@/data/loadCourses';

describe('loadCourses', () => {
  it('loads every course in courses.json', () => {
    expect(courses.size).toBe(27);
    expect(courseList).toHaveLength(27);
    expect(courses.size).toBe(courseList.length);
  });

  it('keys every course by its code', () => {
    for (const c of courseList) {
      expect(courses.get(c.code)?.code, `missing ${c.code}`).toBe(c.code);
    }
  });

  it('builds one edge per course leaf in the prereq ASTs', () => {
    // Counts every `course` leaf across all prereq trees, including references to
    // courses not in our set (e.g. SYSC/MATH alternatives) — the Explorer filters
    // those out at render time, but they are still real edges here.
    expect(prereqEdges).toHaveLength(73);
  });

  it('COMP 3004 prereq is an all-node with 3 children', () => {
    const c = courses.get('COMP 3004');
    expect(c?.prereq?.kind).toBe('all');
    if (c?.prereq?.kind === 'all') {
      expect(c.prereq.of).toHaveLength(3);
    }
  });

  it('COMP 1405 has no prereqs', () => {
    expect(courses.get('COMP 1405')?.prereq).toBeNull();
  });
});
