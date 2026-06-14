import type { Prereq } from '@/types/course';

// Parses a Carleton prerequisite string (e.g. the `prereqRaw` field) into a
// `Prereq` AST. The strategy is a small recursive-descent parser: split a clause
// on its top-level operator while respecting parentheses, then parse each operand
// the same way. Anything it can't structure becomes a `{ kind: 'raw' }` node, so
// the caller degrades gracefully instead of throwing.

const GRADE_MARKER = ' with a minimum grade of ';
// Matches a course code anywhere in a string, e.g. "COMP 2401", "BIT 2000".
const HAS_COURSE_CODE = /[A-Z]{2,4}\s\d{4}/;

export function parsePrereq(raw: string): Prereq | null {
  if (raw == null || raw.trim() === '') return null;

  // Normalize a few calendar quirks before parsing.
  const text = raw
    .trim()
    .replace(/\.\s*$/, '') // drop the sentence-ending period
    .replace(/;/g, ',') // semicolons act as list separators
    // remove parenthetical notes that hold no course code, so the course in
    // front of them is still recognized, e.g. "SYSC 3310 (may be taken concurrently)"
    .replace(/\(([^()]*)\)/g, (group, inner: string) =>
      HAS_COURSE_CODE.test(inner) ? group : '',
    )
    // rephrase the calendar's alternate grade wording into the standard form,
    // e.g. "a grade of B or higher in MATH 2108" → "MATH 2108 with a minimum grade of B"
    .replace(
      /\b[Aa] grade of ([A-D][+-]?) or higher in ([A-Z]{2,4}\s\d{4})/g,
      '$2 with a minimum grade of $1',
    );

  return parseLevel(text);
}

// Parses one clause. Recursive: each operand of an AND/OR is parsed the same way,
// so arbitrary nesting falls out for free. Splitting goes commas → "or" → "and":
// OR binds looser than AND, so splitting it first makes it the outer node and
// gives standard precedence ("A and B or C" → (A AND B) OR C). The first
// separator that actually splits the clause decides whether it's `all` or `any`.
function parseLevel(s: string): Prereq {
  s = stripWrapping(s);

  // No course code at all → free-form prose (e.g. "permission of the School…").
  // Keep it whole as a single raw node rather than splitting it into fragments.
  if (!HAS_COURSE_CODE.test(s)) return { kind: 'raw', text: s };

  const commaParts = splitTop(s, ',');
  if (commaParts.length > 1) {
    // In a comma list the conjunction sits on the last item ("…, and X" / "…, or X").
    const last = commaParts[commaParts.length - 1];
    const kind = /^or\s/i.test(last) ? 'any' : 'all';
    const of = commaParts.map((p) =>
      parseLevel(p.replace(/^(and|or)\s+/i, '')),
    );
    return makeNode(kind, of);
  }

  const orParts = splitTop(s, ' or ');
  if (orParts.length > 1) return makeNode('any', orParts.map(parseLevel));

  const andParts = splitTop(s, ' and ');
  if (andParts.length > 1) return makeNode('all', andParts.map(parseLevel));

  return parseLeaf(s);
}

// Parses a single operand: a course code, optionally with a min grade, or a
// parenthesized group with a grade applied to the whole group.
function parseLeaf(s: string): Prereq {
  // Pull off a trailing "with a minimum grade of X" if present.
  let grade: string | undefined;
  let content = s;
  const markerAt = indexTop(s, GRADE_MARKER);
  if (markerAt !== -1) {
    grade = s.slice(markerAt + GRADE_MARKER.length).trim();
    content = s.slice(0, markerAt).trim();
  }

  const unwrapped = stripWrapping(content);
  let node: Prereq;
  if (unwrapped !== content) {
    // stripping parens revealed a group, e.g. "(A or B) with a minimum grade of C-"
    node = parseLevel(unwrapped);
  } else if (isCourseCode(unwrapped)) {
    node = { kind: 'course', code: unwrapped };
  } else {
    // not a recognizable course → preserve the original text verbatim
    return {
      kind: 'raw',
      text: grade ? content + GRADE_MARKER + grade : content,
    };
  }

  if (grade) attachGrade(node, grade);
  return node;
}

// Splits `s` on `separator`, but only at the top level — text inside parentheses
// is left alone. This is what lets "(A or B) and (C or D)" split on " and "
// without also splitting the inner " or "s.
function splitTop(s: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    else if (depth === 0 && s.startsWith(separator, i)) {
      parts.push(s.slice(start, i));
      i += separator.length - 1; // skip the rest of the separator
      start = i + 1;
    }
  }
  parts.push(s.slice(start));
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

// indexOf for `sub`, but only matches at the top level (outside any parentheses).
function indexTop(s: string, sub: string): number {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    else if (depth === 0 && s.startsWith(sub, i)) return i;
  }
  return -1;
}

// Strips leading "either"/"one of" filler and a matched pair of wrapping parens.
function stripWrapping(s: string): string {
  s = s.trim().replace(/^(either|one of)\s+/i, '');
  while (s.startsWith('(') && s.endsWith(')') && isBalanced(s.slice(1, -1))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function isBalanced(s: string): boolean {
  let depth = 0;
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')' && --depth < 0) return false;
  }
  return depth === 0;
}

// Builds an all/any node, flattening any children of the same kind
// (AND and OR are associative, so "[a AND [b AND c]]" becomes "[a AND b AND c]").
function makeNode(kind: 'all' | 'any', of: Prereq[]): Prereq {
  const flattened: Prereq[] = [];
  for (const child of of) {
    if ((child.kind === 'all' || child.kind === 'any') && child.kind === kind) {
      flattened.push(...child.of);
    } else {
      flattened.push(child);
    }
  }
  return { kind, of: flattened };
}

// Applies a min grade to every course in a node — used when a grade trails a
// group, e.g. "(COMP 2404 or SYSC 3010) with a minimum grade of C-". A course
// that already has its own grade keeps it.
function attachGrade(node: Prereq, grade: string): void {
  if (node.kind === 'course') {
    node.minGrade ??= grade;
  } else if (node.kind === 'all' || node.kind === 'any') {
    node.of.forEach((child) => attachGrade(child, grade));
  }
  // raw nodes are left untouched
}

// True for a bare course code like "COMP 2401" or "BIT 2000" (2–4 letter dept).
function isCourseCode(s: string): boolean {
  return /^[A-Z]{2,4}\s\d{4}$/.test(s.trim());
}
