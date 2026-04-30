import {
  CircleUserRound,
  ClipboardCheck,
  Gift,
  Home,
  Repeat2,
  WalletCards,
} from 'lucide-react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAppContext } from '../context/AppContext';

const memberRoutes = [
  { to: '/member/buy-miles', label: 'Buy Miles', icon: <WalletCards size={18} /> },
  { to: '/member/dashboard', label: 'Dashboard', icon: <Home size={18} /> },
  { to: '/member/claim', label: 'Claim Miles', icon: <ClipboardCheck size={18} /> },
  { to: '/member/identity', label: 'Identity Docs', icon: <CircleUserRound size={18} /> },
  { to: '/member/rewards', label: 'Rewards', icon: <Gift size={18} /> },
  { to: '/member/transfer', label: 'Transfer Miles', icon: <Repeat2 size={18} /> },
];

const routeMeta = {
  '/member/buy-miles': {
    title: 'Purchase Award Miles',
    subtitle: 'Select a package and post it into the mock wallet instantly.',
  },
  '/member/dashboard': {
    title: 'Member Dashboard',
    subtitle: 'Track balances, recent activity, and the next tier milestone.',
  },
  '/member/claim': {
    title: 'Claim Missing Miles',
    subtitle: 'Submit post-flight mileage claims with validation and tracking.',
  },
  '/member/identity': {
    title: 'Identity Documents',
    subtitle: 'Maintain travel documents and KTP lifetime validity settings.',
  },
  '/member/rewards': {
    title: 'Reward Catalog',
    subtitle: 'Browse, filter, inspect, and redeem AeroMiles partner rewards.',
  },
  '/member/transfer': {
    title: 'Transfer Award Miles',
    subtitle: 'Move miles to another member with balance protection.',
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
