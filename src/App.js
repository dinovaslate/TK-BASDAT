import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ToastViewport from './components/ToastViewport';
import { AppProvider, useAppContext } from './context/AppContext';
import AdminLayout from './layouts/AdminLayout';
import MemberLayout from './layouts/MemberLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import ClaimsPage from './pages/admin/ClaimsPage';
import MasterDataPage from './pages/admin/MasterDataPage';
import MembersPage from './pages/admin/MembersPage';
import ReportsPage from './pages/admin/ReportsPage';
import RewardsManagementPage from './pages/admin/RewardsManagementPage';
import StaffPage from './pages/admin/StaffPage';
import TransactionsPage from './pages/admin/TransactionsPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BuyMilesPage from './pages/member/BuyMilesPage';
import ClaimPage from './pages/member/ClaimPage';
import IdentityPage from './pages/member/IdentityPage';
import MemberDashboardPage from './pages/member/MemberDashboardPage';
import ProfileSettingsPage from './pages/member/ProfileSettingsPage';
import RewardsPage from './pages/member/RewardsPage';
import TransferMilesPage from './pages/member/TransferMilesPage';

const routerBasename = process.env.PUBLIC_URL
  ? new URL(process.env.PUBLIC_URL, window.location.origin).pathname.replace(/\/$/, '')
  : undefined;

function AppRoutes() {
  const { toasts, removeToast } = useAppContext();

  return (
    <>
      <ToastViewport toasts={toasts} removeToast={removeToast} />
      <BrowserRouter basename={routerBasename} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<MemberLayout />}>
            <Route path="/member/dashboard" element={<MemberDashboardPage />} />
            <Route path="/member/claim" element={<ClaimPage />} />
            <Route path="/member/buy-miles" element={<BuyMilesPage />} />
            <Route path="/member/transfer" element={<TransferMilesPage />} />
            <Route path="/member/rewards" element={<RewardsPage />} />
            <Route path="/member/identity" element={<IdentityPage />} />
            <Route path="/member/profile" element={<ProfileSettingsPage />} />
          </Route>

          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/members" element={<MembersPage />} />
            <Route path="/admin/staff" element={<StaffPage />} />
            <Route path="/admin/claims" element={<ClaimsPage />} />
            <Route path="/admin/transactions" element={<TransactionsPage />} />
            <Route path="/admin/master-data" element={<MasterDataPage />} />
            <Route path="/admin/rewards-management" element={<RewardsManagementPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/profile" element={<AdminProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
