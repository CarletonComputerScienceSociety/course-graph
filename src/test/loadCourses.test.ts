import { describe, it, expect } from 'vitest';
import { courses, courseList, prereqEdges } from '@/data/loadCourses';

describe('loadCourses', () => {
  it('loads exactly 8 courses', () => {
    expect(courses.size).toBe(8);
    expect(courseList).toHaveLength(8);
  });

  it('all expected codes are present', () => {
    const expected = [
      'COMP 1405',
      'COMP 1406',
      'COMP 1805',
      'COMP 2401',
      'COMP 2402',
      'COMP 2404',
      'COMP 2406',
      'COMP 3004',
    ];
    for (const code of expected) {
      expect(courses.has(code), `missing ${code}`).toBe(true);
    }
  });

  it('prereqEdges has correct count', () => {
    // 1406→1405(1) + 2401→1406(1) + 2402→2401(1)
    // + 2404→[2402,2401](2) + 2406→[2402,2401](2)
    // + 3004→[2401, 2404,SYSC3010,SYSC3110, 2406,SYSC4504](6) = 13
    expect(prereqEdges).toHaveLength(13);
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
