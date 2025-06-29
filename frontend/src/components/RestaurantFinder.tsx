import React, { useState } from 'react'
import { SearchBar } from './SearchBar'
import { RestaurantCard } from './RestaurantCard'
import { RestaurantModal } from './RestaurantModal'
import { FilterPanel } from './FilterPanel'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { SearchingAnimation } from './ui/TypeWriter'
import { useAppState } from '../contexts/AppStateContext'
import { Restaurant } from '../types/restaurant'
import { defaultFilterState } from '../types/filters'

// Direct utility implementation to avoid import issues
const predefinedMatchScores: Record<string, number> = {
  '1': 97, '2': 73, '3': 85, '4': 94, '5': 68, '6': 81, '7': 92, '8': 42, '9': 89, '10': 76, '11': 35, '12': 58,
}

const generateContextualMatchScore = (restaurantId: string, searchQuery?: string): number => {
  let baseScore = predefinedMatchScores[restaurantId] || 70
  
  if (searchQuery) {
    const queryLower = searchQuery.toLowerCase()
    let adjustment = 0
    
    if (queryLower.includes('fine dining')) {
      if (restaurantId === '1' || restaurantId === '4' || restaurantId === '7') adjustment += 3
      if (restaurantId === '8' || restaurantId === '11') adjustment -= 10
    }
    
    if (queryLower.includes('seafood')) {
      if (restaurantId === '3' || restaurantId === '6' || restaurantId === '10') adjustment += 5
      if (restaurantId === '5' || restaurantId === '8') adjustment -= 8
    }
    
    if (queryLower.includes('romantic')) {
      if (restaurantId === '1' || restaurantId === '4' || restaurantId === '9') adjustment += 4
      if (restaurantId === '8' || restaurantId === '11') adjustment -= 12
    }
    
    if (queryLower.includes('family')) {
      if (restaurantId === '3' || restaurantId === '2') adjustment += 6
      if (restaurantId === '1' || restaurantId === '7') adjustment -= 5
    }
    
    if (queryLower.includes('budget') || queryLower.includes('cheap')) {
      if (restaurantId === '2' || restaurantId === '3' || restaurantId === '8') adjustment += 8
      if (restaurantId === '1' || restaurantId === '4' || restaurantId === '7') adjustment -= 15
    }
    
    if (queryLower.includes('expensive') || queryLower.includes('luxury')) {
      if (restaurantId === '1' || restaurantId === '4' || restaurantId === '7') adjustment += 5
      if (restaurantId === '8' || restaurantId === '11' || restaurantId === '12') adjustment -= 10
    }
    
    baseScore = Math.min(99, Math.max(20, baseScore + adjustment))
  }
  
  return baseScore
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

interface BackendSearchRequest {
  query: string
  filters?: {
    cuisine?: string[]
    priceRange?: {
      min?: number
      max?: number
    }
    location?: string
    rating?: number
    features?: string[]
  }
  limit?: number
}

interface BackendRestaurant {
  placeId: string
  name: string
  cuisine: string[]
  location: string | { lat: number; lng: number }
  description?: string
  rating?: number
  priceLevel?: string
  features: string[]
  aiMatchScore: number
  vectorScore: number
  keywordScore: number
  llmScore: number
  llmReasoning: string
  reviewSummary: string
  operatingHours?: string
  parkingInfo?: string
  reviews?: any[]
  phone?: string
  website?: string
  address?: string
  neighborhood?: string
  categories?: string[]
  totalScore?: number
  reviewsCount?: number
  imageUrls?: string[]
  images?: string[]
  openingHours?: any[]
}

class ApiService {
  async searchRestaurants(request: BackendSearchRequest): Promise<any> {
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

function convertPriceToRands(priceLevel?: string): string {
  if (!priceLevel) return 'R150-300'
  
  switch (priceLevel) {
    case '$': return 'R100-200'
    case '$$': return 'R200-400'
    case '$$$': return 'R400-800'
    case '$$$$': return 'R800-1500'
    default: return priceLevel.includes('R') ? priceLevel : 'R150-300'
  }
}

function extractLocationString(location: string | { lat: number; lng: number }): string {
  if (typeof location === 'string') return location
  if (location && typeof location === 'object') return 'Cape Town'
  return 'Cape Town'
}

function getDefaultImages(): string[] {
  return []
}

function transformOpeningHours(openingHours?: any[]): any {
  if (!openingHours || !Array.isArray(openingHours)) {
    return {
      monday: '09:00 - 22:00',
      tuesday: '09:00 - 22:00', 
      wednesday: '09:00 - 22:00',
      thursday: '09:00 - 22:00',
      friday: '09:00 - 23:00',
      saturday: '09:00 - 23:00',
      sunday: '10:00 - 21:00'
    }
  }

  const hours: any = {}
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  days.forEach((day, index) => {
    const dayData = openingHours.find(h => h.day?.toLowerCase() === day)
    hours[day] = dayData?.hours || '09:00 - 22:00'
  })

  return hours
}

function transformReviews(reviews: any[]): any[] {
  return reviews.slice(0, 5).map((review, index) => ({
    id: review.reviewId || `review-${index}`,
    author: review.reviewerName || review.author || 'Anonymous',
    rating: review.rating || 4,
    text: review.text || review.review || 'Great experience!',
    date: review.publishedAtDate || review.date || new Date().toISOString().split('T')[0],
    helpful: review.helpful || Math.floor(Math.random() * 20)
  }))
}

function transformBackendRestaurant(backendRestaurant: BackendRestaurant): any {
  return {
    id: backendRestaurant.placeId,
    title: backendRestaurant.name,
    categoryName: Array.isArray(backendRestaurant.cuisine) ? backendRestaurant.cuisine[0] : backendRestaurant.cuisine,
    categories: Array.isArray(backendRestaurant.cuisine) ? backendRestaurant.cuisine : [backendRestaurant.cuisine],
    totalScore: backendRestaurant.rating || backendRestaurant.aiMatchScore / 20,
    reviewsCount: backendRestaurant.reviewsCount || (backendRestaurant.reviews?.length || 0),
    price: convertPriceToRands(backendRestaurant.priceLevel),
    address: backendRestaurant.address || '',
    neighborhood: backendRestaurant.neighborhood || extractLocationString(backendRestaurant.location),
    reviewsTags: backendRestaurant.features || [],
    imagesCount: backendRestaurant.images?.length || backendRestaurant.imageUrls?.length || 0,
    imageUrls: backendRestaurant.images || backendRestaurant.imageUrls || [],
    phone: backendRestaurant.phone,
    website: backendRestaurant.website,
    openingHours: transformOpeningHours(backendRestaurant.openingHours),
    serviceOptions: backendRestaurant.features || [],
    highlights: backendRestaurant.features || [],
    offerings: backendRestaurant.features || [],
    accessibility: [],
    reviews: transformReviews(backendRestaurant.reviews || []),
    aiMatchScore: backendRestaurant.aiMatchScore,
    vectorScore: backendRestaurant.vectorScore,
    keywordScore: backendRestaurant.keywordScore,
    llmScore: backendRestaurant.llmScore,
    llmReasoning: backendRestaurant.llmReasoning,
  }
}

export function RestaurantFinder() {
  const {
    searchQuery,
    setSearchQuery,
    restaurants,
    setRestaurants,
    filteredRestaurants,
    setFilteredRestaurants,
    hasSearched,
    setHasSearched,
    filters,
    setFilters,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    selectedRestaurant,
    setSelectedRestaurant
  } = useAppState()

  const [isLoading, setIsLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchMetadata, setSearchMetadata] = useState<any>(null)

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setHasSearched(true)
    setSearchQuery(query)
    setSearchError(null)
    
    try {
      console.log('🔍 Searching for:', query)
      
      const searchRequest: BackendSearchRequest = {
        query: query.trim(),
        limit: 9,
        filters: {
          // Map frontend filters to backend format if needed
          ...(filters.selectedCategories.length > 0 && { cuisine: filters.selectedCategories }),
          ...(filters.minRating > 0 && { rating: filters.minRating }),
          ...(filters.selectedNeighborhoods.length > 0 && { location: filters.selectedNeighborhoods[0] }),
          ...(filters.selectedFeatures.length > 0 && { features: filters.selectedFeatures }),
        }
      }

      // Call real backend API
      const searchResponse = await apiService.searchRestaurants(searchRequest)
      
      console.log('✅ Search response:', searchResponse)
      setSearchMetadata(searchResponse.data.searchMetadata)
    
      // Transform backend restaurants to frontend format
      const transformedRestaurants = searchResponse.data.restaurants.map(transformBackendRestaurant)
      
      setRestaurants(transformedRestaurants)
      setFilteredRestaurants(transformedRestaurants)

      console.log(`🎯 Found ${transformedRestaurants.length} restaurants`)
      
    } catch (error) {
      console.error('❌ Search failed:', error)
      setSearchError(error instanceof Error ? error.message : 'Search failed. Please try again.')
      setRestaurants([])
      setFilteredRestaurants([])
    } finally {
    setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...restaurants]

    // Apply category filter
    if (filters.selectedCategories.length > 0) {
      filtered = filtered.filter(restaurant =>
        filters.selectedCategories.some(category =>
          restaurant.categories.includes(category) || restaurant.categoryName === category
        )
      )
    }

    // Apply price range filter - Updated for South African Rands
    if (filters.selectedPriceRanges.length > 0) {
      filtered = filtered.filter(restaurant => {
        const price = restaurant.price
        return filters.selectedPriceRanges.some(range => {
          switch (range) {
            case 'Under R150':
              return price.includes('R100') || price.includes('R120') || price.includes('R80') || price.includes('R50')
            case 'R150-300':
              return price.includes('R150') || price.includes('R180') || price.includes('R200') || price.includes('R300')
            case 'R300-500':
              return price.includes('R300') || price.includes('R400') || price.includes('R450') || price.includes('R500')
            case 'R500-800':
              return price.includes('R500') || price.includes('R600') || price.includes('R700') || price.includes('R800')
            case 'R800+':
              return price.includes('R800') || price.includes('R1000') || price.includes('R1200') || price.includes('R1500')
            default:
              return true
          }
        })
      })
    }

    // Apply rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(restaurant => restaurant.totalScore >= filters.minRating)
    }

    // Apply neighborhood filter
    if (filters.selectedNeighborhoods.length > 0) {
      filtered = filtered.filter(restaurant =>
        filters.selectedNeighborhoods.includes(restaurant.neighborhood)
      )
    }

    // Apply features filter
    if (filters.selectedFeatures.length > 0) {
      filtered = filtered.filter(restaurant =>
        filters.selectedFeatures.some(feature =>
          restaurant.reviewsTags.includes(feature) ||
          restaurant.highlights.includes(feature) ||
          restaurant.offerings.includes(feature) ||
          restaurant.serviceOptions.includes(feature)
        )
      )
    }

    // Apply open now filter (mock implementation)
    if (filters.openNow) {
      const currentHour = new Date().getHours()
      filtered = filtered.filter(restaurant => {
        // Simple mock logic - assume most restaurants are open 11-22
        return currentHour >= 11 && currentHour <= 22
      })
    }

    // Apply sorting - Updated to include AI match scoring
    switch (filters.sortBy) {
      case 'ai-match':
        filtered.sort((a, b) => {
          // Use real AI match scores if available, otherwise fall back to contextual scoring
          const scoreA = (a as any).aiMatchScore || generateContextualMatchScore(a.id, searchQuery)
          const scoreB = (b as any).aiMatchScore || generateContextualMatchScore(b.id, searchQuery)
          return scoreB - scoreA
        })
        break
      case 'rating':
        filtered.sort((a, b) => b.totalScore - a.totalScore)
        break
      case 'price-low':
        filtered.sort((a, b) => {
          const priceA = parseInt(a.price.match(/\d+/)?.[0] || '0')
          const priceB = parseInt(b.price.match(/\d+/)?.[0] || '0')
          return priceA - priceB
        })
        break
      case 'price-high':
        filtered.sort((a, b) => {
          const priceA = parseInt(a.price.match(/\d+/)?.[0] || '0')
          const priceB = parseInt(b.price.match(/\d+/)?.[0] || '0')
          return priceB - priceA
        })
        break
      default:
        // Keep AI relevance order (default from backend)
        break
    }

    setFilteredRestaurants(filtered)
    setIsFilterPanelOpen(false) // Close filter panel on mobile after applying
  }

  const openRestaurantModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
  }

  const closeRestaurantModal = () => {
    setSelectedRestaurant(null)
  }

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Find Your Perfect Restaurant
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Discover amazing dining experiences in Cape Town with our AI-powered restaurant finder.
            Just describe what you're looking for!
          </p>
        </div>
        
        <SearchBar onSearch={handleSearch} isLoading={isLoading} initialQuery={searchQuery} />
      </div>

      {/* Enhanced Loading State with TypeWriter Animation */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner size="lg" className="mb-6" />
          <SearchingAnimation searchQuery={searchQuery} />
          
          {/* Search metadata during loading */}
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>🤖 AI-powered search • Vector similarity • Contextual matching</p>
          </div>
        </div>
      )}

      {/* Search Error State */}
      {searchError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Search Failed
          </h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{searchError}</p>
          <button
            onClick={() => handleSearch(searchQuery)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Search Performance Metadata */}
      {searchMetadata && !isLoading && restaurants.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span>⚡ Search completed in {searchMetadata.totalProcessingTime}ms</span>
              <span>🔄 Query rewritten: "{searchMetadata.rewrittenQuery}"</span>
            </div>
            <div className="flex items-center space-x-2">
              {searchMetadata.searchSteps.map((step: string, index: number) => (
                <span key={index} className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                  {step}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Section with Filters */}
      {!isLoading && restaurants.length > 0 && (
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filter Panel */}
          <div className="lg:col-span-1">
            <FilterPanel
              isOpen={isFilterPanelOpen}
              onToggle={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              filters={filters}
              onFiltersChange={setFilters}
              onApplyFilters={applyFilters}
              resultsCount={filteredRestaurants.length}
            />
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Recommended Restaurants
              </h2>
              <span className="text-gray-600 dark:text-gray-400">
                {filteredRestaurants.length} of {restaurants.length} results
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  onClick={() => openRestaurantModal(restaurant)}
                  className="animate-fade-in"
                />
              ))}
            </div>

            {/* No Results After Filtering */}
            {filteredRestaurants.length === 0 && restaurants.length > 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <SearchIcon className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No restaurants match your filters
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-4">
                  Try adjusting your filter criteria to see more results.
                </p>
                <button
                  onClick={() => {
                    setFilters(defaultFilterState)
                    // Re-apply AI sorting when clearing filters
                    const sortedByAI = [...restaurants].sort((a, b) => {
                      const scoreA = (a as any).aiMatchScore || generateContextualMatchScore(a.id, searchQuery)
                      const scoreB = (b as any).aiMatchScore || generateContextualMatchScore(b.id, searchQuery)
                      return scoreB - scoreA
                    })
                    setFilteredRestaurants(sortedByAI)
                  }}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Results State */}
      {!isLoading && hasSearched && restaurants.length === 0 && !searchError && (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <SearchIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No restaurants found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Try adjusting your search criteria or explore our suggested searches above.
          </p>
        </div>
      )}

      {/* Restaurant Detail Modal */}
      <RestaurantModal
        restaurant={selectedRestaurant}
        isOpen={!!selectedRestaurant}
        onClose={closeRestaurantModal}
      />
    </div>
  )
}

// Placeholder icon component
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}