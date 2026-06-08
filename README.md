# Carleton CS Course Graph

An interactive prerequisite explorer and degree plan builder for Carleton University CS programs.

## Status

This is the starting scaffold for this project. The Explorer and Planner routes are functional; actual planner UI, program templates, drag-and-drop plan builder, and scraping the full course catalogue are all todos.

## Tech stack

Vite + React + TypeScript + Tailwind v4 + React Flow + pnpm 11.

## Prerequisites

- **Node.js 22** — install via [nvm](https://github.com/nvm-sh/nvm) (recommended) or directly from [nodejs.org](https://nodejs.org)
- **pnpm 11** — install via `npm install -g pnpm` or see [pnpm.io/installation](https://pnpm.io/installation)

If using nvm, the repo includes a `.nvmrc` so `nvm use` will select the right version automatically.

## Setup

```sh
# 1. Clone the repo
git clone https://github.com/CarletonComputerScienceSociety/course-graph.git
cd course-graph

# 2. Select the correct Node version (if using nvm)
nvm use

# 3. Install dependencies
pnpm install

# 4. Start the dev server
pnpm dev          # → http://localhost:5173/course-graph/
```

## Scripts

| Script           | What it does                           |
| ---------------- | -------------------------------------- |
| `pnpm dev`       | Start local dev server with hot reload |
| `pnpm build`     | Production build into `dist/`          |
| `pnpm test`      | Run Vitest test suite                  |
| `pnpm typecheck` | `tsc --noEmit` (strict, no emit)       |
| `pnpm format`    | Prettier write                         |

## Architecture

`src/data/courses.json` is the single source of truth for course data. `loadCourses.ts` reads it once at import time and exports a typed `Map<string, Course>`, a flat array, and pre-computed prerequisite edges. Both the Explorer and Planner routes consume these exports — no course data lives anywhere else. Zustand stores hold only UI state (selected node, highlighted set) and plan state (term assignments as arrays of `PlannerEntry`). Plans reference courses by code string so localStorage stays stable across data updates. `validatePlan` is a pure function that takes a plan and the course map and returns violations; it has no side effects and no React dependency.

## Project structure

```
src/
├── components/     Shared React components
│   ├── CourseNode.tsx      React Flow custom node with highlight/dim logic
│   ├── Header.tsx          Top nav bar with Explorer / Planner links
│   ├── TermCell.tsx        Single term cell in the Planner grid
│   └── ViolationList.tsx   Plain violation list rendered above the planner grid
├── data/           Static data and module-level loaders
│   ├── courses.json        Master course catalogue — single source of truth
│   ├── loadCourses.ts      Exports courseList, courses Map, prereqEdges
│   ├── loadPrograms.ts     Glob-imports program templates from programs/
│   ├── programs/           Curated ProgramTemplate JSON files (none yet — see README inside)
│   └── COURSES_README.md   Per-course verification status
├── lib/            Pure business logic (no React)
│   ├── graph.ts            getAncestors / getDescendants BFS over prereq edges
│   └── validatePlan.ts     Pure prereq validator; returns Violation[]
├── pages/          Route-level components
│   ├── Explorer.tsx        React Flow DAG with dagre layout and click-to-highlight
│   └── Planner.tsx         4×2 term grid with live validation
├── store/          Zustand stores
│   ├── explorerStore.ts    Selected course + highlighted set
│   └── plannerStore.ts     Term assignments, persisted to localStorage
├── test/           Vitest setup
│   └── setup.ts            @testing-library/jest-dom matchers
└── types/          Shared TypeScript types
    ├── course.ts           Course, Prereq discriminated union
    └── planner.ts          PlannerEntry, ProgramTemplate
```
