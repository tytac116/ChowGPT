import React, { useState } from 'react'
import { Navigation } from './components/Navigation'
import { RestaurantFinder } from './components/RestaurantFinder'
import { ChatInterface } from './components/ChatInterface'
import { LandingPage } from './components/LandingPage'
import { ThemeProvider } from './contexts/ThemeContext'
import { AppStateProvider } from './contexts/AppStateContext'
import { useSessionStorage } from './hooks/useSessionStorage'

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useSessionStorage('chowgpt_authenticated', false)
  const [navOpen, setNavOpen] = useState(false)
  const [activeTab, setActiveTab] = useSessionStorage<'finder' | 'chat'>('chowgpt_active_tab', 'finder')

  const handleSignIn = () => {
    setIsAuthenticated(true)
  }

  const handleSignOut = () => {
    // Clear all session storage on sign out
    sessionStorage.clear()
    setIsAuthenticated(false)
    setNavOpen(false)
    setActiveTab('finder')
  }

  const toggleNav = () => {
    setNavOpen(!navOpen)
  }

  const handleTabChange = (tab: 'finder' | 'chat') => {
    setActiveTab(tab)
    setNavOpen(false) // Close nav on mobile after selection
  }

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return <LandingPage onSignIn={handleSignIn} />
  }

  return (
    <AppStateProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
        <Navigation
          isOpen={navOpen}
          onToggle={toggleNav}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onSignOut={handleSignOut}
        />

        {/* Main Content */}
        <main className="lg:ml-64 min-h-screen">
          {activeTab === 'finder' ? (
            <div className="p-4 lg:p-8 pt-16 lg:pt-8">
              <RestaurantFinder />
            </div>
          ) : (
            <div className="h-screen pt-16 lg:pt-0">
              <ChatInterface />
            </div>
          )}
        </main>
      </div>
    </AppStateProvider>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App