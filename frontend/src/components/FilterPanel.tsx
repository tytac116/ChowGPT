import React, { useState } from 'react'
import { Filter, X, ChevronDown, ChevronUp, Star } from 'lucide-react'
import { Button } from './ui/Button'
import { FilterState, defaultFilterState } from '../types/filters'
import { filterOptions } from '../data/filterOptions'
import { cn } from '../lib'

interface FilterPanelProps {
  isOpen: boolean
  onToggle: () => void
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onApplyFilters: () => void
  resultsCount: number
}

export function FilterPanel({ 
  isOpen, 
  onToggle, 
  filters, 
  onFiltersChange, 
  onApplyFilters,
  resultsCount 
}: FilterPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: true,
    location: false,
    features: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleCategoryChange = (category: string) => {
    const updated = filters.selectedCategories.includes(category)
      ? filters.selectedCategories.filter(c => c !== category)
      : [...filters.selectedCategories, category]
    
    onFiltersChange({ ...filters, selectedCategories: updated })
  }

  const handlePriceRangeChange = (priceRange: string) => {
    const updated = filters.selectedPriceRanges.includes(priceRange)
      ? filters.selectedPriceRanges.filter(p => p !== priceRange)
      : [...filters.selectedPriceRanges, priceRange]
    
    onFiltersChange({ ...filters, selectedPriceRanges: updated })
  }

  const handleNeighborhoodChange = (neighborhood: string) => {
    const updated = filters.selectedNeighborhoods.includes(neighborhood)
      ? filters.selectedNeighborhoods.filter(n => n !== neighborhood)
      : [...filters.selectedNeighborhoods, neighborhood]
    
    onFiltersChange({ ...filters, selectedNeighborhoods: updated })
  }

  const handleFeatureChange = (feature: string) => {
    const updated = filters.selectedFeatures.includes(feature)
      ? filters.selectedFeatures.filter(f => f !== feature)
      : [...filters.selectedFeatures, feature]
    
    onFiltersChange({ ...filters, selectedFeatures: updated })
  }

  const clearAllFilters = () => {
    onFiltersChange(defaultFilterState)
  }

  const hasActiveFilters = 
    filters.selectedCategories.length > 0 ||
    filters.selectedPriceRanges.length > 0 ||
    filters.minRating > 0 ||
    filters.selectedNeighborhoods.length > 0 ||
    filters.selectedFeatures.length > 0 ||
    filters.openNow ||
    filters.sortBy !== 'ai-match'

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
              onChange={(e) => onFiltersChange({ 
                ...filters, 
                sortBy: e.target.value as FilterState['sortBy'] 
              })}
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
                onChange={(e) => onFiltersChange({ ...filters, openNow: e.target.checked })}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                Open Now
              </span>
            </label>
          </div>

          {/* Categories */}
          <FilterSection
            title="Categories"
            isExpanded={expandedSections.categories}
            onToggle={() => toggleSection('categories')}
          >
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {filterOptions.categories.map((category) => (
                <label key={category} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.selectedCategories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                    {category}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Price Range */}
          <FilterSection
            title="Price Range"
            isExpanded={expandedSections.price}
            onToggle={() => toggleSection('price')}
          >
            <div className="space-y-2">
              {filterOptions.priceRanges.map((priceRange) => (
                <label key={priceRange} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.selectedPriceRanges.includes(priceRange)}
                    onChange={() => handlePriceRangeChange(priceRange)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                    {priceRange}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Rating */}
          <FilterSection
            title="Minimum Rating"
            isExpanded={expandedSections.rating}
            onToggle={() => toggleSection('rating')}
          >
            <div className="space-y-2">
              {filterOptions.ratings.map((rating) => (
                <label key={rating} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.minRating === rating}
                    onChange={() => onFiltersChange({ ...filters, minRating: rating })}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200"
                  />
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current transition-transform duration-200 group-hover:scale-110" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                      {rating}+ stars
                    </span>
                  </div>
                </label>
              ))}
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="rating"
                  checked={filters.minRating === 0}
                  onChange={() => onFiltersChange({ ...filters, minRating: 0 })}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                  Any rating
                </span>
              </label>
            </div>
          </FilterSection>

          {/* Location */}
          <FilterSection
            title="Neighborhood"
            isExpanded={expandedSections.location}
            onToggle={() => toggleSection('location')}
          >
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {filterOptions.neighborhoods.map((neighborhood) => (
                <label key={neighborhood} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.selectedNeighborhoods.includes(neighborhood)}
                    onChange={() => handleNeighborhoodChange(neighborhood)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                    {neighborhood}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Features */}
          <FilterSection
            title="Features"
            isExpanded={expandedSections.features}
            onToggle={() => toggleSection('features')}
          >
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {filterOptions.features.map((feature) => (
                <label key={feature} className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.selectedFeatures.includes(feature)}
                    onChange={() => handleFeatureChange(feature)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                    {feature}
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Apply Button */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={onApplyFilters}
              variant="primary"
              className="w-full transform hover:scale-105 active:scale-95"
            >
              Apply Filters ({resultsCount} results)
            </Button>
          </div>
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
        className="flex items-center justify-between w-full text-left mb-3 focus:outline-none group"
      >
        <h4 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
          {title}
        </h4>
        <div className="transition-transform duration-200 group-hover:scale-110">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="animate-slide-in-bottom">
          {children}
        </div>
      )}
    </div>
  )
}