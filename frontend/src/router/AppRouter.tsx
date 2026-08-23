import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ListPage } from '../pages/notes/ListPage';
import { DetailPage } from '../pages/notes/DetailPage';
import { FormPage } from '../pages/notes/FormPage';
import { ProtectedRoute } from './ProtectedRoute';
import { VerifyEmailPage } from '../pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';

import { AppLayout } from '../components/layout/AppLayout';
import { LandingPage } from '../pages/public/LandingPage';
import { SettingsPage } from '../pages/settings/SettingsPage';

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/api/v1/auth/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/verify/:token" element={<VerifyEmailPage />} />
      <Route path="/api/v1/auth/verify/:token" element={<VerifyEmailPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<ListPage />} />
        <Route path="/notes" element={<ListPage />} />
        <Route path="/favorites" element={<ListPage />} />
        <Route path="/folders" element={<ListPage />} />
        <Route path="/tags" element={<ListPage />} />
        <Route path="/trash" element={<ListPage />} />
        <Route path="/notes/new" element={<FormPage />} />
        <Route path="/notes/:id" element={<DetailPage />} />
        <Route path="/notes/:id/edit" element={<FormPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
