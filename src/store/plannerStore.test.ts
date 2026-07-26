import { beforeEach, describe, it, expect } from 'vitest';
import {
  usePlannerStore,
  termLabel,
  seasonLabel,
  SLOTS_PER_TERM,
} from './plannerStore';
import type { ProgramTemplate } from '@/types/planner';

function freshStore() {
  // Reset to the default plan before each test (the persisted state is shared).
  usePlannerStore.persist.clearStorage();
  usePlannerStore.setState(usePlannerStore.getInitialState());
}

beforeEach(freshStore);

describe('plannerStore', () => {
  it('seeds each default term with SLOTS_PER_TERM empty slots, each with a unique id', () => {
    const terms = usePlannerStore.getState().terms;
    expect(terms.length).toBeGreaterThan(0);
    const allIds = new Set<string>();
    for (const term of terms) {
      expect(term.slots).toHaveLength(SLOTS_PER_TERM);
      expect(term.slots.every((s) => s.entry === null)).toBe(true);
      for (const slot of term.slots) {
        expect(typeof slot.id).toBe('string');
        allIds.add(slot.id);
      }
    }
    // Ids are unique across every slot in the whole plan.
    expect(allIds.size).toBe(terms.length * SLOTS_PER_TERM);
  });

  it('setSlot writes an entry at a positional (termId, index) without disturbing siblings or ids', () => {
    const { id } = usePlannerStore.getState().terms[0];
    const idsBefore = usePlannerStore
      .getState()
      .terms[0].slots.map((s) => s.id);

    usePlannerStore
      .getState()
      .setSlot(id, 2, { kind: 'course', code: 'COMP 1405' });

    const term = usePlannerStore.getState().terms.find((t) => t.id === id)!;
    expect(term.slots[2].entry).toEqual({ kind: 'course', code: 'COMP 1405' });
    expect(term.slots[0].entry).toBeNull();
    expect(term.slots[1].entry).toBeNull();
    expect(term.slots).toHaveLength(SLOTS_PER_TERM);
    // The slot keeps its stable id across a mutation — only `entry` changes.
    expect(term.slots.map((s) => s.id)).toEqual(idsBefore);
  });

  it('setSlot with null clears a filled slot', () => {
    const { id } = usePlannerStore.getState().terms[0];
    usePlannerStore
      .getState()
      .setSlot(id, 0, { kind: 'course', code: 'COMP 1405' });
    usePlannerStore.getState().setSlot(id, 0, null);
    expect(usePlannerStore.getState().terms[0].slots[0].entry).toBeNull();
  });

  it('setSlot is a no-op for an out-of-range index', () => {
    const { id, slots } = usePlannerStore.getState().terms[0];
    usePlannerStore
      .getState()
      .setSlot(id, 99, { kind: 'course', code: 'COMP 1405' });
    expect(usePlannerStore.getState().terms[0].slots).toEqual(slots);
  });

  it('loadTemplate places authored entries earliest-first and pads to SLOTS_PER_TERM', () => {
    const template: ProgramTemplate = {
      id: 't',
      name: 'Test',
      description: '',
      validFor: '',
      lastReviewed: '',
      reviewer: '',
      terms: [
        {
          year: 1,
          season: 'fall',
          entries: [
            { kind: 'course', code: 'COMP 1405' },
            { kind: 'elective', category: 'Breadth Elective' },
          ],
        },
      ],
    };
    usePlannerStore.getState().loadTemplate(template);

    const terms = usePlannerStore.getState().terms;
    expect(terms).toHaveLength(1);
    expect(terms[0].slots).toHaveLength(SLOTS_PER_TERM);
    expect(terms[0].slots[0].entry).toEqual({
      kind: 'course',
      code: 'COMP 1405',
    });
    expect(terms[0].slots[1].entry).toEqual({
      kind: 'elective',
      category: 'Breadth Elective',
    });
    expect(terms[0].slots[2].entry).toBeNull();
  });

  it('derives display labels from structured year/season', () => {
    const term = usePlannerStore.getState().terms[0];
    expect(termLabel(term)).toBe('Year 1 Fall');
    expect(seasonLabel('winter')).toBe('Winter');
  });
});
