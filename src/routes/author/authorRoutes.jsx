import { lazy } from 'react'
import { Route } from 'react-router-dom'
import ProtectedRoute from '../common/ProtectedRoute'

const MyBooks = lazy(() => import('../../pages/dashboard/author/MyBooks'))
const BookForm = lazy(() => import('../../pages/dashboard/author/BookForm'))
const AddBook = lazy(() => import('../../pages/dashboard/employee/AddBook'))
const ManuscriptSubmit = lazy(() => import('../../pages/dashboard/author/ManuscriptSubmit'))
const MyProfile = lazy(() => import('../../pages/dashboard/author/MyProfile'))
const MySales = lazy(() => import('../../pages/dashboard/author/MySales'))
const BookReviews = lazy(() => import('../../pages/dashboard/author/BookReviews'))
const PublishingTerms = lazy(() => import('../../pages/dashboard/author/PublishingTerms'))

export const authorRoutes = (
  <>
    <Route
      path="/dashboard/my-books"
      element={
        <ProtectedRoute allowedRoles={['author']}>
          <MyBooks />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/my-books/:id/edit"
      element={
        <ProtectedRoute allowedRoles={['author']}>
          <BookForm />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/books/new"
      element={
        <ProtectedRoute allowedRoles={['author', 'admin', 'employee']}>
          <AddBook />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/publishing-terms"
      element={
        <ProtectedRoute allowedRoles={['author']}>
          <PublishingTerms />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/manuscripts/new"
      element={
        <ProtectedRoute allowedRoles={['author']}>
          <ManuscriptSubmit />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/profile"
      element={
        <ProtectedRoute allowedRoles={['author']}>
          <MyProfile />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/sales"
      element={
        <ProtectedRoute allowedRoles={['author']}>
          <MySales />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/book-reviews"
      element={
        <ProtectedRoute allowedRoles={['author']}>
          <BookReviews />
        </ProtectedRoute>
      }
    />
  </>
)

export default authorRoutes
