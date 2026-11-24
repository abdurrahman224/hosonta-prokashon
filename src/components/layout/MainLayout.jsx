import { Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Footer from './Footer'
import Navbar from './Navbar'
import { PageTransition } from '../common/Motion'
import SEO from '../common/SEO'
import AddedToCartModal from '../cart/AddedToCartModal'
import { useCart } from '../../context/useCart'

function MainLayout() {
  const { lastAdded, closeLastAdded } = useCart()
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="sr-only fixed left-4 top-4 z-[130] rounded-md bg-primary px-4 py-2 font-semibold text-dark focus:not-sr-only">
        মূল কনটেন্টে যান
      </a>
      <Navbar />
      <SEO />
      <main id="main-content" tabIndex="-1" className="flex-1 outline-none">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
        <AddedToCartModal
          isOpen={Boolean(lastAdded)}
          item={lastAdded}
          onClose={closeLastAdded}
        />
      <Footer />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "'Hind Siliguri', sans-serif",
            background: '#0A0A0A',
            color: '#FAF7F0',
            border: '1px solid #FDB82E',
            boxShadow: '0 12px 30px rgba(10, 10, 10, 0.22)',
          },
        }}
      />
    </div>
  )
}

export default MainLayout
