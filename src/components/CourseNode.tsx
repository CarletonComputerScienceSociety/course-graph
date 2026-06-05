import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useExplorerStore } from '@/store/explorerStore';

export type CourseNodeData = { code: string; title: string };
export type CourseNodeType = Node<CourseNodeData>;

export default function CourseNode({ data }: NodeProps<CourseNodeType>) {
  const { selectedCourse, highlightedSet } = useExplorerStore();
  const dimmed = selectedCourse !== null && !highlightedSet.has(data.code);

  const year = data.code.charAt(5);

  const borderColour =
  year === "1" ? "border-green-500" :
  year === "2" ? "border-blue-500" :
  year === "3" ? "border-yellow-500" :
  year === "4" ? "border-red-500" :
  "border-gray-300";


  return (
    <div
      className={`flex flex-col justify-center rounded border ${borderColour} bg-white px-3 py-2 shadow-sm transition-opacity duration-150`}
      style={{ width: 180, height: 60, opacity: dimmed ? 0.25 : 1 }}
    >
      <Handle type="target" position={Position.Top} />
      <p className="truncate text-sm font-bold leading-tight text-gray-900">
        {data.code}
      </p>
      <p className="truncate text-xs leading-tight text-gray-500">{data.title}</p>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
