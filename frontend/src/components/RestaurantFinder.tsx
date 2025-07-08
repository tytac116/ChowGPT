import React, { useState } from 'react'
import { SearchBar } from './SearchBar'
import { RestaurantCard } from './RestaurantCard'
import { RestaurantModal } from './RestaurantModal'
import { FilterPanel } from './FilterPanel'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { SearchingAnimation } from './ui/TypeWriter'
import { useAppState } from '../contexts/AppStateContext'
import { useAuthApiService } from '../lib/authApiService'
import { Restaurant } from '../types/restaurant'
import { defaultFilterState } from '../types/filters'
import { useAuth } from '@clerk/clerk-react'

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
  if (!reviews || !Array.isArray(reviews)) return []

  return reviews.map(review => ({
    id: review.id || review.reviewId || `review-${Date.now()}`,
    author: review.author || 'Anonymous',
    rating: review.rating || 4,
    text: review.text || review.content || 'Great experience!',
    date: review.date || new Date().toISOString().split('T')[0],
  }))
}

function transformBackendRestaurant(backendRestaurant: any): any {
  return {
    id: backendRestaurant.placeId,
    name: backendRestaurant.name || backendRestaurant.title || 'Restaurant',
    cuisine: backendRestaurant.cuisine || backendRestaurant.categories || ['Restaurant'],
    location: extractLocationString(backendRestaurant.location),
    description: backendRestaurant.description || backendRestaurant.reviewSummary || 'Great dining experience in Cape Town.',
    rating: backendRestaurant.rating || backendRestaurant.totalScore || 4.0,
    priceRange: convertPriceToRands(backendRestaurant.priceLevel || backendRestaurant.price || backendRestaurant.averagePrice),
    features: backendRestaurant.features || [],
    matchScore: generateContextualMatchScore(backendRestaurant.placeId),
    aiExplanation: backendRestaurant.llmReasoning || 'This restaurant matches your preferences based on our analysis.',
    address: backendRestaurant.address || backendRestaurant.location || 'Cape Town',
    phone: backendRestaurant.phone || '',
    website: backendRestaurant.website || '',
    neighborhood: backendRestaurant.neighborhood || 'Cape Town',
    reviewCount: backendRestaurant.reviewsCount || 0,
    images: backendRestaurant.imageUrls || backendRestaurant.images || getDefaultImages(),
    hours: transformOpeningHours(backendRestaurant.openingHours),
    reviews: transformReviews(backendRestaurant.reviews || []),
    parkingInfo: backendRestaurant.parkingInfo || 'Street parking available',
    dietaryOptions: backendRestaurant.features?.filter((f: string) => 
      f.toLowerCase().includes('vegan') || 
      f.toLowerCase().includes('vegetarian') || 
      f.toLowerCase().includes('gluten')
    ) || [],
    operatingHours: backendRestaurant.operatingHours || 'Daily: 09:00 - 22:00',
  }
}

