import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config';
import { Restaurant, Review, RestaurantResponse, ReviewResponse, SearchFilters, RestaurantCardResponse, EnhancedSearchResult, OpeningHour } from '../types';

class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  }

  // Test database connection
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('restaurants')
        .select('placeId')
        .limit(1);
      
      return !error && Array.isArray(data);
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
  }

  // Get restaurant by ID
  async getRestaurantById(placeId: string): Promise<RestaurantResponse | null> {
    try {
      const { data, error } = await this.client
        .from('restaurants')
        .select('*')
        .eq('placeId', placeId)
        .single();

      if (error || !data) {
        console.error('Error fetching restaurant:', error);
        return null;
      }

      return this.transformRestaurant(data as Restaurant);
    } catch (error) {
      console.error('Error in getRestaurantById:', error);
      return null;
    }
  }

  // Get restaurants with basic search and filtering
  async getRestaurants(
    query?: string, 
    filters?: SearchFilters, 
    limit = 20, 
    offset = 0
  ): Promise<{ restaurants: RestaurantResponse[]; total: number }> {
    try {
      let queryBuilder = this.client
        .from('restaurants')
        .select('*', { count: 'exact' });

      // Apply text search if provided
      if (query && query.trim()) {
        // Search in title, categoryName, and neighborhood
        queryBuilder = queryBuilder.or(
          `title.ilike.%${query}%,categoryName.ilike.%${query}%,neighborhood.ilike.%${query}%,city.ilike.%${query}%`
        );
      }

      // Apply filters
      if (filters) {
        if (filters.category) {
          queryBuilder = queryBuilder.ilike('categoryName', `%${filters.category}%`);
        }
        if (filters.city) {
          queryBuilder = queryBuilder.eq('city', filters.city);
        }
        if (filters.neighborhood) {
          queryBuilder = queryBuilder.eq('neighborhood', filters.neighborhood);
        }
        if (filters.priceLevel && filters.priceLevel.length > 0) {
          queryBuilder = queryBuilder.in('price', filters.priceLevel);
        }
        if (filters.rating) {
          // Convert rating filter to work with totalScore as string
          queryBuilder = queryBuilder.gte('totalScore', filters.rating.toString());
        }
      }

      // Apply pagination
      queryBuilder = queryBuilder
        .range(offset, offset + limit - 1)
        .order('totalScore', { ascending: false }); // Order by rating

      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('Error fetching restaurants:', error);
        return { restaurants: [], total: 0 };
      }

      const restaurants = (data as Restaurant[])?.map(this.transformRestaurant) || [];
      
      return {
        restaurants,
        total: count || 0
      };
    } catch (error) {
      console.error('Error in getRestaurants:', error);
      return { restaurants: [], total: 0 };
    }
  }

  // Get reviews for a restaurant
  async getReviewsForRestaurant(
    placeId: string, 
    limit = 10, 
    offset = 0
  ): Promise<{ reviews: ReviewResponse[]; total: number }> {
    try {
      const { data, error, count } = await this.client
        .from('restaurant_reviews')
        .select('*', { count: 'exact' })
        .eq('place_id', placeId)
        .order('publishedAtDate', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching reviews:', error);
        return { reviews: [], total: 0 };
      }

      const reviews = (data as Review[])?.map(this.transformReview) || [];

      return {
        reviews,
        total: count || 0
      };
    } catch (error) {
      console.error('Error in getReviewsForRestaurant:', error);
      return { reviews: [], total: 0 };
    }
  }

  // Get all unique categories for filtering
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await this.client
        .from('restaurants')
        .select('categoryName')
        .not('categoryName', 'is', null)
        .not('categoryName', 'eq', '');

      if (error || !data) {
        console.error('Error fetching categories:', error);
        return [];
      }

      // Get unique categories
      const categories = [...new Set(data.map(item => item.categoryName))];
      return categories.filter(Boolean).sort();
    } catch (error) {
      console.error('Error in getCategories:', error);
      return [];
    }
  }

  // Get all unique neighborhoods for filtering
  async getNeighborhoods(city?: string): Promise<string[]> {
    try {
      let queryBuilder = this.client
        .from('restaurants')
        .select('neighborhood')
        .not('neighborhood', 'is', null)
        .not('neighborhood', 'eq', '');

      if (city) {
        queryBuilder = queryBuilder.eq('city', city);
      }

      const { data, error } = await queryBuilder;

      if (error || !data) {
        console.error('Error fetching neighborhoods:', error);
        return [];
      }

      // Get unique neighborhoods
      const neighborhoods = [...new Set(data.map(item => item.neighborhood))];
      return neighborhoods.filter(Boolean).sort();
    } catch (error) {
      console.error('Error in getNeighborhoods:', error);
      return [];
    }
  }

  // Enhanced restaurant search for Step 2 - optimized for frontend cards
  async getRestaurantsEnhanced(
    query?: string,
    filters?: SearchFilters,
    limit = 20,
    offset = 0,
    sortBy: 'relevance' | 'rating' | 'reviewCount' = 'relevance'
  ): Promise<EnhancedSearchResult> {
    const startTime = Date.now();
    
    try {
      let queryBuilder = this.client
        .from('restaurants')
        .select('*', { count: 'exact' });

      // Apply search query
      if (query && query.trim()) {
        const searchTerm = query.trim();
        // Search across multiple fields for better matching
        queryBuilder = queryBuilder.or(
          `title.ilike.%${searchTerm}%,` +
          `categoryName.ilike.%${searchTerm}%,` +
          `neighborhood.ilike.%${searchTerm}%,` +
          `description.ilike.%${searchTerm}%,` +
          `address.ilike.%${searchTerm}%`
        );
      }

      // Apply filters
      let searchType: 'keyword' | 'category' | 'neighborhood' = 'keyword';
      if (filters) {
        if (filters.category) {
          queryBuilder = queryBuilder.eq('categoryName', filters.category);
          searchType = 'category';
        }
        if (filters.city) {
          queryBuilder = queryBuilder.eq('city', filters.city);
        }
        if (filters.neighborhood) {
          queryBuilder = queryBuilder.eq('neighborhood', filters.neighborhood);
          searchType = 'neighborhood';
        }
        if (filters.priceLevel && filters.priceLevel.length > 0) {
          queryBuilder = queryBuilder.in('price', filters.priceLevel);
        }
        if (filters.rating) {
          // Convert rating filter to work with totalScore as string
          queryBuilder = queryBuilder.gte('totalScore', filters.rating.toString());
        }
      }

      // Apply sorting
      let resultsSorted: 'relevance' | 'rating' | 'reviewCount' = 'relevance';
      switch (sortBy) {
        case 'rating':
          queryBuilder = queryBuilder.order('totalScore', { ascending: false });
          resultsSorted = 'rating';
          break;
        case 'reviewCount':
          queryBuilder = queryBuilder.order('reviewsCount', { ascending: false });
          resultsSorted = 'reviewCount';
          break;
        default:
          // For relevance, order by rating as default (will enhance with match scoring later)
          queryBuilder = queryBuilder.order('totalScore', { ascending: false });
          break;
      }

      // Apply pagination
      queryBuilder = queryBuilder.range(offset, offset + limit - 1);

      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('Error fetching restaurants:', error);
        return { 
          restaurants: [], 
          total: 0, 
          hasMore: false,
          query: query || '',
          filters 
        };
      }

      // Transform restaurants with average price calculation
      const restaurants = await Promise.all(
        (data as Restaurant[])?.map(async (raw, index) => {
          const restaurantCard = this.transformRestaurantToCard(raw, query, index + offset);
          // Calculate average price from reviews
          restaurantCard.averagePrice = await this.calculateAveragePrice(raw.placeId);
          return restaurantCard;
        }) || []
      );

      const searchTime = Date.now() - startTime;
      
      return {
        restaurants,
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
        query: query || '',
        filters,
        searchMetadata: {
          searchType,
          searchTime,
          resultsSorted
        }
      };
    } catch (error) {
      console.error('Error in getRestaurantsEnhanced:', error);
      return { 
        restaurants: [], 
        total: 0, 
        hasMore: false,
        query: query || '',
        filters 
      };
    }
  }

  // Transform raw restaurant data to API response format
  private transformRestaurant(raw: Restaurant): RestaurantResponse {
    // Parse JSON fields safely
    const parseJsonField = (field: string, fallback: any = null) => {
      try {
        return field && field !== '' ? JSON.parse(field) : fallback;
      } catch {
        return fallback;
      }
    };

    // Parse numeric fields safely
    const parseNumber = (value: string, fallback = 0): number => {
      const num = parseFloat(value);
      return isNaN(num) ? fallback : num;
    };

    return {
      placeId: raw.placeId,
      title: raw.title || '',
      city: raw.city || '',
      address: raw.address || '',
      phone: raw.phone || '',
      website: raw.website || '',
      rating: parseNumber(raw.totalScore),
      reviewsCount: parseNumber(raw.reviewsCount),
      category: raw.categoryName || '',
      priceLevel: raw.price || '',
      neighborhood: raw.neighborhood || '',
      description: raw.description || '',
      imageUrl: raw.imageUrl || '',
      images: parseJsonField(raw.imageUrls, []),
      openingHours: parseJsonField(raw.openingHours, []),
      location: {
        lat: parseNumber(raw['location.lat']),
        lng: parseNumber(raw['location.lng'])
      },
      categories: parseJsonField(raw.categories, [])
    };
  }

  // Transform raw review data to API response format
  private transformReview(raw: Review): ReviewResponse {
    const parseJsonField = (field: string, fallback: any = null) => {
      try {
        return field && field !== '' ? JSON.parse(field) : fallback;
      } catch {
        return fallback;
      }
    };

    const parseNumber = (value: string, fallback = 0): number => {
      const num = parseFloat(value);
      return isNaN(num) ? fallback : num;
    };

    const parseBoolean = (value: string): boolean => {
      return value?.toLowerCase() === 'true';
    };

    return {
      reviewId: raw.reviewId,
      placeId: raw.place_id,
      rating: parseNumber(raw.stars),
      reviewerName: raw.name || 'Anonymous',
      text: raw.text || '',
      publishedAt: raw.publishAt || '',
      publishedDate: raw.publishedAtDate ? new Date(raw.publishedAtDate) : new Date(),
      reviewerReviewCount: parseNumber(raw.reviewerNumberOfReviews),
      isLocalGuide: parseBoolean(raw.isLocalGuide),
      language: raw.originalLanguage || 'en',
      images: parseJsonField(raw.reviewImageUrls, [])
    };
  }

  // Transform raw restaurant data to enhanced card format with proper parsing
  private transformRestaurantToCard(raw: Restaurant, searchQuery?: string, position = 0): RestaurantCardResponse {
    // Parse JSON fields safely
    const parseJsonField = (field: string, fallback: any = null) => {
      try {
        return field && field !== '' ? JSON.parse(field) : fallback;
      } catch {
        return fallback;
      }
    };

    // Parse numeric fields safely
    const parseNumber = (value: string, fallback = 0): number => {
      const num = parseFloat(value);
      return isNaN(num) ? fallback : num;
    };

    // Parse boolean fields safely
    const parseBoolean = (value: string): boolean => {
      return value?.toLowerCase() === 'true';
    };

    // Extract review tags from category and description
    const extractReviewTags = (category: string, description: string, categories: string[]): string[] => {
      const tags: Set<string> = new Set();
      
      // Add category-based tags
      if (category) {
        // Extract keywords from category name
        const categoryWords = category.toLowerCase().split(/\s+|restaurant|cafe|bar|food/).filter(Boolean);
        categoryWords.forEach(word => {
          if (word.length > 2) {
            tags.add(word.charAt(0).toUpperCase() + word.slice(1));
          }
        });
      }

      // Add tags from categories array
      categories.forEach(cat => {
        if (cat && cat !== category) {
          const catWords = cat.toLowerCase().split(/\s+|restaurant|cafe|bar|food/).filter(Boolean);
          catWords.forEach(word => {
            if (word.length > 2) {
              tags.add(word.charAt(0).toUpperCase() + word.slice(1));
            }
          });
        }
      });

      // Add common food-related tags based on description
      if (description) {
        const foodTags = ['takeaway', 'delivery', 'authentic', 'fresh', 'organic', 'healthy', 'spicy', 'vegetarian', 'vegan'];
        const descLower = description.toLowerCase();
        foodTags.forEach(tag => {
          if (descLower.includes(tag)) {
            tags.add(tag.charAt(0).toUpperCase() + tag.slice(1));
          }
        });
      }

      return Array.from(tags).slice(0, 5); // Limit to 5 tags
    };

    // Calculate match score (mock implementation for now)
    const calculateMatchScore = (title: string, category: string, searchQuery?: string): number => {
      if (!searchQuery) return 85; // Default high score
      
      const query = searchQuery.toLowerCase();
      const titleLower = title.toLowerCase();
      const categoryLower = category.toLowerCase();
      
      let score = 60; // Base score
      
      // Exact title match
      if (titleLower.includes(query)) {
        score += 30;
      }
      
      // Category match
      if (categoryLower.includes(query)) {
        score += 20;
      }
      
      // Partial word matches
      const queryWords = query.split(' ');
      queryWords.forEach(word => {
        if (word.length > 2) {
          if (titleLower.includes(word)) score += 10;
          if (categoryLower.includes(word)) score += 5;
        }
      });
      
      // Adjust score based on position (first results get slight boost)
      if (position < 5) score += 5;
      
      return Math.min(100, Math.max(0, score));
    };

    // Check if restaurant is open now (basic implementation)
    const isOpenNow = (openingHours: any[]): boolean => {
      try {
        if (!openingHours || openingHours.length === 0) return false;
        
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
        const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format
        
        const todayHours = openingHours.find(h => h.day === currentDay);
        if (!todayHours || !todayHours.hours) return false;
        
        // Simple check for "X AM to Y PM" format
        const hoursMatch = todayHours.hours.match(/(\d+):\d+\s*(AM|PM)\s*to\s*(\d+):\d+\s*(AM|PM)/i);
        if (hoursMatch) {
          let openTime = parseInt(hoursMatch[1]);
          let closeTime = parseInt(hoursMatch[3]);
          
          if (hoursMatch[2].toUpperCase() === 'PM' && openTime !== 12) openTime += 12;
          if (hoursMatch[4].toUpperCase() === 'PM' && closeTime !== 12) closeTime += 12;
          
          const openTimeHHMM = openTime * 100;
          const closeTimeHHMM = closeTime * 100;
          
          return currentTime >= openTimeHHMM && currentTime <= closeTimeHHMM;
        }
        
        return false;
      } catch {
        return false;
      }
    };

    const categories = parseJsonField(raw.categories, []);
    const openingHours = parseJsonField(raw.openingHours, []);
    const reviewTags = extractReviewTags(raw.categoryName || '', raw.description || '', categories);
    const matchScore = calculateMatchScore(raw.title || '', raw.categoryName || '', searchQuery);

    return {
      id: raw.placeId,
      title: raw.title || '',
      categoryName: raw.categoryName || '',
      categories,
      address: raw.address || '',
      neighborhood: raw.neighborhood || undefined,
      totalScore: parseNumber(raw.totalScore),
      reviewsCount: parseNumber(raw.reviewsCount),
      price: raw.price || '',
      imageUrl: raw.imageUrl || '',
      reviewsTags: reviewTags,
      matchScore,
      phone: raw.phone || undefined,
      website: raw.website || undefined,
      isOpenNow: isOpenNow(openingHours),
      location: {
        lat: parseNumber(raw['location.lat']),
        lng: parseNumber(raw['location.lng'])
      }
    };
  }

  // Calculate average price range from review contexts
  private async calculateAveragePrice(placeId: string): Promise<string | undefined> {
    try {
      const { data: reviews, error } = await this.client
        .from('restaurant_reviews')
        .select('reviewContext')
        .eq('place_id', placeId)
        .not('reviewContext', 'is', null)
        .not('reviewContext', 'eq', '');

      if (error || !reviews || reviews.length === 0) {
        return undefined;
      }

      const priceRanges: { low: number; high: number }[] = [];

      for (const review of reviews) {
        const priceRange = this.parsePriceFromContext(review.reviewContext);
        if (priceRange) {
          priceRanges.push(priceRange);
        }
      }

      if (priceRanges.length === 0) {
        return undefined;
      }

      // Calculate average low and high
      const avgLow = Math.round(priceRanges.reduce((sum, range) => sum + range.low, 0) / priceRanges.length);
      const avgHigh = Math.round(priceRanges.reduce((sum, range) => sum + range.high, 0) / priceRanges.length);

      // Format the result
      if (avgLow === avgHigh) {
        return `R ${avgLow}`;
      } else {
        return `R ${avgLow}–${avgHigh}`;
      }
    } catch (error) {
      console.error('Error calculating average price:', error);
      return undefined;
    }
  }

  // Parse price per person from review context
  private parsePriceFromContext(reviewContextString: string): { low: number; high: number } | null {
    try {
      const context = JSON.parse(reviewContextString);
      const pricePerPerson = context['Price per person'];
      
      if (!pricePerPerson || typeof pricePerPerson !== 'string') {
        return null;
      }

      // Remove R and currency symbols, extract numbers
      const priceText = pricePerPerson.replace(/R\s*|\u00a0/g, '').trim();
      
      // Handle different formats:
      // "150–200" or "150-200"
      const rangeMatch = priceText.match(/(\d+)[\u2013\u2014-]+(\d+)/);
      if (rangeMatch) {
        return {
          low: parseInt(rangeMatch[1]),
          high: parseInt(rangeMatch[2])
        };
      }
      
      // Handle "500+" format
      const plusMatch = priceText.match(/(\d+)\+/);
      if (plusMatch) {
        const basePrice = parseInt(plusMatch[1]);
        return {
          low: basePrice,
          high: basePrice + 200 // Estimate +200 for open-ended ranges
        };
      }
      
      // Handle single number "300"
      const singleMatch = priceText.match(/^(\d+)$/);
      if (singleMatch) {
        const price = parseInt(singleMatch[1]);
        return {
          low: price,
          high: price
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
const supabaseService = new SupabaseService();
export { supabaseService }; 