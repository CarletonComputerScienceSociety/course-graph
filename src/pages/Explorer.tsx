// TODO — known gaps for future phases:
//   1. OR gateway nodes: currently draws one edge per OR alternative instead of
//      routing through a single gateway node (needed for COMP 3004's any-branches).
//   2. Exclusion (precludes) edges: not rendered yet.
//   3. SYSC course nodes: edges to SYSC 3010 / 3110 / 4504 are filtered out because
//      those courses are not in courses.json yet.
//   4. Search / filter by code or title.
//   5. Color-by-year-level.
//   6. Reachability filter (show only courses reachable from a given completed set).
//   7. Course detail sidebar on node click.

import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type NodeTypes,
  type Node,
  type Edge,
} from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import { courseList, courses, prereqEdges } from '@/data/loadCourses';
import { useExplorerStore } from '@/store/explorerStore';
import CourseNode from '@/components/CourseNode';
import type { CourseNodeData } from '@/components/CourseNode';
import CourseDetailPanel from '@/components/CourseDetailPanel';
import ExplorerSearch from '@/components/ExplorerSearch';

const NODE_W = 180;
const NODE_H = 60;

// Only draw edges where both endpoints are in our course set; SYSC courses that
// appear in COMP 3004's prereqs are not nodes yet (see TODO #3 above).
const knownCodes = new Set(courseList.map((c) => c.code));
const visibleEdges = prereqEdges.filter(
  (e) => knownCodes.has(e.from) && knownCodes.has(e.to),
);

function computeLayout(): {
  nodes: Node<CourseNodeData>[];
  edges: Edge[];
} {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 40 });

  for (const course of courseList) {
    g.setNode(course.code, { width: NODE_W, height: NODE_H });
  }

  for (const e of visibleEdges) {
    // prereqEdges: { from: requirer, to: required }
    // dagre TB: prerequisites sit above dependents, so dagre edge is required → requirer
    g.setEdge(e.to, e.from);
  }

  dagre.layout(g);

  const nodes: Node<CourseNodeData>[] = courseList.map((course) => {
    const pos = g.node(course.code);
    return {
      id: course.code,
      type: 'courseNode',
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
      data: { code: course.code, title: course.title },
    };
  });

  const edges: Edge[] = visibleEdges.map((e) => ({
    id: `${e.to}→${e.from}`,
    source: e.to, // prereq (higher rank)
    target: e.from, // dependent (lower rank)
  }));

  return { nodes, edges };
}

// Defined outside the component so React Flow never sees a new reference.
const nodeTypes: NodeTypes = { courseNode: CourseNode };

export default function Explorer() {
  const { selectedCourse, highlightedSet, setSelectedCourse } =
    useExplorerStore();

  // Layout is derived entirely from static import-time data; deps array is empty.
  const { nodes, edges: layoutEdges } = useMemo(() => computeLayout(), []);

  // Re-derive edge styles when selection changes.
  const edges = useMemo(
    () =>
      layoutEdges.map((e) => ({
        ...e,
        style: {
          opacity:
            selectedCourse === null ||
            (highlightedSet.has(e.source) && highlightedSet.has(e.target))
              ? 1
              : 0.25,
          transition: 'opacity 150ms',
        },
      })),
    [layoutEdges, selectedCourse, highlightedSet],
  );

  const selected =
    selectedCourse === null ? null : (courses.get(selectedCourse) ?? null);

  return (
    <div className="relative h-full w-full">
      <ExplorerSearch />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_e, node) => setSelectedCourse(node.id)}
        onPaneClick={() => setSelectedCourse(null)}
        fitView
        fitViewOptions={{ padding: 0.15 }}
      >
        <Background />
        <Controls />
      </ReactFlow>
      <CourseDetailPanel
        course={selected}
        onClose={() => setSelectedCourse(null)}
      />
    </div>
  );
}
