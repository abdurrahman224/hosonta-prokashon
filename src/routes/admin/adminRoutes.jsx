import { lazy } from 'react'
import { Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../common/ProtectedRoute'

const UsersManagement = lazy(() => import('../../pages/dashboard/admin/UsersManagement'))
const AuthorManagement = lazy(() => import('../../pages/dashboard/admin/AuthorManagement'))
const TotalCost = lazy(() => import('../../pages/dashboard/admin/TotalCost'))
const Reports = lazy(() => import('../../pages/dashboard/admin/Reports'))
const DashboardSection = lazy(() => import('../../pages/dashboard/common/DashboardSection'))

export const adminRoutes = (
  <>
    <Route
      path="/dashboard/all-users"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Navigate to="/dashboard/all-users/authors" replace />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/all-users/authors"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AuthorManagement />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/all-users/authors/:id"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AuthorManagement />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/all-users/users"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <UsersManagement scope="users" />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/all-users/roles"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <UsersManagement scope="roles" />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/users"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Navigate to="/dashboard/all-users" replace />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/author-payouts"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Navigate to="/dashboard/authors?tab=payouts" replace />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/payouts"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Navigate to="/dashboard/authors?tab=payouts" replace />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/author-applications"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Navigate to="/dashboard/authors?tab=applications" replace />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/authors"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AuthorManagement />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/authors/:id"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AuthorManagement />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/total-cost"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <TotalCost />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/costs"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <TotalCost />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/magazine"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardSection title="Magazine" />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/reports"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Reports />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/settings"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardSection title="সেটিংস" />
        </ProtectedRoute>
      }
    />
  </>
)

export default adminRoutes
