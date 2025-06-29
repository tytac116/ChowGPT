import React, { useState } from 'react'
import { SearchBar } from './SearchBar'
import { RestaurantCard } from './RestaurantCard'
import { RestaurantModal } from './RestaurantModal'
import { FilterPanel } from './FilterPanel'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { useAppState } from '../contexts/AppStateContext'
import { mockRestaurants } from '../data/mockRestaurants'
import { Restaurant } from '../types/restaurant'
import { defaultFilterState } from '../types/filters'

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

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setHasSearched(true)
    setSearchQuery(query)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // For demo purposes, return shuffled mock data
    const shuffledRestaurants = [...mockRestaurants].sort(() => Math.random() - 0.5)
    setRestaurants(shuffledRestaurants)
    setFilteredRestaurants(shuffledRestaurants)
    setIsLoading(false)
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

    // Apply price range filter
    if (filters.selectedPriceRanges.length > 0) {
      filtered = filtered.filter(restaurant => {
        const price = restaurant.price
        return filters.selectedPriceRanges.some(range => {
          switch (range) {
            case 'Under R150':
              return price.includes('R120') || price.includes('R100') || price.includes('R80')
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

    // Apply sorting
    switch (filters.sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.totalScore - a.totalScore)
        break
      case 'price':
        filtered.sort((a, b) => {
          const priceA = parseInt(a.price.match(/\d+/)?.[0] || '0')
          const priceB = parseInt(b.price.match(/\d+/)?.[0] || '0')
          return priceA - priceB
        })
        break
      case 'distance':
        // Mock distance sorting
        filtered.sort(() => Math.random() - 0.5)
        break
      default:
        // Keep relevance order
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            Finding the perfect restaurants for you...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Our AI is analyzing your preferences
          </p>
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
                    setFilteredRestaurants(restaurants)
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
      {!isLoading && hasSearched && restaurants.length === 0 && (
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