import { useState } from 'react';

import { YEAR_COLOUR, YEAR_COLOUR_DEFAULT } from '@/components/CourseNode';

export default function ExplorerLegend() {
  const [open, setOpen] = useState(true);
  const div = 'flex flex-row gap-2';
  const colouredDiv = 'w-9 h-4 border-2 self-center rounded';

  return (
    <div className="text-sm absolute left-4 top-16 w-72 bg-white border border-gray-300 px-3 py-2 rounded-lg shadow-md z-1">
      <div className="flex gap-2">
        <button className="hover:text-red-600" onClick={() => setOpen(!open)}>
          {open ? '▲' : '▼'}
        </button>
        <p className="flex-1 font-semibold">Legend</p>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-t border-gray-300 pt-1 mt-2">
          {Object.entries(YEAR_COLOUR).map(([key, colour]) => (
            <div className={`${div}`}>
              <div className={`${colouredDiv} ${colour}`}></div>
              <p>{`Year ${key} (${key}000-level)`}</p>
            </div>
          ))}

          <div className={`${div}`}>
            <div className={`${colouredDiv} ${YEAR_COLOUR_DEFAULT}`}></div>
            <p>Other</p>
          </div>
        </div>
      )}
    </div>
  );
}
