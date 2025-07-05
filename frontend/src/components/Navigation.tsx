import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Sun, Moon, ChefHat, Search, MessageCircle, User, LogOut } from 'lucide-react'
import { useUser, UserButton } from '@clerk/clerk-react'
import { Button } from './ui/Button'
import { UserProfile } from './UserProfile'
import { useTheme } from '../contexts/ThemeContext'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Direct cn implementation to avoid import issues
const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

interface NavigationProps {
  isOpen: boolean
  onToggle: () => void
  activeTab: 'finder' | 'chat'
  onTabChange: (tab: 'finder' | 'chat') => void
  onSignOut?: () => void
}

export function Navigation({ isOpen, onToggle, activeTab, onTabChange, onSignOut }: NavigationProps) {
  const { theme, toggleTheme } = useTheme()
  const { user } = useUser()
  const navigate = useNavigate()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut()
    }
  }

  const handleNavigation = (path: string, tab: 'finder' | 'chat') => {
    navigate(path)
    onTabChange(tab) // This will close mobile nav
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg lg:hidden"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Navigation panel */}
      <nav className={cn(
        'fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <ChefHat className="h-6 w-6 text-primary-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                ChowGPT
              </h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              AI-Powered Restaurant Finder
            </p>
          </div>

          {/* User Profile Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 p-3 rounded-lg">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10",
                      userButtonPopoverCard: "z-50"
                    }
                  }}
                />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.fullName || user?.firstName || 'User'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.primaryEmailAddress?.emailAddress || 'Member'}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 p-4">
            <div className="space-y-2">
              <button
                onClick={() => handleNavigation('/finder', 'finder')}
                className={cn(
                  'w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors',
                  activeTab === 'finder'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <Search className="h-5 w-5" />
                <span className="font-medium">Restaurant Finder</span>
              </button>

              <button
                onClick={() => handleNavigation('/chat', 'chat')}
                className={cn(
                  'w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors',
                  activeTab === 'chat'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">Chat Assistant</span>
              </button>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="w-full justify-start space-x-3"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </Button>

            {/* Sign Out Button */}
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start space-x-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* User Profile Modal */}
      <UserProfile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSignOut={handleSignOut}
      />
    </>
  )
}