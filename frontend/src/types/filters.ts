export interface FilterOptions {
  categories: string[]
  priceRanges: string[]
  ratings: number[]
  neighborhoods: string[]
  features: string[]
  openNow: boolean
  sortBy: 'relevance' | 'rating' | 'price' | 'distance'
}

export interface FilterState {
  selectedCategories: string[]
  selectedPriceRanges: string[]
  minRating: number
  selectedNeighborhoods: string[]
  selectedFeatures: string[]
  openNow: boolean
  sortBy: 'relevance' | 'rating' | 'price' | 'distance'
}

export const defaultFilterState: FilterState = {
  selectedCategories: [],
  selectedPriceRanges: [],
  minRating: 0,
  selectedNeighborhoods: [],
  selectedFeatures: [],
  openNow: false,
  sortBy: 'relevance'
}