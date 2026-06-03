export type Edge = { from: string; to: string };

// Edge convention throughout: { from: requirer, to: required }.
// "A depends on B" is represented as { from: A, to: B }.

// All courses transitively required by `code` (BFS following from → to).
export function getAncestors(code: string, edges: Edge[]): Set<string> {
  const result = new Set<string>();
  const queue: string[] = [code];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of edges) {
      if (edge.from === current && !result.has(edge.to)) {
        result.add(edge.to);
        queue.push(edge.to);
      }
    }
  }

  return result;
}

// All courses that transitively require `code` (BFS following to → from).
export function getDescendants(code: string, edges: Edge[]): Set<string> {
  const result = new Set<string>();
  const queue: string[] = [code];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const edge of edges) {
      if (edge.to === current && !result.has(edge.from)) {
        result.add(edge.from);
        queue.push(edge.from);
      }
    }
  }

  return result;
}
