import {
  Home,
} from 'lucide-react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAppContext } from '../context/AppContext';

const memberRoutes = [
  { to: '/member/dashboard', label: 'Dashboard', icon: <Home size={18} /> },
];

const routeMeta = {
  '/member/dashboard': {
    title: 'Member Dashboard',
    subtitle: 'Track balances, recent activity, and the next tier milestone.',
  },
};

export default function MemberLayout() {
  const { state, logout, resetState } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  if (state.session?.role !== 'member') {
    return <Navigate to="/login" replace />;
  }

  const meta = routeMeta[location.pathname] || routeMeta['/member/dashboard'];

  return (
    <div className="app-shell">
      <Sidebar
        brandSubtitle="Member portal"
        items={memberRoutes}
        footer={<span>{state.currentMember.memberNumber}</span>}
      />
      <div className="app-main">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          userLabel={`${state.currentMember.firstName} ${state.currentMember.lastName}`}
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
