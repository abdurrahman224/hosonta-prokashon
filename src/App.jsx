import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import ErrorBoundary from './components/common/ErrorBoundary'
import RouteProgress from './components/common/RouteProgress'
import ScrollToTop from './components/common/ScrollToTop'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <ScrollToTop />
        <RouteProgress />
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </MotionConfig>
    </BrowserRouter>
  )
}

export default App
