import React, { useState, useEffect, useMemo } from 'react'
import { Filter, X, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { Button } from './ui/Button'
import { FilterState, defaultFilterState } from '../types/filters'
import { Restaurant } from '../types/restaurant'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Direct cn implementation to avoid import issues
const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

interface FilterPanelProps {
  isOpen: boolean
  onToggle: () => void
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onApplyFilters: () => void
  resultsCount: number
  restaurants: Restaurant[] // Added to extract filter options from actual results
}

export function FilterPanel({ 
  isOpen, 
  onToggle, 
  filters, 
  onFiltersChange, 
  onApplyFilters,
  resultsCount,
  restaurants = [] // Default to empty array
}: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: true,
    location: false,
    features: false
  })

  // Dynamically extract filter options from current search results
  const filterOptions = useMemo(() => {
    if (!restaurants || restaurants.length === 0) {
      return {
        categories: [],
        neighborhoods: [],
        priceRanges: [],
        features: []
      }
    }

    // Extract unique categories
    const categories = new Set<string>()
    restaurants.forEach(restaurant => {
      if (restaurant.categoryName) categories.add(restaurant.categoryName)
      if (restaurant.categories) {
        restaurant.categories.forEach(cat => categories.add(cat))
      }
    })

    // Extract unique neighborhoods
    const neighborhoods = new Set<string>()
    restaurants.forEach(restaurant => {
      if (restaurant.neighborhood) neighborhoods.add(restaurant.neighborhood)
    })

    // Extract unique price ranges
    const priceRanges = new Set<string>()
    restaurants.forEach(restaurant => {
      if (restaurant.price) priceRanges.add(restaurant.price)
    })

    // Extract unique features/tags
    const features = new Set<string>()
    restaurants.forEach(restaurant => {
      if (restaurant.reviewsTags) {
        restaurant.reviewsTags.forEach(tag => features.add(tag))
      }
      if (restaurant.highlights) {
        restaurant.highlights.forEach(highlight => features.add(highlight))
      }
      if (restaurant.serviceOptions) {
        restaurant.serviceOptions.forEach(option => features.add(option))
      }
      if (restaurant.offerings) {
        restaurant.offerings.forEach(offering => features.add(offering))
      }
    })

    return {
      categories: Array.from(categories).sort(),
      neighborhoods: Array.from(neighborhoods).sort(),
      priceRanges: Array.from(priceRanges).sort(),
      features: Array.from(features).sort()
    }
  }, [restaurants])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleCategoryChange = (category: string, event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation() // Prevent event bubbling
    
    const updated = filters.selectedCategories.includes(category)
      ? filters.selectedCategories.filter(c => c !== category)
      : [...filters.selectedCategories, category]
    
    const newFilters = { ...filters, selectedCategories: updated }
    onFiltersChange(newFilters)
    
    // Apply filters after state update completes
    requestAnimationFrame(() => {
      onApplyFilters()
    })
  }

  const handlePriceRangeChange = (priceRange: string, event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation() // Prevent event bubbling
    
    const updated = filters.selectedPriceRanges.includes(priceRange)
      ? filters.selectedPriceRanges.filter(p => p !== priceRange)
      : [...filters.selectedPriceRanges, priceRange]
    
    const newFilters = { ...filters, selectedPriceRanges: updated }
    onFiltersChange(newFilters)
    
    // Apply filters after state update completes
    requestAnimationFrame(() => {
      onApplyFilters()
    })
  }

  const handleNeighborhoodChange = (neighborhood: string, event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation() // Prevent event bubbling
    
    const updated = filters.selectedNeighborhoods.includes(neighborhood)
      ? filters.selectedNeighborhoods.filter(n => n !== neighborhood)
      : [...filters.selectedNeighborhoods, neighborhood]
    
    const newFilters = { ...filters, selectedNeighborhoods: updated }
    onFiltersChange(newFilters)
    
    // Apply filters after state update completes
    requestAnimationFrame(() => {
      onApplyFilters()
    })
  }

  const handleFeatureChange = (feature: string, event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation() // Prevent event bubbling
    
    const updated = filters.selectedFeatures.includes(feature)
      ? filters.selectedFeatures.filter(f => f !== feature)
      : [...filters.selectedFeatures, feature]
    
    const newFilters = { ...filters, selectedFeatures: updated }
    onFiltersChange(newFilters)
    
    // Apply filters after state update completes
    requestAnimationFrame(() => {
      onApplyFilters()
    })
  }

  const handleRatingChange = (rating: number, event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation() // Prevent event bubbling
    
    const newFilters = { ...filters, minRating: rating }
    onFiltersChange(newFilters)
    
    // Apply filters after state update completes
    requestAnimationFrame(() => {
      onApplyFilters()
    })
  }

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    event.stopPropagation() // Prevent event bubbling
    
    const sortBy = event.target.value as FilterState['sortBy']
    const newFilters = { ...filters, sortBy }
    onFiltersChange(newFilters)
    
    // Apply filters after state update completes
    requestAnimationFrame(() => {
      onApplyFilters()
    })
  }

  const handleOpenNowChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation() // Prevent event bubbling
    
    const openNow = event.target.checked
    const newFilters = { ...filters, openNow }
    onFiltersChange(newFilters)
    
    // Apply filters after state update completes
    requestAnimationFrame(() => {
      onApplyFilters()
    })
  }

  const clearAllFilters = (event: React.MouseEvent) => {
    event.stopPropagation() // Prevent event bubbling
    event.preventDefault() // Prevent default button behavior
    
    onFiltersChange(defaultFilterState)
    
    // Apply filters after state update completes
    requestAnimationFrame(() => {
      onApplyFilters()
    })
  }

  const hasActiveFilters = 
    filters.selectedCategories.length > 0 ||
    filters.selectedPriceRanges.length > 0 ||
    filters.minRating > 0 ||
    filters.selectedNeighborhoods.length > 0 ||
    filters.selectedFeatures.length > 0 ||
    filters.openNow ||
    filters.sortBy !== 'ai-match'

  // Show message if no results to filter
  if (!restaurants || restaurants.length === 0) {
    return (
      <>
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <Button
            onClick={onToggle}
            variant="outline"
            className="w-full justify-between opacity-50 cursor-not-allowed"
            disabled
          >
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter Panel - Empty State */}
        <div className={cn(
          'bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700',
          'lg:block lg:sticky lg:top-4',
          isOpen ? 'block' : 'hidden lg:block'
        )}>
          <div className="p-6 text-center">
            <Filter className="h-8 w-8 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
              No Results to Filter
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Search for restaurants to see available filters
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <Button
          onClick={onToggle}
          variant="outline"
          className="w-full justify-between transform hover:scale-105 active:scale-95"
        >
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                Active
              </span>
            )}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Filter Panel */}
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-out',
        'lg:block lg:sticky lg:top-4',
        isOpen ? 'block animate-slide-in-bottom' : 'hidden lg:block'
      )}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filters
              </h3>
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                {resultsCount} results
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <Button
                  onClick={clearAllFilters}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transform hover:scale-105"
                >
                  Clear All
                </Button>
              )}
              <button
                onClick={onToggle}
                className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-110"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Sort By */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={handleSortChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            >
              <option value="ai-match">Best AI Match</option>
              <option value="relevance">Most Relevant</option>
              <option value="rating">Highest Rated</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {/* Open Now Toggle */}
          <div className="mb-6">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.openNow}
                onChange={handleOpenNowChange}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                Open Now
              </span>
            </label>
          </div>

          {/* Categories */}
          {filterOptions.categories.length > 0 && (
            <FilterSection
              title={`Categories (${filterOptions.categories.length})`}
              isExpanded={expandedSections.categories}
              onToggle={() => toggleSection('categories')}
            >
              <div className="grid grid-cols-1 gap-2">
                {filterOptions.categories.map((category) => (
                  <label key={category} className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.selectedCategories.includes(category)}
                      onChange={(e) => handleCategoryChange(category, e)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 capitalize">
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Price Range */}
          {filterOptions.priceRanges.length > 0 && (
            <FilterSection
              title={`Price Range (${filterOptions.priceRanges.length})`}
              isExpanded={expandedSections.price}
              onToggle={() => toggleSection('price')}
            >
              <div className="grid grid-cols-1 gap-2">
                {filterOptions.priceRanges.map((priceRange) => (
                  <label key={priceRange} className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.selectedPriceRanges.includes(priceRange)}
                      onChange={(e) => handlePriceRangeChange(priceRange, e)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                      💰 {priceRange}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Minimum Rating */}
          <FilterSection
            title="Minimum Rating"
            isExpanded={expandedSections.rating}
            onToggle={() => toggleSection('rating')}
          >
            <div className="space-y-2">
              {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                <label key={rating} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.minRating === rating}
                    onChange={(e) => handleRatingChange(rating, e)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" />
                    {rating}+ stars
                  </span>
                </label>
              ))}
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="rating"
                  checked={filters.minRating === 0}
                  onChange={(e) => handleRatingChange(0, e)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                  Any rating
                </span>
              </label>
            </div>
          </FilterSection>

          {/* Neighborhood */}
          {filterOptions.neighborhoods.length > 0 && (
            <FilterSection
              title={`Neighborhood (${filterOptions.neighborhoods.length})`}
              isExpanded={expandedSections.location}
              onToggle={() => toggleSection('location')}
            >
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {filterOptions.neighborhoods.map((neighborhood) => (
                  <label key={neighborhood} className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.selectedNeighborhoods.includes(neighborhood)}
                      onChange={(e) => handleNeighborhoodChange(neighborhood, e)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                      📍 {neighborhood}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Features */}
          {filterOptions.features.length > 0 && (
            <FilterSection
              title={`Features (${filterOptions.features.length})`}
              isExpanded={expandedSections.features}
              onToggle={() => toggleSection('features')}
            >
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {filterOptions.features.slice(0, 20).map((feature) => ( // Limit to first 20 features
                  <label key={feature} className="flex items-center space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filters.selectedFeatures.includes(feature)}
                      onChange={(e) => handleFeatureChange(feature, e)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200 capitalize">
                      🏷️ {feature}
                    </span>
                  </label>
                ))}
                {filterOptions.features.length > 20 && (
                  <p className="text-xs text-gray-400 mt-2">
                    +{filterOptions.features.length - 20} more features available
                  </p>
                )}
              </div>
            </FilterSection>
          )}
        </div>
      </div>
    </>
  )
}

interface FilterSectionProps {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

function FilterSection({ title, isExpanded, onToggle, children }: FilterSectionProps) {
  return (
    <div className="mb-6">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-2 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 group"
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">
          {title}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all duration-200" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-all duration-200" />
        )}
      </button>
      {isExpanded && (
        <div className="mt-3 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}