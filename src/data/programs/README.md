# Program Templates

Each JSON file in this directory defines one `ProgramTemplate` (see `src/types/planner.ts`).
Templates are curated starting points that students can load into the planner and then
customize freely.

## Schema

```jsonc
{
  "id": "bcs-general", // kebab-case, unique across all templates
  "name": "BCS General", // display name shown in the dropdown
  "description": "Four-year BCS General stream, no specialization.",
  "validFor": "2025–2026 academic calendar",
  "lastReviewed": "2026-06", // ISO year-month of the most recent review
  "reviewer": "@github-handle", // GitHub handle of the curator who reviewed it
  "terms": [
    // exactly 8 elements, ordered Year 1 Fall → Year 4 Winter
    {
      "label": "Year 1 Fall",
      "entries": [
        { "kind": "course", "code": "COMP 1405" },
        { "kind": "elective", "category": "Breadth Elective" },
        {
          "kind": "choose",
          "credits": 0.5,
          "description": "0.5 credit from MATH 1xxx",
        },
      ],
    },
    // … 7 more terms
  ],
}
```

### Entry kinds

| kind       | fields                   | meaning                                     |
| ---------- | ------------------------ | ------------------------------------------- |
| `course`   | `code`                   | A specific required course                  |
| `elective` | `category`               | A free or category-restricted elective slot |
| `choose`   | `credits`, `description` | "Take N credits matching this description"  |

## Curation expectations

- **Must be reviewed** by someone with direct knowledge of the program requirements for
  the stated `validFor` year. Cross-check every required course against the official
  [Carleton undergraduate calendar](https://calendar.carleton.ca/undergrad/).
- **No template should be submitted without a reviewer.** The `reviewer` field is
  mandatory and must be a real GitHub handle.
- **Keep templates small.** Include required/core courses and clearly labelled elective
  slots. Do not pre-fill free elective slots with specific course suggestions — students
  should decide those.
- **Update `lastReviewed` and `validFor`** whenever you reverify a template against
  the current calendar year. Stale templates should be removed rather than left
  incorrect.
- **One file per program stream.** File name must match the template `id` field
  (e.g. `bcs-general.json`).

## Adding a new template

1. Create `src/data/programs/<id>.json` following the schema above.
2. `pnpm typecheck` — `loadPrograms.ts` picks up the file automatically via glob import.
3. Open the app and verify the template loads correctly via the "Start from template"
   dropdown (once that UI is built — see the TODO in `src/pages/Planner.tsx`).
4. Submit a PR with the `template` label and request review from another contributor
   who can verify the calendar accuracy.
