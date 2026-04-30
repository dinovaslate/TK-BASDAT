import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ToastViewport from './components/ToastViewport';
import { AppProvider, useAppContext } from './context/AppContext';
import AdminLayout from './layouts/AdminLayout';
import MemberLayout from './layouts/MemberLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import MemberDashboardPage from './pages/member/MemberDashboardPage';

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
            <Route path="/member/dashboard" element={<MemberDashboardPage />} />
          </Route>

          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
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
