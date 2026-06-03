import { describe, it, expect } from 'vitest';
import { getAncestors, getDescendants } from './graph';
import { prereqEdges } from '@/data/loadCourses';

describe('getAncestors', () => {
  it('includes direct and transitive prereqs of COMP 3004', () => {
    const ancestors = getAncestors('COMP 3004', prereqEdges);
    // COMP 2401 is a direct prereq; COMP 1405 is transitive (1405→1406→2401→3004)
    expect(ancestors.has('COMP 2401')).toBe(true);
    expect(ancestors.has('COMP 1405')).toBe(true);
  });
});

describe('getDescendants', () => {
  it('includes COMP 3004 as a transitive dependent of COMP 1405', () => {
    const descendants = getDescendants('COMP 1405', prereqEdges);
    expect(descendants.has('COMP 3004')).toBe(true);
  });
});
