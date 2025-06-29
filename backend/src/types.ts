// Core restaurant data types based on our Supabase schema
export interface Restaurant {
  placeId: string;
  title: string;
  city: string;
  address: string;
  phone: string;
  website: string;
  totalScore: string; // Stored as TEXT in DB
  reviewsCount: string; // Stored as TEXT in DB
  categoryName: string;
  price: string;
  neighborhood: string;
  description: string;
  imageUrl: string;
  imageUrls: string; // JSON array as string
  openingHours: string; // JSON array as string
  // Location data
  'location.lat': string;
  'location.lng': string;
  // Additional nested JSON fields
  categories: string; // JSON array as string
  additionalInfo: Record<string, any>; // Complex nested data
}

export interface Review {
  reviewId: string;
  place_id: string; // Foreign key to Restaurant.placeId
  stars: string; // Stored as TEXT in DB
  name: string;
  text: string;
  publishAt: string;
  publishedAtDate: string;
  reviewerNumberOfReviews: string;
  isLocalGuide: string;
  originalLanguage: string;
  reviewImageUrls: string; // JSON array as string
  reviewContext: string; // JSON object as string - contains price per person and other context
}

// Processed/parsed types for API responses
export interface RestaurantResponse {
  placeId: string;
  title: string;
  city: string;
  address: string;
  phone: string;
  website: string;
  rating: number; // Parsed from totalScore
  reviewsCount: number; // Parsed from reviewsCount
  category: string;
  priceLevel: string;
  neighborhood: string;
  description: string;
  imageUrl: string;
  images: string[]; // Parsed from imageUrls JSON
  openingHours: OpeningHour[]; // Parsed from openingHours JSON
  location: {
    lat: number;
    lng: number;
  };
  categories: string[]; // Parsed from categories JSON
}

export interface ReviewResponse {
  reviewId: string;
  placeId: string;
  rating: number; // Parsed from stars
  reviewerName: string;
  text: string;
  publishedAt: string;
  publishedDate: Date;
  reviewerReviewCount: number;
  isLocalGuide: boolean;
  language: string;
  images: string[]; // Parsed from reviewImageUrls JSON
}

export interface OpeningHour {
  day: string;
  hours: string;
}

// API request/response types
export interface SearchFilters {
  category?: string;
  priceLevel?: string[];
  rating?: number;
  neighborhood?: string;
  city?: string;
  openNow?: boolean;
}

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

export interface VectorSearchQuery extends SearchQuery {
  semanticWeight?: number; // 0-1, balance between semantic and keyword search
  includeReviews?: boolean;
}

export interface SearchResult {
  restaurants: RestaurantResponse[];
  total: number;
  hasMore: boolean;
  query: string;
  filters?: SearchFilters;
}

// Enhanced search result interface for Step 2 restaurant cards
export interface EnhancedSearchResult {
  restaurants: RestaurantCardResponse[];
  total: number;
  hasMore: boolean;
  query: string;
  filters?: SearchFilters;
  searchMetadata?: {
    searchType: 'keyword' | 'category' | 'neighborhood';
    searchTime: number; // milliseconds
    resultsSorted: 'relevance' | 'rating' | 'reviewCount';
  };
}

export interface VectorSearchResult extends SearchResult {
  explanations?: string[]; // AI-generated explanations for matches
  rewrittenQuery?: string; // LLM-rewritten query
  searchType: 'vector' | 'hybrid' | 'keyword';
}

// AI service types
export interface QueryRewriteRequest {
  originalQuery: string;
  context?: string;
}

export interface QueryRewriteResponse {
  rewrittenQuery: string;
  reasoning: string;
  confidence: number;
}

export interface RerankRequest {
  query: string;
  documents: RestaurantResponse[];
  topK?: number;
}

export interface RerankResponse {
  rankedDocuments: RestaurantResponse[];
  scores: number[];
  reasoning: string[];
}

// Error types
export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VECTOR_DB_ERROR = 'VECTOR_DB_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
}

// Service configuration types
export interface PineconeConfig {
  apiKey: string;
  environment: string;
  indexName: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
}

// Enhanced restaurant card interface for Step 2 - optimized for frontend restaurant cards
export interface RestaurantCardResponse {
  id: string; // unique restaurant ID (placeId)
  title: string; // restaurant name
  categoryName: string; // primary category
  categories?: string[]; // all categories
  address: string; // full address
  neighborhood?: string; // neighborhood for quick location context
  totalScore: number; // average rating (parsed from text field)
  reviewsCount: number; // number of reviews (parsed from text field)
  price: string; // price level indicator
  averagePrice?: string; // calculated average price range from reviews (e.g., "R 250-400")
  imageUrl: string; // representative image URL
  reviewsTags: string[]; // quick tags extracted from reviews or categories
  matchScore: number; // relevance score (0-100, mock for now)
  // Additional useful fields for cards
  phone?: string;
  website?: string;
  isOpenNow?: boolean; // parsed from opening hours if available
  location?: {
    lat: number;
    lng: number;
  };
} 