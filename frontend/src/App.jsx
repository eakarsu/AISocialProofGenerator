import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useSidebar } from './context/SidebarContext'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Testimonials from './pages/Testimonials'
import CaseStudies from './pages/CaseStudies'
import Reviews from './pages/Reviews'
import SocialWidgets from './pages/SocialWidgets'
import SuccessMetrics from './pages/SuccessMetrics'
import CustomerQuotes from './pages/CustomerQuotes'
import VideoTestimonials from './pages/VideoTestimonials'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const { collapsed } = useSidebar()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className={`pt-14 lg:pt-0 min-h-screen transition-all duration-300 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-60'}`}>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/testimonials"
        element={
          <ProtectedRoute>
            <Testimonials />
          </ProtectedRoute>
        }
      />
      <Route
        path="/case-studies"
        element={
          <ProtectedRoute>
            <CaseStudies />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviews"
        element={
          <ProtectedRoute>
            <Reviews />
          </ProtectedRoute>
        }
      />
      <Route
        path="/social-widgets"
        element={
          <ProtectedRoute>
            <SocialWidgets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/success-metrics"
        element={
          <ProtectedRoute>
            <SuccessMetrics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer-quotes"
        element={
          <ProtectedRoute>
            <CustomerQuotes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/video-testimonials"
        element={
          <ProtectedRoute>
            <VideoTestimonials />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
