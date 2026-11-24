import { lazy } from 'react'
import { Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../common/ProtectedRoute'

const AuthorManagement = lazy(() => import('../../pages/dashboard/admin/AuthorManagement'))
const ManuscriptReview = lazy(() => import('../../pages/dashboard/moderator/ManuscriptReview'))
const ReviewQueue = lazy(() => import('../../pages/dashboard/moderator/ReviewQueue'))
const ReviewModeration = lazy(() => import('../../pages/dashboard/moderator/ReviewModeration'))
const MagazineReview = lazy(() => import('../../pages/dashboard/moderator/MagazineReview'))
const MessageModeration = lazy(() => import('../../pages/dashboard/moderator/MessageModeration'))

export const moderatorRoutes = (
  <>
    <Route
      path="/dashboard/author-applications"
      element={
        <ProtectedRoute allowedRoles={['admin', 'moderator']}>
          <Navigate to="/dashboard/authors?tab=applications" replace />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/authors"
      element={
        <ProtectedRoute allowedRoles={['admin', 'moderator']}>
          <AuthorManagement />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/authors/:id"
      element={
        <ProtectedRoute allowedRoles={['admin', 'moderator']}>
          <AuthorManagement />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/manuscripts"
      element={
        <ProtectedRoute allowedRoles={['admin', 'moderator']}>
          <ManuscriptReview />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/book-review"
      element={
        <ProtectedRoute allowedRoles={['admin', 'moderator']}>
          <ReviewQueue />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/review-moderation"
      element={
        <ProtectedRoute allowedRoles={['admin', 'moderator']}>
          <ReviewModeration />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/magazine-review"
      element={
        <ProtectedRoute allowedRoles={['admin', 'moderator']}>
          <MagazineReview />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/message-moderation"
      element={
        <ProtectedRoute allowedRoles={['admin', 'moderator']}>
          <MessageModeration />
        </ProtectedRoute>
      }
    />
  </>
)

export default moderatorRoutes
