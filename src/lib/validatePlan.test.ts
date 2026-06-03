import { describe, it, expect } from 'vitest';
import { validatePlan } from './validatePlan';
import type { Plan } from './validatePlan';
import { courses } from '@/data/loadCourses';

describe('validatePlan', () => {
  it('reports a violation when COMP 3004 is placed before its prereqs', () => {
    // COMP 3004 requires COMP 2401 (direct), COMP 2404|SYSC..., COMP 2406|SYSC...
    // Placing it in term 1 with nothing before it must produce at least one violation.
    const plan: Plan = [
      {
        termId: 't1',
        label: 'Year 1 Fall',
        entries: [{ kind: 'course', code: 'COMP 3004' }],
      },
    ];
    const violations = validatePlan(plan, courses);
    expect(violations.length).toBeGreaterThan(0);
    // The violation is attributed to COMP 3004; COMP 2401 is the root unmet prereq.
    expect(violations.some((v) => v.courseCode === 'COMP 3004')).toBe(true);
  });

  it('produces no violations when prereqs are satisfied in earlier terms', () => {
    // Full chain for COMP 3004:
    //   1405 → 1406 → 2401 → 2402 → 2404 (and 2406) → 3004
    const plan: Plan = [
      { termId: 't1', label: 'Year 1 Fall', entries: [{ kind: 'course', code: 'COMP 1405' }] },
      { termId: 't2', label: 'Year 1 Winter', entries: [{ kind: 'course', code: 'COMP 1406' }] },
      { termId: 't3', label: 'Year 2 Fall', entries: [{ kind: 'course', code: 'COMP 2401' }] },
      { termId: 't4', label: 'Year 2 Winter', entries: [{ kind: 'course', code: 'COMP 2402' }] },
      {
        termId: 't5',
        label: 'Year 3 Fall',
        entries: [
          { kind: 'course', code: 'COMP 2404' },
          { kind: 'course', code: 'COMP 2406' },
        ],
      },
      { termId: 't6', label: 'Year 3 Winter', entries: [{ kind: 'course', code: 'COMP 3004' }] },
    ];
    expect(validatePlan(plan, courses)).toHaveLength(0);
  });
});
