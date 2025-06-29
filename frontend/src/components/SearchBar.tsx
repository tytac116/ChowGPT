import React, { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { searchSuggestions } from '../data/mockRestaurants'
import { cn } from '../lib/utils'

interface SearchBarProps {
  onSearch: (query: string) => void
  isLoading: boolean
  initialQuery?: string
}

export function SearchBar({ onSearch, isLoading, initialQuery = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [showSuggestions, setShowSuggestions] = useState(initialQuery.length === 0)

  useEffect(() => {
    setQuery(initialQuery)
    setShowSuggestions(initialQuery.length === 0)
  }, [initialQuery])

  useEffect(() => {
    setShowSuggestions(query.length === 0)
  }, [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    onSearch(suggestion)
    setShowSuggestions(false)
  }

  const clearSearch = () => {
    setQuery('')
    setShowSuggestions(true)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe your perfect dining experience..."
            className={cn(
              "w-full pl-12 pr-12 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all",
              isLoading && "opacity-50"
            )}
            disabled={isLoading}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="mt-6 animate-fade-in">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Try these popular searches:
          </p>
          <div className="flex flex-wrap gap-2">
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}