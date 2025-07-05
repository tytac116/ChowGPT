import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-react'
import { Navigation } from './components/Navigation'
import { RestaurantFinder } from './components/RestaurantFinder'
import { ChatInterface } from './components/ChatInterface'
import { LandingPage } from './components/LandingPage'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { ThemeProvider } from './contexts/ThemeContext'
import { AppStateProvider } from './contexts/AppStateContext'

// Error Boundary Component for Authentication Issues
function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)
  const navigate = useNavigate()
  
  useEffect(() => {
    // Reset error state on location change
    setHasError(false)
  }, [])

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Error
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We encountered an issue with the sign-in process. Please try again.
          </p>
          <button
            onClick={() => {
              setHasError(false)
              navigate('/finder')
            }}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Continue to App
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function AuthenticatedApp() {
  const { signOut } = useAuth()
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Handle authentication success - redirect if on root
  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/finder', { replace: true })
    }
  }, [location.pathname, navigate])

  // Update page title based on current route
  useEffect(() => {
    const titles = {
      '/finder': 'Restaurant Finder - ChowGPT',
      '/chat': 'Chat Assistant - ChowGPT'
    }
    const title = titles[location.pathname as keyof typeof titles] || 'ChowGPT - AI Restaurant Finder'
    document.title = title
  }, [location.pathname])

  // Determine active tab based on current route
  const getActiveTab = (): 'finder' | 'chat' => {
    if (location.pathname.startsWith('/chat')) return 'chat'
    return 'finder'
  }

  const handleSignOut = async () => {
    try {
      // Clear all session storage on sign out
      sessionStorage.clear()
      localStorage.clear()
      setNavOpen(false)
      // Sign out from Clerk
      await signOut()
      // Force redirect to home page
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
      // Fallback: force reload to clear state
      window.location.reload()
    }
  }

  const toggleNav = () => {
    setNavOpen(!navOpen)
  }

  const handleTabChange = (tab: 'finder' | 'chat') => {
    setNavOpen(false) // Close nav on mobile after selection
    // Navigation will be handled by React Router
  }

  return (
    <AppStateProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <Navigation
          isOpen={navOpen}
          onToggle={toggleNav}
          activeTab={getActiveTab()}
          onTabChange={handleTabChange}
          onSignOut={handleSignOut}
        />

        {/* Main Content */}
        <main className="lg:ml-64 min-h-screen">
          <Routes>
            {/* Default redirect to finder */}
            <Route path="/" element={<Navigate to="/finder" replace />} />
            
            {/* Restaurant Finder */}
            <Route 
              path="/finder" 
              element={
                <div className="p-4 lg:p-8 pt-16 lg:pt-8">
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Restaurant Finder
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Discover amazing restaurants in Cape Town
                    </p>
                  </div>
                  <RestaurantFinder />
                </div>
              } 
            />
            
            {/* Chat Interface */}
            <Route 
              path="/chat" 
              element={
                <div className="h-screen pt-16 lg:pt-0">
                  <div className="p-4 lg:p-8 pb-0">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      Chat Assistant
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Ask me anything about restaurants and dining
                    </p>
                  </div>
                  <ChatInterface />
                </div>
              } 
            />

            {/* Catch-all route for unknown paths */}
            <Route path="*" element={<Navigate to="/finder" replace />} />
          </Routes>
        </main>
      </div>
    </AppStateProvider>
  )
}

function AppContent() {
  const { isLoaded, isSignedIn } = useAuth()
  const [authError, setAuthError] = useState(false)

  // Handle authentication errors
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Check if we're on a protected route
      const isProtectedRoute = window.location.pathname !== '/'
      if (isProtectedRoute) {
        setAuthError(true)
      }
    }
  }, [isLoaded, isSignedIn])

  // Show loading state while Clerk determines authentication status
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading ChowGPT...</p>
        </div>
      </div>
    )
  }

  // Handle authentication error
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to access ChowGPT
          </p>
          <button
            onClick={() => {
              setAuthError(false)
              window.location.href = '/'
            }}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Show landing page if not authenticated */}
      <SignedOut>
        <LandingPage />
      </SignedOut>

      {/* Show main app if authenticated */}
      <SignedIn>
        <AuthErrorBoundary>
          <AuthenticatedApp />
        </AuthErrorBoundary>
      </SignedIn>
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  )
}

export default App