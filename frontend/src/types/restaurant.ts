export interface Restaurant {
  id: string
  title: string
  categoryName: string
  categories: string[]
  totalScore: number
  reviewsCount: number
  price: string
  address: string
  neighborhood: string
  reviewsTags: string[]
  imagesCount: number
  imageUrls: string[]
  phone?: string
  website?: string
  openingHours: OpeningHours
  popularTimes?: string[]
  serviceOptions: string[]
  highlights: string[]
  offerings: string[]
  accessibility: string[]
  reviews: Review[]
  additionalInfo?: Record<string, any>
}

export interface OpeningHours {
  monday: string
  tuesday: string
  wednesday: string
  thursday: string
  friday: string
  saturday: string
  sunday: string
}

export interface Review {
  id: string
  reviewId?: string
  author: string
  reviewerName?: string
  rating: number
  text: string
  date: string
  publishedAt?: string
  helpful?: number
}

export interface AIMatchExplanation {
  matchPercentage: number
  matchReasons: string[]
  concernReasons: string[]
  summary: string
}