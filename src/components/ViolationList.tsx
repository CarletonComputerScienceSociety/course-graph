import type { Violation } from '@/lib/validatePlan';

interface Props {
  violations: Violation[];
}

export default function ViolationList({ violations }: Props) {
  if (violations.length === 0) return null;

  return (
    <ul className="text-red-600">
      {violations.map((v, i) => (
        <li key={i}>{v.message}</li>
      ))}
    </ul>
  );
}
