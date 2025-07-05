// API Configuration - Works in development and production
const getApiBaseUrl = () => {
  // Try to get from environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Fallback to localhost in development
  if (import.meta.env.DEV) {
    return 'http://localhost:3001/api'
  }
  
  // Production fallback - adjust as needed
  return '/api'
}

const API_BASE_URL = getApiBaseUrl()

export interface BackendSearchRequest {
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

export interface BackendRestaurant {
  placeId: string
  name?: string
  title?: string
  cuisine?: string[]
  categories?: string[]
  categoryName?: string
  location: string | { lat: number; lng: number }
  description?: string
  rating?: number
  totalScore?: number
  priceLevel?: string
  price?: string
  averagePrice?: string
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
  // Additional fields from our backend
  phone?: string
  website?: string
  address?: string
  neighborhood?: string
  reviewsCount?: number
  imageUrl?: string
  imageUrls?: string[]
  images?: string[] // Real restaurant images from Google Photos
  openingHours?: any[]
}

export interface SearchResponse {
  success: boolean
  data: {
    restaurants: BackendRestaurant[]
    searchMetadata: {
      originalQuery: string
      rewrittenQuery: string
      searchSteps: string[]
      totalProcessingTime: number
    }
  }
  metadata: {
    searchTime: number
    query: string
    totalResults: number
    timestamp: string
  }
}



export interface AIExplanationResponse {
  restaurantId: string;
  userQuery: string;
  explanation: {
    overallAssessment: string;
    whatMatches: string[];
    thingsToConsider: string[];
  };
  responseTimeMs: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatResponse {
  response: string;
  sessionId: string;
  timestamp: Date;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  sessionId: string;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  // Get authentication headers for API calls
  private getAuthHeaders(token?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Search restaurants
  async searchRestaurants(request: BackendSearchRequest, token?: string): Promise<SearchResponse> {
    try {
      const headers = this.getAuthHeaders(token);
      
      const response = await fetch(`${API_BASE_URL}/search/restaurants`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API search error:', error);
      throw error;
    }
  }



  // Generate AI match explanation for a restaurant
  async generateAIExplanation(restaurantId: string, userQuery: string, token?: string): Promise<AIExplanationResponse> {
    try {
      const headers = this.getAuthHeaders(token);
      
      const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/ai-explanation`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userQuery }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate AI explanation: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate AI explanation');
      }

      return result.data;
    } catch (error) {
      console.error('API AI explanation error:', error);
      throw error;
    }
  }

  async getRestaurantById(id: string, token?: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    
    const response = await fetch(`${API_BASE_URL}/restaurants/${id}`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch restaurant: ${response.statusText}`)
    }

    return response.json()
  }

  async getSearchSuggestions(query: string, token?: string): Promise<{ suggestions: string[] }> {
    const headers = this.getAuthHeaders(token);
    
    const response = await fetch(`${API_BASE_URL}/search/suggestions?q=${encodeURIComponent(query)}`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch suggestions: ${response.statusText}`)
    }

    return response.json()
  }

  // Chat API methods
  async sendChatMessage(message: string, sessionId: string, token?: string): Promise<ChatResponse> {
    const headers = this.getAuthHeaders(token);
    
    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, sessionId }),
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  // Stream chat messages
  async sendStreamingChatMessage(
    message: string, 
    sessionId: string,
    onToken: (token: string) => void,
    onComplete: (response: string) => void,
    onError?: (error: string) => void,
    authToken?: string
  ): Promise<void> {
    const controller = new AbortController();
    let fullResponse = '';
    
    try {
      const headers = this.getAuthHeaders(authToken);
      
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, sessionId }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onComplete(fullResponse);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.error) {
                onError?.(parsed.error);
                return;
              }

              if (parsed.token) {
                fullResponse += parsed.token;
                onToken(parsed.token);
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming response:', parseError);
            }
          }
        }
      }

      onComplete(fullResponse);
    } catch (error) {
      if (error instanceof Error) {
        onError?.(error.message);
      } else {
        onError?.('Unknown streaming error occurred');
      }
    }
  }

  // Get chat history
  async getChatHistory(sessionId: string, token?: string): Promise<ChatHistoryResponse> {
    const headers = this.getAuthHeaders(token);
    
    const response = await fetch(`${API_BASE_URL}/chat/history/${sessionId}`, {
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chat history: ${response.statusText}`);
    }

    return response.json();
  }

  // Clear chat session
  async clearChatSession(sessionId: string, token?: string): Promise<void> {
    const headers = this.getAuthHeaders(token);
    
    const response = await fetch(`${API_BASE_URL}/chat/clear/${sessionId}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to clear chat session: ${response.statusText}`);
    }
  }
}

export const apiService = new ApiService();

// Utility functions to transform backend data to frontend format
export function transformBackendRestaurant(backendRestaurant: BackendRestaurant): any {
  return {
    id: backendRestaurant.placeId,
    title: backendRestaurant.title || backendRestaurant.name,
    categoryName: backendRestaurant.categoryName || (Array.isArray(backendRestaurant.categories) ? backendRestaurant.categories[0] : backendRestaurant.cuisine?.[0]) || 'Restaurant',
    categories: backendRestaurant.categories || backendRestaurant.cuisine || ['Restaurant'],
    totalScore: backendRestaurant.totalScore || backendRestaurant.rating || (backendRestaurant.aiMatchScore ? backendRestaurant.aiMatchScore / 20 : 4.2),
    reviewsCount: backendRestaurant.reviewsCount || (backendRestaurant.reviews?.length || 0),
    price: backendRestaurant.averagePrice || convertPriceToRands(backendRestaurant.priceLevel || backendRestaurant.price),
    address: backendRestaurant.address || '',
    neighborhood: backendRestaurant.neighborhood || extractLocationString(backendRestaurant.location),
    reviewsTags: backendRestaurant.features || [],
    imagesCount: backendRestaurant.imageUrls?.length || backendRestaurant.images?.length || 3,
    imageUrls: backendRestaurant.imageUrls || backendRestaurant.images || getDefaultImages(),
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

function convertPriceToRands(priceLevel?: string): string {
  if (!priceLevel || priceLevel.trim() === '') {
    // Return a reasonable default range for restaurants
    return 'R200-400'
  }
  
  // Convert from backend price format to frontend format
  switch (priceLevel.toLowerCase()) {
    case '$':
    case 'inexpensive':
      return 'R100-200'
    case '$$':
    case 'moderate':
      return 'R200-400'
    case '$$$':
    case 'expensive':
      return 'R400-800'
    case '$$$$':
    case 'very expensive':
      return 'R800-1500'
    default:
      // If it already contains 'R', return as is
      if (priceLevel.includes('R')) {
        return priceLevel
      }
      // Default fallback
      return 'R200-400'
  }
}

function extractLocationString(location: string | { lat: number; lng: number }): string {
  if (typeof location === 'string') return location
  if (location && typeof location === 'object') return 'Cape Town'
  return 'Cape Town'
}

function getDefaultImages(): string[] {
  return [
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
    'https://images.pexels.com/photos/2788792/pexels-photo-2788792.jpeg',
    'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg'
  ]
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