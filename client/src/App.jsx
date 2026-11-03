import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

import HomePage from './pages/HomePage';
import AccommodationsPage from './pages/AccommodationsPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import FoodPage from './pages/FoodPage';
import FoodDetailPage from './pages/FoodDetailPage';
import RoommatesPage from './pages/RoommatesPage';
import RoommateDetailPage from './pages/RoommateDetailPage';
import RoommateProfilePage from './pages/RoommateProfilePage';
import AboutPage from './pages/AboutPage';
import ListYourPropertyPage from './pages/ListYourPropertyPage';
import NotFoundPage from './pages/NotFoundPage';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

import CustomerDashboardPage from './pages/dashboard/CustomerDashboardPage';
import SavedListingsPage from './pages/dashboard/SavedListingsPage';
import RoommateRequestsPage from './pages/dashboard/RoommateRequestsPage';
import ConnectionsPage from './pages/dashboard/ConnectionsPage';
import EnquiriesPage from './pages/dashboard/EnquiriesPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import SettingsPage from './pages/dashboard/SettingsPage';

import OwnerDashboardPage from './pages/dashboard/OwnerDashboardPage';
import OwnerListingsPage from './pages/dashboard/OwnerListingsPage';
import OwnerListingFormPage from './pages/dashboard/OwnerListingFormPage';

import ProviderDashboardPage from './pages/dashboard/ProviderDashboardPage';
import ProviderListingsPage from './pages/dashboard/ProviderListingsPage';
import ProviderListingFormPage from './pages/dashboard/ProviderListingFormPage';

import AdminDashboardPage from './pages/dashboard/AdminDashboardPage';
import AdminUsersPage from './pages/dashboard/AdminUsersPage';
import AdminListingsPage from './pages/dashboard/AdminListingsPage';
import AdminFoodPage from './pages/dashboard/AdminFoodPage';
import AdminReportsPage from './pages/dashboard/AdminReportsPage';
import AdminReviewsPage from './pages/dashboard/AdminReviewsPage';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="accommodations" element={<AccommodationsPage />} />
          <Route path="accommodations/:id" element={<PropertyDetailPage />} />
          <Route path="food" element={<FoodPage />} />
          <Route path="food/:id" element={<FoodDetailPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="list-your-property" element={<ListYourPropertyPage />} />
          <Route
            path="roommates"
            element={<ProtectedRoute><RoommatesPage /></ProtectedRoute>}
          />
          <Route
            path="roommates/profile"
            element={<ProtectedRoute><RoommateProfilePage /></ProtectedRoute>}
          />
          <Route
            path="roommates/:id"
            element={<ProtectedRoute><RoommateDetailPage /></ProtectedRoute>}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="reset-password/:token" element={<ResetPasswordPage />} />

        <Route
          path="dashboard"
          element={(
            <ProtectedRoute roles={['customer']}>
              <DashboardLayout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<CustomerDashboardPage />} />
          <Route path="saved" element={<SavedListingsPage />} />
          <Route path="requests" element={<RoommateRequestsPage />} />
          <Route path="connections" element={<ConnectionsPage />} />
          <Route path="enquiries" element={<EnquiriesPage mode="mine" />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route
          path="owner"
          element={(
            <ProtectedRoute roles={['owner']}>
              <DashboardLayout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<OwnerDashboardPage />} />
          <Route path="listings" element={<OwnerListingsPage />} />
          <Route path="listings/new" element={<OwnerListingFormPage />} />
          <Route path="listings/:id/edit" element={<OwnerListingFormPage />} />
          <Route path="enquiries" element={<EnquiriesPage mode="received" listingsPath="/owner/listings" />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route
          path="provider"
          element={(
            <ProtectedRoute roles={['food_provider']}>
              <DashboardLayout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<ProviderDashboardPage />} />
          <Route path="listings" element={<ProviderListingsPage />} />
          <Route path="listings/new" element={<ProviderListingFormPage />} />
          <Route path="listings/:id/edit" element={<ProviderListingFormPage />} />
          <Route path="enquiries" element={<EnquiriesPage mode="received" listingsPath="/provider/listings" />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route
          path="admin"
          element={(
            <ProtectedRoute roles={['admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="listings" element={<AdminListingsPage />} />
          <Route path="food" element={<AdminFoodPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  );
}
