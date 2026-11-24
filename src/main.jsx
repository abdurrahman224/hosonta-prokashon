import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { DataProvider } from './context/DataContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import ErrorBoundary from './components/common/ErrorBoundary'
import { HelmetProvider } from 'react-helmet-async'
import LoadingSpinner from './components/common/LoadingSpinner'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-cream text-dark">
            <LoadingSpinner label="লোড হচ্ছে..." />
          </div>
        }
      >
        <AuthProvider>
          <DataProvider>
            <CartProvider>
              <WishlistProvider>
                <ErrorBoundary>
                  <App />
                </ErrorBoundary>
              </WishlistProvider>
            </CartProvider>
          </DataProvider>
        </AuthProvider>
      </Suspense>
    </HelmetProvider>
  </StrictMode>,
)
