# courses.json — verification notes

courses.json is the single source of truth for all course data in this app.
The JSON schema is defined in `src/types/course.ts`.

## Verification status

| Course | Title | Prereq source | Status |
|---|---|---|---|
| COMP 1405 | Intro to CS I | prereq: null | TODO: verify against current calendar |
| COMP 1406 | Intro to CS II | requires COMP 1405 | TODO: verify against current calendar |
| COMP 1805 | Discrete Structures I | prereq: null | TODO: verify against current calendar |
| COMP 2401 | Systems Programming | requires COMP 1406 | TODO: verify against current calendar |
| COMP 2402 | ADTs and Algorithms | requires COMP 2401 | TODO: verify against current calendar |
| COMP 2404 | Software Engineering | requires COMP 2402 + COMP 2401 | TODO: verify against current calendar |
| COMP 2406 | Web Applications | requires COMP 2402 + COMP 2401 | TODO: verify against current calendar |
| COMP 3004 | OO Software Engineering | see below | Verified from Carleton calendar |

## COMP 3004 prereq (verified)

Taken directly from the Carleton undergraduate calendar:

```
COMP 2401 (min C-) AND
  (COMP 2404 (min C-) OR SYSC 3010 (min C-) OR SYSC 3110 (min C-)) AND
  (COMP 2406 OR SYSC 4504)
```

## Schema notes

- `credits`: Carleton uses 0.5 credit units for one-term courses, 1.0 for full-year.
- `precludes`: courses that cannot be taken if this course has already been taken (or vice versa). Currently empty for all entries — TODO verify preclusion rules from calendar.
- `prereq: null` means no prerequisites.
- `kind: "raw"` is a fallback for prereqs that couldn't be structured (none currently used).
- SYSC courses appear in COMP 3004's prereq tree but are not entries in this file; the graph helpers handle unknown codes gracefully.
