import { describe, it, expect } from 'vitest';
import { parsePrereq } from "./parsePrereq";

describe('parsePrereq', () => {
    it('returns null for empty string', () => {
        expect(parsePrereq("")).toBeNull();
    });

    it('parses a simple course', () => {
        expect(parsePrereq("COMP 2401")).toEqual({ kind: 'course', code: 'COMP 2401' });
    });

    it('parses course with min grade', () => {
        expect(parsePrereq("COMP 2401 with a minimum grade of C-")).toEqual({ kind: 'course', code: 'COMP 2401', minGrade: 'C-' });
    });

    it('parses grouped all/or example', () => {
        const raw = "COMP 2401 with a minimum grade of C-, (COMP 2404 or SYSC 3010 or SYSC 3110), and (COMP 2406 or SYSC 4504)";
        expect(parsePrereq(raw)).toEqual({
            kind: 'all',
            of: [
                { kind: 'course', code: 'COMP 2401', minGrade: 'C-' },
                { kind: 'any', of: [
                    { kind: 'course', code: 'COMP 2404' },
                    { kind: 'course', code: 'SYSC 3010' },
                    { kind: 'course', code: 'SYSC 3110' },
                ] },
                { kind: 'any', of: [
                    { kind: 'course', code: 'COMP 2406' },
                    { kind: 'course', code: 'SYSC 4504' },
                ] },
            ],
        });
    });

    it('falls back to raw for unparseable string', () => {
        const raw = "This is an unparseable prereq string.";
        expect(parsePrereq(raw)).toEqual({ kind: 'raw', text: raw });
    });

    it('handles nested parentheses with an overall min grade', () => {
        const raw = "(COMP 2401 or COMP 2402) with a minimum grade of B-";
        expect(parsePrereq(raw)).toEqual({
            kind: 'any',
            of: [
                { kind: 'course', code: 'COMP 2401', minGrade: 'B-' },
                { kind: 'course', code: 'COMP 2402', minGrade: 'B-' },
            ],
        });
    });

    it('falls back to raw if an unparseable part is within a nested group', () => {
        const raw = "(COMP 2401 or Unparseable Part) with a minimum grade of B-";
        expect(parsePrereq(raw)).toEqual({
            kind: 'any',
            of: [
                { kind: 'course', code: 'COMP 2401', minGrade: 'B-' },
                { kind: 'raw', text: 'Unparseable Part with a minimum grade of B-' },
            ],
        });
    });
});