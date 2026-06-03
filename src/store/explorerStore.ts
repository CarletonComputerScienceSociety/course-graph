import { create } from 'zustand';
import { getAncestors, getDescendants } from '@/lib/graph';
import { prereqEdges } from '@/data/loadCourses';

interface ExplorerState {
  selectedCourse: string | null;
  highlightedSet: Set<string>;
  setSelectedCourse: (code: string | null) => void;
}

export const useExplorerStore = create<ExplorerState>((set) => ({
  selectedCourse: null,
  highlightedSet: new Set(),
  setSelectedCourse: (code) =>
    set({
      selectedCourse: code,
      highlightedSet:
        code === null
          ? new Set()
          : new Set([
              code,
              ...getAncestors(code, prereqEdges),
              ...getDescendants(code, prereqEdges),
            ]),
    }),
}));