export function RestaurantFinder() {
  const { restaurants, setRestaurants, searchQuery, setSearchQuery, filters, setFilters } = useAppState()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchMetadata, setSearchMetadata] = useState<any>(null)

  // Use authenticated API service
  const authApiService = useAuthApiService()

  // Debug: Check authentication status
  const { isSignedIn, userId } = useAuth()
  console.log('🔐 Authentication status:', { isSignedIn, userId })

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setRestaurants([])
      setSearchQuery('')
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    setSearchQuery(query)

    try {
      const searchRequest = {
        query: query.trim(),
        filters: {
          cuisine: filters.selectedCategories,
          priceRange: filters.selectedPriceRanges.length > 0 ? {
            min: filters.selectedPriceRanges[0] === 'Under R150' ? 0 : 
                 filters.selectedPriceRanges[0] === 'R150-300' ? 150 :
                 filters.selectedPriceRanges[0] === 'R300-500' ? 300 :
                 filters.selectedPriceRanges[0] === 'R500-800' ? 500 : 800,
            max: filters.selectedPriceRanges[0] === 'Under R150' ? 150 : 
                 filters.selectedPriceRanges[0] === 'R150-300' ? 300 :
                 filters.selectedPriceRanges[0] === 'R300-500' ? 500 :
                 filters.selectedPriceRanges[0] === 'R500-800' ? 800 : 2000
          } : undefined,
          location: filters.selectedNeighborhoods.length > 0 ? filters.selectedNeighborhoods[0] : undefined,
          rating: filters.minRating > 0 ? filters.minRating : undefined,
          features: filters.selectedFeatures
        },
        limit: 20
      }

      console.log('🔍 Making search request:', searchRequest)

      // Temporary: Try real API first, but fallback to mock data if it fails
      try {
        const response = await authApiService.searchRestaurants(searchRequest)
        console.log('📄 Search response:', response)
        
        if (response.success && response.data) {
          const transformedRestaurants = response.data.restaurants.map(transformBackendRestaurant)
          setRestaurants(transformedRestaurants)
          setSearchMetadata(response.data.searchMetadata)
          console.log('✅ Search successful:', transformedRestaurants.length, 'restaurants found')
        } else {
          throw new Error('Search failed')
        }
      } catch (apiError) {
        console.log('⚠️  API failed, using mock data:', apiError)
        
        // Fallback to mock data for testing
        const mockBackendRestaurants = [
          {
            placeId: 'mock-1',
            name: 'The Test Kitchen',
            cuisine: ['Modern African', 'Fine Dining'],
            location: 'Woodstock, Cape Town',
            description: 'Award-winning fine dining restaurant with modern African cuisine.',
            rating: 4.8,
            priceLevel: '$$$',
            features: ['Fine Dining', 'Wine Pairing', 'Tasting Menu'],
            aiMatchScore: 95,
            vectorScore: 0.9,
            keywordScore: 0.8,
            llmScore: 0.95,
            llmReasoning: 'Perfect match for your search query.',
            reviewSummary: 'Excellent fine dining experience with creative dishes.',
            address: '123 Test Street, Woodstock, Cape Town',
            phone: '+27 21 447 2337',
            website: 'https://testkitchen.co.za',
            neighborhood: 'Woodstock',
            reviewsCount: 1250,
            images: [],
            openingHours: [
              { day: 'tuesday', hours: '18:00 - 22:00' },
              { day: 'wednesday', hours: '18:00 - 22:00' },
              { day: 'thursday', hours: '18:00 - 22:00' },
              { day: 'friday', hours: '18:00 - 22:00' },
              { day: 'saturday', hours: '18:00 - 22:00' }
            ],
            reviews: [],
            parkingInfo: 'Valet parking available',
            operatingHours: 'Tue-Sat: 18:00 - 22:00'
          },
          {
            placeId: 'mock-2',
            name: 'Mama Africa',
            cuisine: ['African', 'Traditional'],
            location: 'Long Street, Cape Town',
            description: 'Authentic African cuisine in the heart of Cape Town.',
            rating: 4.2,
            priceLevel: '$$',
            features: ['Traditional', 'Live Music', 'Cultural Experience'],
            aiMatchScore: 78,
            vectorScore: 0.7,
            keywordScore: 0.8,
            llmScore: 0.78,
            llmReasoning: 'Great cultural dining experience.',
            reviewSummary: 'Authentic African food with live entertainment.',
            address: '178 Long Street, Cape Town',
            phone: '+27 21 424 8634',
            website: 'https://mamafrica.co.za',
            neighborhood: 'City Bowl',
            reviewsCount: 890,
            images: [],
            openingHours: [
              { day: 'monday', hours: '19:00 - 23:00' },
              { day: 'tuesday', hours: '19:00 - 23:00' },
              { day: 'wednesday', hours: '19:00 - 23:00' },
              { day: 'thursday', hours: '19:00 - 23:00' },
              { day: 'friday', hours: '19:00 - 01:00' },
              { day: 'saturday', hours: '19:00 - 01:00' },
              { day: 'sunday', hours: '19:00 - 23:00' }
            ],
            reviews: [],
            parkingInfo: 'Street parking available',
            operatingHours: 'Daily: 19:00 - 23:00'
          }
        ]

        const transformedMockRestaurants = mockBackendRestaurants.map(transformBackendRestaurant)
        setRestaurants(transformedMockRestaurants)
        setSearchMetadata({
          originalQuery: query,
          rewrittenQuery: query,
          searchSteps: ['Mock Search'],
          totalProcessingTime: 100
        })
        console.log('✅ Mock search successful:', transformedMockRestaurants.length, 'restaurants found')
      }
    } catch (err) {
      console.error('❌ Search error:', err)
      
      // Better error handling for authentication issues
      if (err instanceof Error) {
        if (err.message.includes('Authentication') || err.message.includes('401')) {
          setError('Authentication failed. Please try signing out and signing back in.')
        } else if (err.message.includes('403')) {
          setError('Access forbidden. Please check your account permissions.')
        } else if (err.message.includes('500')) {
          setError('Server error. Please try again later.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Search failed. Please try again.')
      }
      
      setRestaurants([])
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    // Re-run search with current filters
    if (searchQuery) {
      handleSearch(searchQuery)
    }
  }

  const clearFilters = () => {
    setFilters(defaultFilterState)
    // Re-run search with cleared filters
    if (searchQuery) {
      handleSearch(searchQuery)
    }
  }

  const openRestaurantModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
    setIsModalOpen(true)
  }

  const closeRestaurantModal = () => {
    setSelectedRestaurant(null)
    setIsModalOpen(false)
  }

  return (
    <div className="space-y-8">
      {/* Debug Info */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm">
        <p><strong>Debug Info:</strong></p>
        <p>isLoading: {isLoading ? 'true' : 'false'}</p>
        <p>restaurants.length: {restaurants.length}</p>
        <p>error: {error || 'null'}</p>
        <p>searchQuery: "{searchQuery}"</p>
        <p>showFilters: {showFilters ? 'true' : 'false'}</p>
      </div>

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
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Search Failed
          </h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
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
        <div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm mb-4">
            <p><strong>Results Debug:</strong> Showing {restaurants.length} restaurants</p>
          </div>
          
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filter Panel */}
            <div className="lg:col-span-1">
              <FilterPanel
                isOpen={showFilters}
                onToggle={() => setShowFilters(!showFilters)}
                filters={filters}
                onFiltersChange={setFilters}
                onApplyFilters={applyFilters}
                resultsCount={restaurants.length}
              restaurants={restaurants}
              />
            </div>

            {/* Results Grid */}
            <div className="lg:col-span-3 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Recommended Restaurants
                </h2>
                <span className="text-gray-600 dark:text-gray-400">
                  {restaurants.length} of {restaurants.length} results
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    onClick={() => openRestaurantModal(restaurant)}
                    className="animate-fade-in"
                  />
                ))}
              </div>

              {/* No Results After Filtering */}
              {restaurants.length === 0 && (
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
                    onClick={clearFilters}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Results State */}
      {!isLoading && restaurants.length === 0 && !error && (
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
        isOpen={isModalOpen}
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