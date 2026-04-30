import {
  BarChart3,
  FileCheck2,
  LayoutDashboard,
  ShieldCheck,
  Users,
  UserSquare2,
  Wallet,
} from 'lucide-react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAppContext } from '../context/AppContext';

const adminRoutes = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, testId: 'admin-nav-dashboard' },
  { to: '/admin/claims', label: 'Claims', icon: <FileCheck2 size={18} />, testId: 'admin-nav-claims' },
  { to: '/admin/members', label: 'Members', icon: <Users size={18} />, testId: 'admin-nav-members' },
  { to: '/admin/reports', label: 'Reports', icon: <BarChart3 size={18} />, testId: 'admin-nav-reports' },
  { to: '/admin/staff', label: 'Staff', icon: <UserSquare2 size={18} />, testId: 'admin-nav-staff' },
  { to: '/admin/transactions', label: 'Transactions', icon: <Wallet size={18} />, testId: 'admin-nav-transactions' },
];

const routeMeta = {
  '/admin/dashboard': {
    title: 'Admin Dashboard',
    subtitle: 'Loyalty operations, claims, revenue, and airline performance at a glance.',
  },
  '/admin/claims': {
    title: 'Claim Review Queue',
    subtitle: 'Approve, reject, or request more information for pending claims.',
  },
  '/admin/members': {
    title: 'Member Management',
    subtitle: 'Search, review, add, edit, and remove loyalty members.',
  },
  '/admin/reports': {
    title: 'Reports',
    subtitle: 'Operational reporting placeholders for growth, claims, and revenue.',
  },
  '/admin/staff': {
    title: 'Staff Management',
    subtitle: 'Maintain staff records, roles, and airline domain validation.',
  },
  '/admin/transactions': {
    title: 'Transaction Management',
    subtitle: 'Review purchase, transfer, redemption, and claim-related transactions.',
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
