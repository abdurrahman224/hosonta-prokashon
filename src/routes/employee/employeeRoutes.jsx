import { lazy } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '../common/ProtectedRoute';

const BooksView = lazy(
  () => import('../../pages/dashboard/employee/BooksView'),
);
const Orders = lazy(() => import('../../pages/dashboard/employee/Orders'));
const CounterOrders = lazy(
  () => import('../../pages/dashboard/employee/counterOrders/CounterOrders'),
);
const CounterOrderEntry = lazy(
  () =>
    import('../../pages/dashboard/employee/counterOrders/CounterOrderEntry'),
);
const StockManagement = lazy(
  () => import('../../pages/dashboard/employee/StockManagement'),
);
const CustomerMessages = lazy(
  () => import('../../pages/dashboard/employee/CustomerMessages'),
);
const AddBook = lazy(
  () => import('../../pages/dashboard/employee/AddBook'),
);
const BookDetailsDashboard = lazy(
  () => import('../../pages/dashboard/employee/BookDetailsDashboard'),
);

export const employeeRoutes = (
  <>
    <Route
      path="/dashboard/books"
      element={
        <ProtectedRoute allowedRoles={['admin', 'employee']}>
          <BooksView />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/books/new"
      element={
        <ProtectedRoute allowedRoles={['admin', 'employee', 'author']}>
          <AddBook />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/books/edit/:id"
      element={
        <ProtectedRoute allowedRoles={['admin', 'employee', 'author']}>
          <AddBook />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/books/:id"
      element={
        <ProtectedRoute allowedRoles={['admin', 'employee', 'author']}>
          <BookDetailsDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/counter-orders"
      element={
        <ProtectedRoute allowedRoles={['admin', 'employee']}>
          <CounterOrders />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/counter-orders/new"
      element={
        <ProtectedRoute allowedRoles={['admin', 'employee']}>
          <CounterOrderEntry />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/counter-order-entry"
      element={
        <ProtectedRoute allowedRoles={['admin', 'employee']}>
          <CounterOrderEntry />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/counter-sales"
      element={
        <ProtectedRoute allowedRoles={['admin', 'employee']}>
          <CounterOrders />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/orders"
      element={
        <ProtectedRoute allowedRoles={['admin', 'employee']}>
          <Orders />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/stock"
      element={
        <ProtectedRoute allowedRoles={['admin', 'employee']}>
          <StockManagement />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/messages"
      element={
        <ProtectedRoute allowedRoles={['admin', 'employee']}>
          <CustomerMessages />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/customer-messages"
      element={
        <ProtectedRoute allowedRoles={['admin', 'employee']}>
          <CustomerMessages />
        </ProtectedRoute>
      }
    />
  </>
);

export default employeeRoutes;
