import {
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAppContext } from '../context/AppContext';

const adminRoutes = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, testId: 'admin-nav-dashboard' },
];

const routeMeta = {
  '/admin/dashboard': {
    title: 'Admin Dashboard',
    subtitle: 'Loyalty operations, claims, revenue, and airline performance at a glance.',
  },
};

export default function AdminLayout() {
  const { state, logout, resetState } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  if (state.session?.role !== 'staff') {
    return <Navigate to="/login" replace />;
  }

  const meta = routeMeta[location.pathname] || routeMeta['/admin/dashboard'];

  return (
    <div className="app-shell">
      <Sidebar
        brandSubtitle="Operations console"
        items={adminRoutes}
        footer={
          <div className="stack gap-xs">
            <span>{state.session.name}</span>
            <span className="footer-muted">
              <ShieldCheck size={14} />
              Staff access
            </span>
          </div>
        }
      />
      <div className="app-main">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          userLabel={state.session.name}
          onReset={resetState}
          onLogout={() => {
            logout();
            navigate('/login');
          }}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
