export type Prereq =
  | { kind: 'course'; code: string; minGrade?: string }
  | { kind: 'all'; of: Prereq[] }
  | { kind: 'any'; of: Prereq[] }
  | { kind: 'credits'; credits: number; from: Prereq[] } // "≥N credits from this set"
  | { kind: 'raw'; text: string }; // unparseable fallback

export interface Course {
  code: string; // e.g. "COMP 1405"
  title: string;
  credits: number; // e.g. 0.5
  description: string;
  prereq: Prereq | null;
  precludes: string[]; // course codes
}
