import type { ProgramTemplate } from '@/types/planner';

// Picks up any *.json files added to programs/ automatically — no code change needed.
const modules = import.meta.glob<{ default: ProgramTemplate }>(
  './programs/*.json',
  { eager: true },
);

export const programs: ProgramTemplate[] = Object.values(modules).map(
  (m) => m.default,
);
