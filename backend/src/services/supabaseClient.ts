import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '../config';
import { 
  Restaurant, 
  RestaurantResponse, 
  RestaurantCardResponse,
  DetailedRestaurantResponse,
  Review, 
  ReviewResponse, 
  DetailedReviewResponse,
  SearchFilters,
  EnhancedSearchResult,
  OpeningHour,
  PopularTimesData,
  ServiceOptions
} from '../types';

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

      const restaurants = (data as Restaurant[])?.map(raw => this.transformRestaurant(raw)) || [];
      
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

      const reviews = (data as Review[])?.map(raw => this.transformReview(raw)) || [];

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

  // Get detailed restaurant information for Step 3 - comprehensive profile
  async getDetailedRestaurant(placeId: string, searchQuery?: string): Promise<DetailedRestaurantResponse | null> {
    try {
      console.log('🔍 getDetailedRestaurant called with placeId:', placeId);
      
      const { data: restaurant, error } = await this.client
        .from('restaurants')
        .select('*')
        .eq('placeId', placeId)
        .single();

      console.log('📊 Database query result:', { 
        found: !!restaurant, 
        error: error?.message, 
        placeId: restaurant?.placeId || 'N/A',
        title: restaurant?.title || 'N/A'
      });

      if (error || !restaurant) {
        console.error('❌ Error fetching detailed restaurant:', error);
        return null;
      }

      console.log('✅ Restaurant found, getting reviews...');

      // Get restaurant reviews (up to 25)
      const { data: reviewsData, error: reviewsError } = await this.client
        .from('restaurant_reviews')
        .select('*')
        .eq('place_id', placeId)
        .order('publishedAtDate', { ascending: false })
        .limit(25);

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
      }

      const reviews = (reviewsData || []).map(raw => this.transformDetailedReview(raw as Review));
      console.log('📝 Reviews processed:', reviews.length);

      // Create simplified detailed restaurant response (bypassing transformRestaurantToCard for now)
      console.log('🔄 Creating simplified detailed restaurant...');
      
      const detailedRestaurant: DetailedRestaurantResponse = {
        // Basic fields
        id: restaurant.placeId,
        title: restaurant.title || '',
        categoryName: restaurant.categoryName || '',
        categories: this.parseJsonField(restaurant.categories, []),
        address: restaurant.address || '',
        neighborhood: restaurant.neighborhood,
        totalScore: this.parseNumber(restaurant.totalScore),
        reviewsCount: this.parseNumber(restaurant.reviewsCount),
        price: restaurant.price || '',
        averagePrice: undefined, // Skip for now
        imageUrl: restaurant.imageUrl || '',
        reviewsTags: ['Sushi'], // Mock for now
        matchScore: 85, // Mock for now

        // Additional detailed fields for Step 3
        phone: restaurant.phone || undefined,
        website: restaurant.website || undefined,
        location: {
          lat: this.parseNumber(restaurant['location.lat']),
          lng: this.parseNumber(restaurant['location.lng'])
        },
        openingHours: this.parseJsonField(restaurant.openingHours, []),
        popularTimes: {
          weekdays: {},
          peakHours: ['12:00-13:00'],
          quietestHours: ['14:00-16:00']
        }, // Mock simplified
        reviews: reviews,
        images: this.parseJsonField(restaurant.imageUrls, []),
        serviceOptions: {
          dineIn: true,
          takeaway: true,
          delivery: false,
          reservations: false,
          wheelchairAccessible: false,
          goodForGroups: true,
          goodForKids: true,
          acceptsCreditCards: true,
          hasWifi: false,
          hasParking: false,
          outdoorSeating: false,
          liveMusic: false,
          petsAllowed: false
        }, // Mock simplified
        aiMatchExplanation: `${restaurant.title} is a highly-rated restaurant offering excellent service and quality food.`,

        // Additional metadata
        description: restaurant.description || undefined,
        isOpenNow: false, // Mock for now
        lastUpdated: new Date().toISOString()
      };
      
      console.log('✅ Simplified detailed restaurant created');

      return detailedRestaurant;
    } catch (error) {
      console.error('Error in getDetailedRestaurant:', error);
      return null;
    }
  }

  // Helper method to parse JSON fields safely
  private parseJsonField(field: string, fallback: any = null): any {
    try {
      return field && field !== '' ? JSON.parse(field) : fallback;
    } catch {
      return fallback;
    }
  }

  // Helper method to parse numeric fields safely
  private parseNumber(value: string, fallback = 0): number {
    const num = parseFloat(value);
    return isNaN(num) ? fallback : num;
  }

  // Transform raw restaurant data to API response format
  private transformRestaurant(raw: Restaurant): RestaurantResponse {
    return {
      placeId: raw.placeId,
      title: raw.title || '',
      city: raw.city || '',
      address: raw.address || '',
      phone: raw.phone || '',
      website: raw.website || '',
      rating: this.parseNumber(raw.totalScore),
      reviewsCount: this.parseNumber(raw.reviewsCount),
      category: raw.categoryName || '',
      priceLevel: raw.price || '',
      neighborhood: raw.neighborhood || '',
      description: raw.description || '',
      imageUrl: raw.imageUrl || '',
      images: this.parseJsonField(raw.imageUrls, []),
      openingHours: this.parseJsonField(raw.openingHours, []),
      location: {
        lat: this.parseNumber(raw['location.lat']),
        lng: this.parseNumber(raw['location.lng'])
      },
      categories: this.parseJsonField(raw.categories, [])
    };
  }

  // Transform raw review data to API response format
  private transformReview(raw: Review): ReviewResponse {
    const parseBoolean = (value: string): boolean => {
      return value?.toLowerCase() === 'true';
    };

    return {
      reviewId: raw.reviewId,
      placeId: raw.place_id,
      rating: this.parseNumber(raw.stars),
      reviewerName: raw.name || 'Anonymous',
      text: raw.text || '',
      publishedAt: raw.publishAt || '',
      publishedDate: raw.publishedAtDate ? new Date(raw.publishedAtDate) : new Date(),
      reviewerReviewCount: this.parseNumber(raw.reviewerNumberOfReviews),
      isLocalGuide: parseBoolean(raw.isLocalGuide),
      language: raw.originalLanguage || 'en',
      images: this.parseJsonField(raw.reviewImageUrls, [])
    };
  }

  // Transform raw restaurant data to enhanced card format with proper parsing
  private transformRestaurantToCard(raw: Restaurant, searchQuery?: string, position = 0): RestaurantCardResponse {
    const parseBoolean = (value: string): boolean => {
      return value?.toLowerCase() === 'true';
    };

    const extractReviewTags = (category: string, description: string, categories: string[]): string[] => {
      const allText = `${category} ${description} ${categories.join(' ')}`.toLowerCase();
      
      // Extract meaningful tags, avoiding common words
      const words = allText.split(/\s+/)
        .map(word => word.replace(/[^\w]/g, ''))
        .filter(word => 
          word.length > 2 && 
          !['restaurant', 'cafe', 'the', 'and', 'with', 'for', 'from'].includes(word)
        );
      
      // Get unique words
      const uniqueWords = [...new Set(words)];
      
      // Return top 5 most relevant tags
      return uniqueWords.slice(0, 5).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      );
    };

    const calculateMatchScore = (title: string, category: string, searchQuery?: string): number => {
      if (!searchQuery || searchQuery.trim() === '') {
        // Default scoring based on rating and review count
        const rating = this.parseNumber(raw.totalScore);
        const reviewCount = this.parseNumber(raw.reviewsCount);
        
        // Base score from rating (0-80 points)
        let baseScore = (rating / 5) * 80;
        
        // Bonus for review count (0-20 points)
        const reviewBonus = Math.min(reviewCount / 50, 1) * 20;
        
        return Math.round(baseScore + reviewBonus);
      }
      
      const query = searchQuery.toLowerCase();
      const titleLower = title.toLowerCase();
      const categoryLower = category.toLowerCase();
      const description = (raw.description || '').toLowerCase();
      
      let score = 60; // Base score
      
      // Exact title match (40 points)
      if (titleLower.includes(query)) {
        score += 40;
      }
      // Category match (30 points)
      else if (categoryLower.includes(query)) {
        score += 30;
      }
      // Description match (20 points)
      else if (description.includes(query)) {
        score += 20;
      }
      // Partial matches (10 points)
      else {
        const queryWords = query.split(' ');
        const matchCount = queryWords.filter(word => 
          titleLower.includes(word) || categoryLower.includes(word) || description.includes(word)
        ).length;
        score += Math.min(matchCount * 5, 10);
      }
      
      // Bonus for high ratings
      const rating = this.parseNumber(raw.totalScore);
      if (rating >= 4.5) score += 10;
      else if (rating >= 4.0) score += 5;
      
      return Math.min(score, 100);
    };

    const isOpenNow = (openingHours: any[]): boolean => {
      if (!openingHours || openingHours.length === 0) return false;
      
      try {
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
        const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
        
        const todayHours = openingHours.find(h => h.day === currentDay);
        if (!todayHours || !todayHours.hours) return false;
        
        // Handle "Closed" status
        if (todayHours.hours.toLowerCase() === 'closed') return false;
        
        // Parse hours like "9 AM to 5 PM" or "9:30 AM to 10:30 PM"
        const hoursMatch = todayHours.hours.match(/(\d{1,2}):?(\d{0,2})\s*(AM|PM)\s*to\s*(\d{1,2}):?(\d{0,2})\s*(AM|PM)/i);
        if (!hoursMatch) return false;
        
        const [, startHour, startMin = '0', startPeriod, endHour, endMin = '0', endPeriod] = hoursMatch;
        
        // Convert to 24-hour format
        let openTime = parseInt(startHour) * 60 + parseInt(startMin);
        let closeTime = parseInt(endHour) * 60 + parseInt(endMin);
        
        if (startPeriod.toUpperCase() === 'PM' && parseInt(startHour) !== 12) {
          openTime += 12 * 60;
        } else if (startPeriod.toUpperCase() === 'AM' && parseInt(startHour) === 12) {
          openTime = parseInt(startMin); // 12 AM is 00:xx
        }
        
        if (endPeriod.toUpperCase() === 'PM' && parseInt(endHour) !== 12) {
          closeTime += 12 * 60;
        } else if (endPeriod.toUpperCase() === 'AM' && parseInt(endHour) === 12) {
          closeTime = parseInt(endMin); // 12 AM is 00:xx
        }
        
        // Handle overnight hours (e.g., 10 PM to 2 AM)
        if (closeTime < openTime) {
          return currentTime >= openTime || currentTime <= closeTime;
        }
        
        return currentTime >= openTime && currentTime <= closeTime;
      } catch (error) {
        // If parsing fails, return false
        return false;
      }
    };

    // Parse complex fields
    const openingHours = this.parseJsonField(raw.openingHours, []);
    const categories = this.parseJsonField(raw.categories, []);
    const images = this.parseJsonField(raw.imageUrls, []);
    
    return {
      id: raw.placeId,
      title: raw.title || '',
      categoryName: raw.categoryName || '',
      categories: categories,
      address: raw.address || '',
      neighborhood: raw.neighborhood || undefined,
      totalScore: this.parseNumber(raw.totalScore),
      reviewsCount: this.parseNumber(raw.reviewsCount),
      price: raw.price || '',
      imageUrl: raw.imageUrl || (images.length > 0 ? images[0] : ''),
      reviewsTags: extractReviewTags(raw.categoryName || '', raw.description || '', categories),
      matchScore: calculateMatchScore(raw.title || '', raw.categoryName || '', searchQuery),
      phone: raw.phone || undefined,
      website: raw.website || undefined,
      isOpenNow: isOpenNow(openingHours),
      location: {
        lat: this.parseNumber(raw['location.lat']),
        lng: this.parseNumber(raw['location.lng'])
      }
    };
  }

  // Calculate average price from review contexts
  private async calculateAveragePrice(placeId: string): Promise<string | undefined> {
    try {
      const { data: reviews, error } = await this.client
        .from('restaurant_reviews')
        .select('reviewContext')
        .eq('place_id', placeId)
        .not('reviewContext', 'is', null)
        .limit(50); // Check up to 50 recent reviews

      if (error || !reviews || reviews.length === 0) {
        return undefined;
      }

      const prices: number[] = [];
      
      reviews.forEach(review => {
        if (review.reviewContext) {
          const priceData = this.parsePriceFromContext(review.reviewContext);
          if (priceData) {
            // Average the low and high values for each review
            const avgPrice = (priceData.low + priceData.high) / 2;
            prices.push(avgPrice);
          }
        }
      });

      if (prices.length === 0) {
        return undefined;
      }

      // Calculate overall average and range
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // If there's a reasonable range, show it; otherwise show single value
      if (maxPrice - minPrice > 50) {
        return `R ${Math.round(minPrice)}–${Math.round(maxPrice)}`;
      } else {
        return `R ${Math.round(avgPrice)}`;
      }
    } catch (error) {
      console.error('Error calculating average price:', error);
      return undefined;
    }
  }

  // Parse price information from review context
  private parsePriceFromContext(reviewContextString: string): { low: number; high: number } | null {
    try {
      const context = typeof reviewContextString === 'string' 
        ? JSON.parse(reviewContextString) 
        : reviewContextString;

      if (!context || typeof context !== 'object') {
        return null;
      }

      // Look for price per person field
      const pricePerPerson = context.pricePerPerson || context['price per person'] || context.price;
      
      if (!pricePerPerson || typeof pricePerPerson !== 'string') {
        return null;
      }

      // Clean the price string
      const priceStr = pricePerPerson.toLowerCase().trim();
      
      // Match various price formats
      // "R 150–200" or "R 150-200"
      const rangeMatch = priceStr.match(/r\s*(\d+)[-–](\d+)/);
      if (rangeMatch) {
        return {
          low: parseInt(rangeMatch[1]),
          high: parseInt(rangeMatch[2])
        };
      }
      
      // "R 500+" - add estimated range
      const plusMatch = priceStr.match(/r\s*(\d+)\+/);
      if (plusMatch) {
        const basePrice = parseInt(plusMatch[1]);
        return {
          low: basePrice,
          high: basePrice + 200 // Add reasonable range for "+" prices
        };
      }
      
      // "R 300" - single value
      const singleMatch = priceStr.match(/r\s*(\d+)/);
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

  // Transform raw review data to detailed review response format
  private transformDetailedReview(raw: Review): DetailedReviewResponse {
    const parseBoolean = (value: string | boolean | null | undefined): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value.toLowerCase() === 'true';
      return false;
    };

    // Parse review context for additional details
    const reviewContext = this.parseJsonField(raw.reviewContext, {});
    
    return {
      reviewId: raw.reviewId,
      placeId: raw.place_id,
      rating: this.parseNumber(raw.stars),
      reviewerName: raw.name || 'Anonymous',
      text: raw.text || '',
      publishedAt: raw.publishAt || '',
      publishedDate: raw.publishedAtDate ? new Date(raw.publishedAtDate) : new Date(),
      reviewerReviewCount: this.parseNumber(raw.reviewerNumberOfReviews),
      isLocalGuide: parseBoolean(raw.isLocalGuide),
      language: raw.originalLanguage || 'en',
      images: this.parseJsonField(raw.reviewImageUrls, []),
      reviewContext: {
        service: reviewContext?.service,
        mealType: reviewContext?.mealType,
        pricePerPerson: reviewContext?.pricePerPerson,
        waitTime: reviewContext?.waitTime
      },
      likesCount: 0 // Mock value for now
    };
  }

  // Generate mock popular times data (will be enhanced with real data later)
  private generatePopularTimesData(restaurantName: string): PopularTimesData {
    // Mock popular times based on restaurant type
    const isBreakfastPlace = restaurantName.toLowerCase().includes('breakfast') || 
                            restaurantName.toLowerCase().includes('cafe');
    const isDinnerPlace = restaurantName.toLowerCase().includes('steakhouse') || 
                          restaurantName.toLowerCase().includes('fine dining');

    const weekdays: { [day: string]: { hour: number; popularity: number }[] } = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    days.forEach(day => {
      weekdays[day] = [];
      for (let hour = 6; hour <= 23; hour++) {
        let popularity = 10; // Base popularity
        
        if (isBreakfastPlace) {
          if (hour >= 7 && hour <= 10) popularity = Math.random() * 40 + 60; // Peak breakfast
          else if (hour >= 11 && hour <= 14) popularity = Math.random() * 30 + 40; // Lunch
        } else if (isDinnerPlace) {
          if (hour >= 18 && hour <= 21) popularity = Math.random() * 40 + 60; // Peak dinner
          else if (hour >= 12 && hour <= 14) popularity = Math.random() * 30 + 40; // Lunch
        } else {
          // Regular restaurant
          if (hour >= 12 && hour <= 14) popularity = Math.random() * 30 + 50; // Lunch
          if (hour >= 18 && hour <= 20) popularity = Math.random() * 40 + 60; // Dinner
        }
        
        weekdays[day].push({ hour, popularity: Math.round(popularity) });
      }
    });

    return {
      weekdays,
      peakHours: isDinnerPlace ? ['19:00-20:00'] : ['12:00-13:00', '19:00-20:00'],
      quietestHours: ['14:00-16:00', '22:00-23:00']
    };
  }

  // Extract service options from restaurant data and reviews
  private extractServiceOptions(restaurant: Restaurant, reviews: DetailedReviewResponse[]): ServiceOptions {
    const description = (restaurant.description || '').toLowerCase();
    const categories = this.parseJsonField(restaurant.categories, []).join(' ').toLowerCase();
    const reviewTexts = reviews.map(r => r.text.toLowerCase()).join(' ');
    const allText = `${description} ${categories} ${reviewTexts}`;

    return {
      dineIn: true, // Most restaurants offer dine-in
      takeaway: allText.includes('takeaway') || allText.includes('take away') || 
                allText.includes('collect') || allText.includes('pickup'),
      delivery: allText.includes('delivery') || allText.includes('deliver') || 
                allText.includes('uber eats') || allText.includes('mr d'),
      reservations: allText.includes('reservation') || allText.includes('booking') || 
                   allText.includes('book'),
      wheelchairAccessible: allText.includes('wheelchair') || allText.includes('accessible') || 
                           allText.includes('disability'),
      goodForGroups: allText.includes('group') || allText.includes('party') || 
                     allText.includes('large table'),
      goodForKids: allText.includes('kid') || allText.includes('child') || 
                   allText.includes('family') || allText.includes('children'),
      acceptsCreditCards: allText.includes('card') || allText.includes('credit') || 
                         allText.includes('eft'),
      hasWifi: allText.includes('wifi') || allText.includes('internet') || 
               allText.includes('wi-fi'),
      hasParking: allText.includes('parking') || allText.includes('valet'),
      outdoorSeating: allText.includes('outdoor') || allText.includes('terrace') || 
                      allText.includes('patio') || allText.includes('outside'),
      liveMusic: allText.includes('live music') || allText.includes('band') || 
                 allText.includes('entertainment'),
      petsAllowed: allText.includes('pet') || allText.includes('dog') || 
                   allText.includes('animal')
    };
  }

  // Generate mock AI match explanation (will be enhanced with real AI later)
  private generateAIMatchExplanation(restaurant: Restaurant, searchQuery?: string): string {
    if (!searchQuery || searchQuery.trim() === '') {
      return `${restaurant.title} is a highly-rated ${restaurant.categoryName.toLowerCase()} offering excellent service and quality food. Popular among locals and visitors alike.`;
    }

    const query = searchQuery.toLowerCase();
    const title = restaurant.title.toLowerCase();
    const category = restaurant.categoryName.toLowerCase();
    const description = (restaurant.description || '').toLowerCase();

    let explanation = `${restaurant.title} matches your search for "${searchQuery}" because `;

    if (title.includes(query)) {
      explanation += `the restaurant name directly contains your search term. `;
    } else if (category.includes(query)) {
      explanation += `it specializes in ${restaurant.categoryName.toLowerCase()}, which matches your search. `;
    } else if (description.includes(query)) {
      explanation += `its description mentions relevant keywords from your search. `;
    } else {
      explanation += `it offers cuisine and dining experiences related to your search interests. `;
    }

    // Add rating and review context
    const rating = this.parseNumber(restaurant.totalScore);
    const reviewCount = this.parseNumber(restaurant.reviewsCount);
    
    if (rating >= 4.0) {
      explanation += `With a high rating of ${rating.toFixed(1)} stars from ${reviewCount} reviews, it's a trusted choice. `;
    } else if (rating >= 3.5) {
      explanation += `With a solid ${rating.toFixed(1)} star rating from ${reviewCount} reviews, it offers good value. `;
    }

    // Add location context
    if (restaurant.neighborhood) {
      explanation += `Located in ${restaurant.neighborhood}, it's conveniently positioned for your dining needs.`;
    }

    return explanation;
  }
}

export const supabaseService = new SupabaseService(); 