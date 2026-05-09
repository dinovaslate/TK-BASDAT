import { NavLink } from 'react-router-dom';

export default function Sidebar({ brandSubtitle, items, footer }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">AM</span>
        <div>
          <strong>AeroMiles</strong>
          <span>{brandSubtitle}</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Sidebar">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            data-testid={item.testId}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">{footer}</div>
    </aside>
  );
}
