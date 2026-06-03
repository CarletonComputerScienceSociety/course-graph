import { NavLink } from 'react-router-dom';

export default function Header() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'text-sm font-medium text-red-600'
      : 'text-sm text-gray-600 hover:text-gray-900';

  return (
    <header className="flex h-14 flex-none items-center gap-6 border-b border-gray-200 bg-white px-6">
      <span className="font-semibold text-gray-900">
        Carleton CS Course Graph
      </span>
      <nav className="flex gap-4">
        <NavLink to="/explorer" className={linkClass}>
          Explorer
        </NavLink>
        <NavLink to="/planner" className={linkClass}>
          Planner
        </NavLink>
      </nav>
    </header>
  );
}
