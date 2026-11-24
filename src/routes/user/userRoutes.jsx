import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from '../common/ProtectedRoute'

const MyOrders = lazy(() => import('../../pages/dashboard/user/MyOrders'))
const MyOrderDetails = lazy(() => import('../../pages/dashboard/user/MyOrderDetails'))
const Wishlist = lazy(() => import('../../pages/dashboard/user/Wishlist'))
const Addresses = lazy(() => import('../../pages/dashboard/user/Addresses'))
const MyReviews = lazy(() => import('../../pages/dashboard/user/MyReviews'))
const UserProfile = lazy(() => import('../../pages/dashboard/user/Profile'))
const BecomeAuthor = lazy(() => import('../../pages/dashboard/user/BecomeAuthor'))
const MagazineSubmit = lazy(() => import('../../pages/dashboard/user/MagazineSubmit'))

export const userRoutes = (
  <>
    <Route
      path="/dashboard/my-orders"
      element={
        <ProtectedRoute allowedRoles={['user']}>
          <MyOrders />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/my-orders/:id"
      element={
        <ProtectedRoute allowedRoles={['user']}>
          <MyOrderDetails />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/wishlist"
      element={
        <ProtectedRoute allowedRoles={['user']}>
          <Wishlist />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/addresses"
      element={
        <ProtectedRoute allowedRoles={['user']}>
          <Addresses />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/my-reviews"
      element={
        <ProtectedRoute allowedRoles={['user']}>
          <MyReviews />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/user-profile"
      element={
        <ProtectedRoute allowedRoles={['user']}>
          <UserProfile />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/become-author"
      element={
        <ProtectedRoute allowedRoles={['user']}>
          <BecomeAuthor />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/magazines/new"
      element={
        <ProtectedRoute allowedRoles={['user']}>
          <MagazineSubmit />
        </ProtectedRoute>
      }
    />
  </>
)

export default userRoutes
