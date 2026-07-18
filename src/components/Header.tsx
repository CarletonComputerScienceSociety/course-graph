import { NavLink } from 'react-router-dom';
import { Network } from 'lucide-react';
import { CalendarDays } from 'lucide-react';


// Import Network, CalendarDays


export default function Header() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'flex items-center gap-1.5 text-sm font-medium text-red-600'
      : 'flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900';

  return (

    <header className="flex h-14 flex-none items-center gap-6 border-b border-gray-200 bg-white px-6">
      <span className="font-semibold text-gray-900">
        Carleton CS Course Graph
      </span>
      <nav className="flex items-center gap-6">
        <NavLink to="/explorer" className={linkClass}>
          <Network size={20}/> Explorer
        </NavLink>
        <NavLink to="/planner" className={linkClass}>
          <CalendarDays size={20}/> Planner
        </NavLink>
      </nav>
    </header>

  );
}
