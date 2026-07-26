import { useState } from 'react';

import { YEAR_COLOUR, YEAR_COLOUR_DEFAULT } from '@/lib/yearColour';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ExplorerLegend() {
  const [open, setOpen] = useState(true);
  const rowClass = 'flex flex-row gap-2';
  const boxClass = 'w-9 h-4 border-2 self-center rounded';

  return (
    <div className="text-sm pointer-events-auto w-full bg-white border border-gray-300 px-3 py-2 rounded-lg shadow-md">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2"
      >
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        <span className="flex-1 text-left font-semibold">Legend</span>
      </button>

      {open && (
        <div className="flex flex-col gap-1 border-t border-gray-300 pt-1 mt-2">
          {Object.entries(YEAR_COLOUR).map(([key, colour]) => (
            <div className={rowClass} key={key}>
              <div className={`${boxClass} ${colour}`}></div>
              <p>{`Year ${key} (${key}000-level)`}</p>
            </div>
          ))}

          <div className={rowClass}>
            <div className={`${boxClass} ${YEAR_COLOUR_DEFAULT}`}></div>
            <p>Other</p>
          </div>
        </div>
      )}
    </div>
  );
}
