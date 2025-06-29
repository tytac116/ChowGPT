import React, { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { searchSuggestions } from '../data/mockRestaurants'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Direct cn implementation to avoid import issues
const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}
// Direct API implementation to avoid import issues
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  if (import.meta.env.DEV) {
    return 'http://localhost:3001/api'
  }
  
  return '/api'
}

const API_BASE_URL = getApiBaseUrl()

class ApiService {
  async searchRestaurants(request: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/search/restaurants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getRestaurantById(id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/restaurants/${id}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch restaurant: ${response.statusText}`)
    }

    return response.json()
  }

  async getSearchSuggestions(query: string): Promise<{ suggestions: string[] }> {
    const response = await fetch(`${API_BASE_URL}/search/suggestions?q=${encodeURIComponent(query)}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch suggestions: ${response.statusText}`)
    }

    return response.json()
  }
}

const apiService = new ApiService()

interface SearchBarProps {
  onSearch: (query: string) => void
  isLoading: boolean
  initialQuery?: string
}

// Cape Town specific search suggestions
const capeToWnSearchSuggestions = [
  'Beachfront dining with ocean views',
  'Romantic spots for date night',
  'Open late for dinner after 9pm',
  'Affordable meals under R300',
  'Family-friendly restaurants',
  'Best seafood in Cape Town',
  'Fine dining for special occasions',
  'Traditional African cuisine',
  'Wine estates with food',
  'Vegetarian-friendly options',
  'Japanese sushi restaurants',
  'Casual beach bars and cafes',
  'Garden restaurants with views',
  'Fresh fish at the harbour',
  'Rooftop dining with city views',
  'Pet-friendly restaurants',
  'Best brunch spots',
  'Halal restaurants',
  'Steakhouses and grills',
  'Craft beer and pub food'
]

export function SearchBar({ onSearch, isLoading, initialQuery = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [showSuggestions, setShowSuggestions] = useState(initialQuery.length === 0)
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([])

  useEffect(() => {
    setQuery(initialQuery)
    setShowSuggestions(initialQuery.length === 0)
  }, [initialQuery])

  useEffect(() => {
    setShowSuggestions(query.length === 0)
    
    // Try to fetch dynamic suggestions if query has content
    if (query.length > 2) {
      fetchDynamicSuggestions(query)
    }
  }, [query])

  const fetchDynamicSuggestions = async (searchQuery: string) => {
    try {
      const response = await apiService.getSearchSuggestions(searchQuery)
      if (response.suggestions && response.suggestions.length > 0) {
        setDynamicSuggestions(response.suggestions.slice(0, 6))
      }
    } catch (error) {
      // Silently fail - we'll use static suggestions
      console.log('Could not fetch dynamic suggestions:', error)
    }
  }

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
    setDynamicSuggestions([])
  }

  // Combine dynamic and static suggestions
  const suggestionsToShow = dynamicSuggestions.length > 0 
    ? [...dynamicSuggestions, ...capeToWnSearchSuggestions.slice(0, 12 - dynamicSuggestions.length)]
    : capeToWnSearchSuggestions.slice(0, 12)

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

      {/* Enhanced Suggestions */}
      {showSuggestions && (
        <div className="mt-6 animate-fade-in">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Try these popular searches:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestionsToShow.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm transition-colors",
                  index < (dynamicSuggestions.length || 0) 
                    ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800/40"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-300"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
          
          {/* Cape Town Context */}
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
            🏔️ Searching across 300+ Cape Town restaurants
          </div>
        </div>
      )}
    </div>
  )
}