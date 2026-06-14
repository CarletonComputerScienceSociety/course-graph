import { describe, it, expect } from 'vitest';
import { parsePrereq } from './parsePrereq';
import courses from '@/data/courses.json';
import type { Course } from '@/types/course';

describe('parsePrereq', () => {
  it('returns null for empty or whitespace-only input', () => {
    expect(parsePrereq('')).toBeNull();
    expect(parsePrereq('   ')).toBeNull();
  });

  it('parses a single course', () => {
    expect(parsePrereq('COMP 2402')).toEqual({
      kind: 'course',
      code: 'COMP 2402',
    });
  });

  it('captures a minimum grade on a course', () => {
    expect(parsePrereq('COMP 2401 with a minimum grade of C-')).toEqual({
      kind: 'course',
      code: 'COMP 2401',
      minGrade: 'C-',
    });
  });

  it('recognizes 3- and 4-letter department codes', () => {
    expect(parsePrereq('BIT 2000')).toEqual({
      kind: 'course',
      code: 'BIT 2000',
    });
    expect(parsePrereq('ELEC 2607')).toEqual({
      kind: 'course',
      code: 'ELEC 2607',
    });
  });

  it('applies a trailing group grade to every course in the group', () => {
    expect(
      parsePrereq('(COMP 1006 or COMP 1406) with a minimum grade of C-'),
    ).toEqual({
      kind: 'any',
      of: [
        { kind: 'course', code: 'COMP 1006', minGrade: 'C-' },
        { kind: 'course', code: 'COMP 1406', minGrade: 'C-' },
      ],
    });
  });

  it('parses an AND of two OR-groups joined by a bare "and" (no comma)', () => {
    expect(
      parsePrereq(
        '(COMP 2404 or SYSC 3010 or SYSC 3110) and (COMP 2406 or SYSC 4504)',
      ),
    ).toEqual({
      kind: 'all',
      of: [
        {
          kind: 'any',
          of: [
            { kind: 'course', code: 'COMP 2404' },
            { kind: 'course', code: 'SYSC 3010' },
            { kind: 'course', code: 'SYSC 3110' },
          ],
        },
        {
          kind: 'any',
          of: [
            { kind: 'course', code: 'COMP 2406' },
            { kind: 'course', code: 'SYSC 4504' },
          ],
        },
      ],
    });
  });

  it('handles "either … or" with a nested AND group', () => {
    expect(
      parsePrereq(
        'COMP 1805 with a minimum grade of C-, and either COMP 2402 or (SYSC 2004 and SYSC 2100)',
      ),
    ).toEqual({
      kind: 'all',
      of: [
        { kind: 'course', code: 'COMP 1805', minGrade: 'C-' },
        {
          kind: 'any',
          of: [
            { kind: 'course', code: 'COMP 2402' },
            {
              kind: 'all',
              of: [
                { kind: 'course', code: 'SYSC 2004' },
                { kind: 'course', code: 'SYSC 2100' },
              ],
            },
          ],
        },
      ],
    });
  });

  it('handles "one of (…)" phrasing', () => {
    expect(
      parsePrereq(
        'COMP 2402 and one of (COMP 2804 or COMP 3805 or MATH 3825 or MATH 3855)',
      ),
    ).toEqual({
      kind: 'all',
      of: [
        { kind: 'course', code: 'COMP 2402' },
        {
          kind: 'any',
          of: [
            { kind: 'course', code: 'COMP 2804' },
            { kind: 'course', code: 'COMP 3805' },
            { kind: 'course', code: 'MATH 3825' },
            { kind: 'course', code: 'MATH 3855' },
          ],
        },
      ],
    });
  });

  it('uses standard precedence (AND binds tighter than OR) for unparenthesized clauses', () => {
    // "A and B or C" → (A AND B) OR C
    expect(parsePrereq('COMP 1405 and COMP 1406 or COMP 1805')).toEqual({
      kind: 'any',
      of: [
        {
          kind: 'all',
          of: [
            { kind: 'course', code: 'COMP 1405' },
            { kind: 'course', code: 'COMP 1406' },
          ],
        },
        { kind: 'course', code: 'COMP 1805' },
      ],
    });
  });

  it('treats semicolons as list separators', () => {
    expect(
      parsePrereq(
        'DATA 1517 or (STAT 1500 and STAT 2507); or permission of the Institute for Data Science.',
      ),
    ).toEqual({
      kind: 'any',
      of: [
        { kind: 'course', code: 'DATA 1517' },
        {
          kind: 'all',
          of: [
            { kind: 'course', code: 'STAT 1500' },
            { kind: 'course', code: 'STAT 2507' },
          ],
        },
        { kind: 'raw', text: 'permission of the Institute for Data Science' },
      ],
    });
  });

  it('strips parenthetical annotations that hold no course code', () => {
    expect(
      parsePrereq('SYSC 2100 and SYSC 3310 (may be taken concurrently)'),
    ).toEqual({
      kind: 'all',
      of: [
        { kind: 'course', code: 'SYSC 2100' },
        { kind: 'course', code: 'SYSC 3310' },
      ],
    });
  });

  it('keeps unparseable prose as a single raw node alongside real courses', () => {
    expect(
      parsePrereq(
        'COMP 1805 with a minimum grade of C-, or permission of the School of Computer Science',
      ),
    ).toEqual({
      kind: 'any',
      of: [
        { kind: 'course', code: 'COMP 1805', minGrade: 'C-' },
        { kind: 'raw', text: 'permission of the School of Computer Science' },
      ],
    });
  });

  it('falls back to a single raw node for fully unrecognizable input', () => {
    expect(parsePrereq('see the department for details')).toEqual({
      kind: 'raw',
      text: 'see the department for details',
    });
  });

  it('produces the AST stored in courses.json for COMP 3004', () => {
    const comp3004 = (courses as Course[]).find((c) => c.code === 'COMP 3004');
    const raw =
      'COMP 2401 with a minimum grade of C-, (COMP 2404 or SYSC 3010 or SYSC 3110) with a minimum grade of C-, and (COMP 2406 or SYSC 4504).';
    expect(parsePrereq(raw)).toEqual(comp3004!.prereq);
  });
});
