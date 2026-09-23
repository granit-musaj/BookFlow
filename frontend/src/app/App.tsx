import { Navigate, Route, Routes } from 'react-router-dom';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { BookingsPage } from '../features/bookings/BookingsPage';
import { ClientsPage } from '../features/clients/ClientsPage';
import { DashboardPage } from '../features/home/DashboardPage';
import { HomePage } from '../features/home/HomePage';
import { PublicBookingPage } from '../features/public/PublicBookingPage';
import { ServicesPage } from '../features/services/ServicesPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { StaffPage } from '../features/staff/StaffPage';
import { AppLayout } from './AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/b/:slug" element={<PublicBookingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
