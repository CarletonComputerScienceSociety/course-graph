export type PlannerEntry =
  | { kind: 'course'; code: string }
  | { kind: 'elective'; category: string } // e.g. "Breadth Elective", "CS Elective"
  | { kind: 'choose'; credits: number; description: string }; // e.g. "0.5 credit from MATH 2000-level or above"

export interface ProgramTemplate {
  id: string; // e.g. "bcs-general"
  name: string; // e.g. "BCS General"
  description: string; // one-line summary shown in the dropdown
  validFor: string; // e.g. "2025–2026 academic calendar"
  lastReviewed: string; // ISO date, e.g. "2026-06"
  reviewer: string; // GitHub handle of curator, e.g. "@jacc"
  terms: { label: string; entries: PlannerEntry[] }[]; // 8 terms, ordered earliest first
}
