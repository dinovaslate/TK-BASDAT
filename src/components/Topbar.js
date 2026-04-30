import { Bell, LogOut, RefreshCcw } from 'lucide-react';

export default function Topbar({ title, subtitle, onLogout, onReset, userLabel }) {
  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">AeroTeams alliance operations</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="topbar-actions">
        <button type="button" className="button button-secondary icon-label">
          <Bell size={16} />
          Alerts
        </button>
        <button type="button" className="button button-secondary icon-label" onClick={onReset}>
          <RefreshCcw size={16} />
          Reset Demo
        </button>
        <div className="user-chip">{userLabel}</div>
        <button type="button" className="button button-primary icon-label" onClick={onLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
