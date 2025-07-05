import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, useAuth, useUser } from '@clerk/clerk-react'
import { Navigation } from './components/Navigation'
import { RestaurantFinder } from './components/RestaurantFinder'
import { ChatInterface } from './components/ChatInterface'
import { LandingPage } from './components/LandingPage'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { ThemeProvider } from './contexts/ThemeContext'
import { AppStateProvider } from './contexts/AppStateContext'

function AuthenticatedApp() {
  const { signOut } = useAuth()
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()

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
      setNavOpen(false)
      // Sign out from Clerk
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
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

            {/* Fallback for unknown routes */}
            <Route path="*" element={<Navigate to="/finder" replace />} />
          </Routes>
        </main>
      </div>
    </AppStateProvider>
  )
}

function AppContent() {
  const { isLoaded } = useAuth()

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

  return (
    <>
      {/* Show landing page if not authenticated */}
      <SignedOut>
        <LandingPage />
      </SignedOut>

      {/* Show main app if authenticated */}
      <SignedIn>
        <AuthenticatedApp />
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