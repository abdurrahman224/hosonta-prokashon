import { lazy } from 'react'
import { Navigate, Route, useParams } from 'react-router-dom'
import MainLayout from '../../components/layout/MainLayout'
import ProtectedRoute from './ProtectedRoute'

const Home = lazy(() => import('../../pages/public/Home/Home'))
const Books = lazy(() => import('../../pages/public/Books/Books'))
const BookDetails = lazy(() => import('../../pages/public/BookDetails'))
const Authors = lazy(() => import('../../pages/public/Authors/Authors'))
const AuthorProfile = lazy(() => import('../../pages/public/AuthorProfile'))
const Magazine = lazy(() => import('../../pages/public/Magazine/Magazine'))
const MagazinePost = lazy(() => import('../../pages/public/MagazinePost'))
const About = lazy(() => import('../../pages/public/About/About'))
const Contact = lazy(() => import('../../pages/public/Contact/Contact'))
const Categories = lazy(() => import('../../pages/public/Categories/Categories'))
const CategoryProfile = lazy(() => import('../../pages/public/Categories/CategoryProfile'))
const Cart = lazy(() => import('../../pages/public/Cart'))
const TrackOrder = lazy(() => import('../../pages/public/TrackOrder'))
const OrderSuccess = lazy(() => import('../../pages/public/OrderSuccess'))
const Checkout = lazy(() => import('../../pages/public/Checkout'))
const Login = lazy(() => import('../../pages/auth/Login'))
const Register = lazy(() => import('../../pages/auth/Register'))
const Unauthorized = lazy(() => import('../../pages/public/Unauthorized'))
const NotFound = lazy(() => import('../../pages/public/NotFound'))
const Dashboard = lazy(() => import('../../pages/dashboard/common/Dashboard'))

function LegacyMagazineRedirect() {
  const { id } = useParams()
  return <Navigate to={id ? `/magazine/${id}` : '/magazine'} replace />
}

export const publicRoutes = (
  <Route element={<MainLayout />}>
    <Route path="/" element={<Home />} />
    <Route path="/books" element={<Books />} />
    <Route path="/books/:id" element={<BookDetails />} />
    <Route path="/authors" element={<Authors />} />
    <Route path="/authors/:id" element={<AuthorProfile />} />
    <Route path="/categories" element={<Categories />} />
    <Route path="/categories/:name" element={<CategoryProfile />} />
    <Route path="/magazine" element={<Magazine />} />
    <Route path="/magazine/:id" element={<MagazinePost />} />
    <Route path="/blog" element={<Navigate to="/magazine" replace />} />
    <Route path="/blog/:id" element={<LegacyMagazineRedirect />} />
    <Route path="/about" element={<About />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/track-order" element={<TrackOrder />} />
    <Route path="/order-success/:id" element={<OrderSuccess />} />
    <Route
      path="/checkout"
      element={
        <ProtectedRoute allowedRoles={['admin', 'moderator', 'author', 'employee', 'user']}>
          <Checkout />
        </ProtectedRoute>
      }
    />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/unauthorized" element={<Unauthorized />} />
  </Route>
)

export const commonDashboardRoutes = (
  <>
    <Route path="/dashboard" element={<Navigate to="/dashboard/overview" replace />} />
    <Route path="/dashboard/overview" element={<Dashboard />} />
  </>
)

export const notFoundRoute = <Route path="*" element={<NotFound />} />
