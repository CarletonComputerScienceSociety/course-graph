import type { Course, Prereq } from '@/types/course';
import type { PlannerEntry } from '@/types/planner';

export interface Violation {
  courseCode: string;
  termId: string;
  message: string;
}

export type Plan = { termId: string; label: string; entries: PlannerEntry[] }[];

// Evaluates a prereq AST against the set of courses taken in strictly earlier terms.
// Returns { ok: boolean, violations: Violation[] } where violations contains only
// soft warnings (credits/raw nodes). Hard failures are signalled via ok: false.
function evaluatePrereq(
  prereq: Prereq,
  takenBefore: Set<string>,
  courseCode: string,
  termId: string,
): { ok: boolean; violations: Violation[] } {
  switch (prereq.kind) {
    case 'course':
      return { ok: takenBefore.has(prereq.code), violations: [] };

    case 'all': {
      const results = prereq.of.map((child) =>
        evaluatePrereq(child, takenBefore, courseCode, termId),
      );
      return {
        ok: results.every((r) => r.ok),
        violations: results.flatMap((r) => r.violations),
      };
    }

    case 'any': {
      const results = prereq.of.map((child) =>
        evaluatePrereq(child, takenBefore, courseCode, termId),
      );
      const anyOk = results.some((r) => r.ok);
      // When the `any` is satisfied, only propagate soft warnings from satisfied
      // branches. When it fails, propagate all (diagnostic info for the user).
      const violations = anyOk
        ? results.filter((r) => r.ok).flatMap((r) => r.violations)
        : results.flatMap((r) => r.violations);
      return { ok: anyOk, violations };
    }

    case 'credits':
      // TODO: implement credit-counting once we track grades/credits taken
      return {
        ok: true,
        violations: [
          {
            courseCode,
            termId,
            message: `credits-based prereq not yet evaluated (requires ${prereq.credits} credits)`,
          },
        ],
      };

    case 'raw':
      return {
        ok: true,
        violations: [
          {
            courseCode,
            termId,
            message: `prereq could not be parsed and was not evaluated: "${prereq.text}"`,
          },
        ],
      };
  }
}

// Pure validator: checks each course entry's prereq AST against courses placed in
// strictly earlier terms. elective and choose entries are skipped — they carry no
// prereq to validate. An unfilled elective slot does NOT satisfy any prereq.
// TODO: validate choose entries once credit-counting is implemented.
export function validatePlan(
  plan: Plan,
  coursesMap: Map<string, Course>,
): Violation[] {
  const allViolations: Violation[] = [];
  const takenBefore = new Set<string>();

  for (const term of plan) {
    for (const entry of term.entries) {
      if (entry.kind === 'elective' || entry.kind === 'choose') {
        // No prereq to validate for placeholder entries.
        continue;
      }

      const code = entry.code;
      const course = coursesMap.get(code);
      if (course === undefined) continue;

      if (course.prereq !== null) {
        const { ok, violations } = evaluatePrereq(
          course.prereq,
          takenBefore,
          code,
          term.termId,
        );
        allViolations.push(...violations);
        if (!ok) {
          allViolations.push({
            courseCode: code,
            termId: term.termId,
            message: `prerequisite not satisfied for ${code}`,
          });
        }
      }
    }

    // Course entries in this term become available as prereqs for all later terms.
    for (const entry of term.entries) {
      if (entry.kind === 'course') takenBefore.add(entry.code);
    }
  }

  return allViolations;
}
