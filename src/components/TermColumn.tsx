import type { Term } from '@/store/plannerStore';
import Slot from './Slot';

interface Props {
  term: Term;
}

// One term's column of slot boxes. Renders off `term.slots` (never a global
// count) so a future "add slot" ticket that grows a single term's array works
// without touching this component. A later ticket makes this a DnD drop zone.
export default function TermColumn({ term }: Props) {
  return (
    <div className="flex flex-col gap-2">
      {/*
        Key on the slot's stable id, not its index: indices shift when a future
        remove-slot / reorder ticket moves slots, and an index key would reattach
        a box's local input/error state to the wrong row. setSlot is still
        index-addressed — the id is for identity, the index for mutation.
      */}
      {term.slots.map((slot, index) => (
        <Slot key={slot.id} termId={term.id} index={index} entry={slot.entry} />
      ))}
    </div>
  );
}
