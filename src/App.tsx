import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Requisitions from './pages/Requisitions';
import Issues from './pages/Issues';
import Returns from './pages/Returns';
import Transfers from './pages/Transfers';
import Procurement from './pages/Procurement';
import Assets from './pages/Assets';
import Verification from './pages/Verification';
import Registers from './pages/Registers';
import Reports from './pages/Reports';
import Audit from './pages/Audit';
import Notifications from './pages/Notifications';
import Users from './pages/Users';
import Settings from './pages/Settings';
import type { ReactNode } from 'react';

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-slate-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <DataProvider>{children}</DataProvider>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/inventory" element={<Protected><Inventory /></Protected>} />
          <Route path="/requisition" element={<Protected><Requisitions /></Protected>} />
          <Route path="/issue" element={<Protected><Issues /></Protected>} />
          <Route path="/return" element={<Protected><Returns /></Protected>} />
          <Route path="/transfer" element={<Protected><Transfers /></Protected>} />
          <Route path="/procurement" element={<Protected><Procurement /></Protected>} />
          <Route path="/assets" element={<Protected><Assets /></Protected>} />
          <Route path="/verification" element={<Protected><Verification /></Protected>} />
          <Route path="/registers" element={<Protected><Registers /></Protected>} />
          <Route path="/reports" element={<Protected><Reports /></Protected>} />
          <Route path="/audit" element={<Protected><Audit /></Protected>} />
          <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
          <Route path="/users" element={<Protected><Users /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
