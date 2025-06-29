import React, { useState, useMemo } from 'react'
import { Filter, X, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { Button } from './ui/Button'
import { FilterState, defaultFilterState } from '../types/filters'
import { Restaurant } from '../types/restaurant'

interface FilterPanelProps {
  isOpen: boolean
  onToggle: () => void
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onApplyFilters: () => void
  resultsCount: number
  restaurants: Restaurant[]
}

export function FilterPanel({ 
  isOpen, 
  onToggle, 
  filters, 
  onFiltersChange, 
  onApplyFilters,
  resultsCount,
  restaurants = []
}: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: true,
    location: false,
    features: false
  })

  // Extract filter options from restaurants (simple and fast)
  const filterOptions = useMemo(() => {
    if (!restaurants.length) {
      return { categories: [], neighborhoods: [], priceRanges: [], features: [] }
    }

    const categories = [...new Set(restaurants.flatMap(r => 
      [r.categoryName, ...(r.categories || [])].filter(Boolean)
    ))].sort()

    const neighborhoods = [...new Set(restaurants.map(r => r.neighborhood).filter(Boolean))].sort()

    const priceRanges = [...new Set(restaurants.map(r => r.price).filter(Boolean))].sort()

    const features = [...new Set(restaurants.flatMap(r => [
      ...(r.reviewsTags || []),
      ...(r.highlights || []),
      ...(r.serviceOptions || []),
      ...(r.offerings || [])
    ].filter(Boolean)))].sort().slice(0, 20) // Limit to 20 most common features

    return { categories, neighborhoods, priceRanges, features }
  }, [restaurants])

  // Simple, immediate filter update function
  const updateFilter = (newFilters: FilterState) => {
    console.log('🔧 Updating filters:', newFilters)
    onFiltersChange(newFilters)
    onApplyFilters() // Apply immediately, no delays
  }

  // Simple checkbox handlers - no complex event handling
  const handleCategoryChange = (category: string, checked: boolean) => {
    const selectedCategories = checked
      ? [...filters.selectedCategories, category]
      : filters.selectedCategories.filter(c => c !== category)
    
    updateFilter({ ...filters, selectedCategories })
  }

  const handlePriceRangeChange = (priceRange: string, checked: boolean) => {
    const selectedPriceRanges = checked
      ? [...filters.selectedPriceRanges, priceRange]
      : filters.selectedPriceRanges.filter(p => p !== priceRange)
    
    updateFilter({ ...filters, selectedPriceRanges })
  }

  const handleNeighborhoodChange = (neighborhood: string, checked: boolean) => {
    const selectedNeighborhoods = checked
      ? [...filters.selectedNeighborhoods, neighborhood]
      : filters.selectedNeighborhoods.filter(n => n !== neighborhood)
    
    updateFilter({ ...filters, selectedNeighborhoods })
  }

  const handleFeatureChange = (feature: string, checked: boolean) => {
    const selectedFeatures = checked
      ? [...filters.selectedFeatures, feature]
      : filters.selectedFeatures.filter(f => f !== feature)
    
    updateFilter({ ...filters, selectedFeatures })
  }

  const handleRatingChange = (rating: number) => {
    updateFilter({ ...filters, minRating: rating })
  }

  const handleSortChange = (sortBy: FilterState['sortBy']) => {
    updateFilter({ ...filters, sortBy })
  }

  const handleOpenNowChange = (checked: boolean) => {
    updateFilter({ ...filters, openNow: checked })
  }

  const clearAllFilters = () => {
    updateFilter(defaultFilterState)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
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
  if (!restaurants.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 lg:sticky lg:top-4">
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
    )
  }

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <Button
          onClick={onToggle}
          variant="outline"
          className="w-full justify-between"
        >
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Filter Panel */}
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 lg:block lg:sticky lg:top-4 ${
        isOpen ? 'block' : 'hidden lg:block'
      }`}>
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
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear All
                </Button>
              )}
              <button
                onClick={onToggle}
                className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
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
              onChange={(e) => handleSortChange(e.target.value as FilterState['sortBy'])}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.openNow}
                onChange={(e) => handleOpenNowChange(e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
              <div className="space-y-2">
              {filterOptions.categories.map((category) => (
                  <CheckboxFilter
                    key={category}
                    label={category}
                    checked={filters.selectedCategories.includes(category)}
                    onChange={(checked) => handleCategoryChange(category, checked)}
                    icon="🏷️"
                  />
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
            <div className="space-y-2">
              {filterOptions.priceRanges.map((priceRange) => (
                  <CheckboxFilter
                    key={priceRange}
                    label={priceRange}
                    checked={filters.selectedPriceRanges.includes(priceRange)}
                    onChange={(checked) => handlePriceRangeChange(priceRange, checked)}
                    icon="💰"
                  />
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
                <label key={rating} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.minRating === rating}
                    onChange={() => handleRatingChange(rating)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" />
                      {rating}+ stars
                    </span>
                </label>
              ))}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  checked={filters.minRating === 0}
                  onChange={() => handleRatingChange(0)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
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
              <div className="space-y-2 max-h-48 overflow-y-auto">
              {filterOptions.neighborhoods.map((neighborhood) => (
                  <CheckboxFilter
                    key={neighborhood}
                    label={neighborhood}
                    checked={filters.selectedNeighborhoods.includes(neighborhood)}
                    onChange={(checked) => handleNeighborhoodChange(neighborhood, checked)}
                    icon="📍"
                  />
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
              <div className="space-y-2 max-h-48 overflow-y-auto">
              {filterOptions.features.map((feature) => (
                  <CheckboxFilter
                    key={feature}
                    label={feature}
                    checked={filters.selectedFeatures.includes(feature)}
                    onChange={(checked) => handleFeatureChange(feature, checked)}
                    icon="🔖"
                  />
              ))}
            </div>
          </FilterSection>
          )}
        </div>
      </div>
    </>
  )
}

// Simple, reusable checkbox component
interface CheckboxFilterProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  icon?: string
}

function CheckboxFilter({ label, checked, onChange, icon }: CheckboxFilterProps) {
  return (
    <label className="flex items-center space-x-3 cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
      />
      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 flex items-center">
        {icon && <span className="mr-2">{icon}</span>}
        <span className="capitalize">{label}</span>
      </span>
    </label>
  )
}

// Simple, reusable section component
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
        className="flex items-center justify-between w-full p-2 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </span>
          {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          ) : (
          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          )}
      </button>
      {isExpanded && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  )
}