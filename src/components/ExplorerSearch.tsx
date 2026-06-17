import {useState,useRef,useEffect,useCallback,useMemo} from 'react';
import { courseList } from '@/data/loadCourses';
import { useExplorerStore } from '@/store/explorerStore';

const MAX_RESULTS = 8;

function normalize (s: string): string {
    return s.toLowerCase().replace(/\s+/g,'');
}

interface Result {
    code: string;
    title: string;

}

function search(query: string): Result[]{
    if(!query.trim()) return[];
    const q = normalize(query);
    const codePrefixMatches: Result[]=[];
    const otherMatches: Result[]=[];
    
    for(const course of courseList){
        const normCode=normalize(course.code);
        const normTitle = normalize(course.title);
        if(normCode.startsWith(q)){
            codePrefixMatches.push({code: course.code,title: course.title});
        }
        else if (normCode.includes(q)||normTitle.includes(q)){
            otherMatches.push({code: course.code,title:course.title});
        }
    }
    return [...codePrefixMatches,...otherMatches].slice(0,MAX_RESULTS)


}

export default function ExplorerSearch() {
  const { setSelectedCourse } = useExplorerStore();
  const [query, setQuery] = useState('');
  const results = useMemo(() => search(query), [query]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectResult = useCallback(
    (code: string) => {
      setSelectedCourse(code);
      setQuery('');
      setActiveIndex(-1);
    },
    [setSelectedCourse],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        selectResult(results[activeIndex].code);
      } else if (results.length === 1) {
        selectResult(results[0].code);
      }
    } else if (e.key === 'Escape') {
      setQuery('');
      inputRef.current?.blur();
    }
  }

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const open = results.length > 0;

  return (
    <div className="absolute left-4 top-4 z-10 w-72">
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1); }}
        onKeyDown={handleKeyDown}
        placeholder="Search courses…"
        aria-label="Search courses"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? 'explorer-search-results' : undefined}
        aria-activedescendant={
          activeIndex >= 0 ? `explorer-result-${activeIndex}` : undefined
        }
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
      {open && (
        <ul
          ref={listRef}
          id="explorer-search-results"
          role="listbox"
          className="mt-1 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {results.map((r, i) => (
            <li
              key={r.code}
              id={`explorer-result-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                selectResult(r.code);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === activeIndex
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium">{r.code}</span>
              <span className="ml-2 text-gray-500">— {r.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
