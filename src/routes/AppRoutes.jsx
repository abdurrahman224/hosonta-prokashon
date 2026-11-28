import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './common/ProtectedRoute'
import { publicRoutes, commonDashboardRoutes, notFoundRoute } from './common/commonRoutes'
import adminRoutes from './admin/adminRoutes'
import moderatorRoutes from './moderator/moderatorRoutes'
import employeeRoutes from './employee/employeeRoutes'
import authorRoutes from './author/authorRoutes'
import userRoutes from './user/userRoutes'

const DashboardLayout = lazy(() => import('../components/dashboard/DashboardLayout'))
const PublicLiveChatPage = lazy(() => import('../pages/public/PublicLiveChatPage'))

function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-cream px-5 py-16 text-dark">
      লোড হচ্ছে...
    </div>
  )
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {publicRoutes}
        <Route path="/live-chat" element={<PublicLiveChatPage />} />
        <Route
          element={
            <ProtectedRoute
              allowedRoles={['admin', 'moderator', 'author', 'employee', 'user']}
            >
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {commonDashboardRoutes}
          {adminRoutes}
          {moderatorRoutes}
          {employeeRoutes}
          {authorRoutes}
          {userRoutes}
        </Route>
        {notFoundRoute}
      </Routes>
    </Suspense>
  )
}

export default AppRoutes
