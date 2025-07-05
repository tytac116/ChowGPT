import React from 'react'
import { ChefHat, RefreshCw, Home, AlertCircle } from 'lucide-react'

interface AuthFallbackProps {
  error?: string
  onRetry?: () => void
}

export function AuthFallback({ error, onRetry }: AuthFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleClearStorage = () => {
    localStorage.clear()
    sessionStorage.clear()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <ChefHat className="h-8 w-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              ChowGPT
            </h1>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Authentication Issue
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || "We're having trouble with the sign-in process. This usually happens when switching domains."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Go to Homepage</span>
          </button>

          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Page</span>
          </button>

          <button
            onClick={handleClearStorage}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span>Clear Cache & Try Again</span>
          </button>

          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full px-6 py-2 text-primary-600 hover:text-primary-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> We recently updated our domain to chowgpt.co.za. 
            If you're experiencing issues, please clear your browser cache or try signing in again.
          </p>
        </div>

        {/* Support */}
        <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
          Having persistent issues? The authentication system may need a few minutes to update.
        </div>
      </div>
    </div>
  )
} 