import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ToastViewport from './components/ToastViewport';
import { AppProvider, useAppContext } from './context/AppContext';
import AdminLayout from './layouts/AdminLayout';
import MemberLayout from './layouts/MemberLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ClaimsPage from './pages/admin/ClaimsPage';
import MasterDataPage from './pages/admin/MasterDataPage';
import MembersPage from './pages/admin/MembersPage';
import ReportsPage from './pages/admin/ReportsPage';
import RewardsManagementPage from './pages/admin/RewardsManagementPage';
import StaffPage from './pages/admin/StaffPage';
import TransactionsPage from './pages/admin/TransactionsPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import BuyMilesPage from './pages/member/BuyMilesPage';
import ClaimPage from './pages/member/ClaimPage';
import IdentityPage from './pages/member/IdentityPage';
import MemberDashboardPage from './pages/member/MemberDashboardPage';
import RewardsPage from './pages/member/RewardsPage';
import TransferMilesPage from './pages/member/TransferMilesPage';

function AppRoutes() {
  const { toasts, removeToast } = useAppContext();

  return (
    <>
      <ToastViewport toasts={toasts} removeToast={removeToast} />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<MemberLayout />}>
            <Route path="/member/buy-miles" element={<BuyMilesPage />} />
            <Route path="/member/dashboard" element={<MemberDashboardPage />} />
            <Route path="/member/claim" element={<ClaimPage />} />
            <Route path="/member/identity" element={<IdentityPage />} />
            <Route path="/member/rewards" element={<RewardsPage />} />
            <Route path="/member/transfer" element={<TransferMilesPage />} />
          </Route>

          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/claims" element={<ClaimsPage />} />
            <Route path="/admin/master-data" element={<MasterDataPage />} />
            <Route path="/admin/members" element={<MembersPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/rewards-management" element={<RewardsManagementPage />} />
            <Route path="/admin/staff" element={<StaffPage />} />
            <Route path="/admin/transactions" element={<TransactionsPage />} />
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
