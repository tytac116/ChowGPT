import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import { SearchFilters } from './searchService';
import { supabaseService } from './supabaseClient';

export interface HybridSearchRequest {
  originalQuery: string;
  rewrittenQuery: string;
  filters?: SearchFilters;
  limit: number;
}

export interface VectorSearchResult {
  placeId: string;
  vectorScore: number;
  chunkType: string;
  chunkContent: string;
}

export interface RestaurantCandidate {
  placeId: string;
  name: string;
  cuisine: string[];
  location: string;
  description?: string;
  rating?: number;
  priceLevel?: number;
  features: string[];
  vectorScore: number;
  keywordScore: number;
  reviews: any[];
  operatingHours?: string;
  parkingInfo?: string;
}

export class HybridSearchService {
  private pinecone: Pinecone;
  private openai: OpenAI;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  /**
   * Execute hybrid search combining vector and keyword search
   */
  async executeHybridSearch(request: HybridSearchRequest): Promise<RestaurantCandidate[]> {
    try {
      console.log('🔍 Executing hybrid search...');
      console.log(`   📝 Original query: ${request.originalQuery}`);
      console.log(`   ✏️  Rewritten query: ${request.rewrittenQuery}`);

      // Step 1: Vector search
      console.log('   📊 Performing vector search...');
      const vectorResults = await this.performVectorSearch(request.rewrittenQuery, 30);
      console.log(`   🔍 Pinecone returned ${vectorResults.length} matches`);

      if (vectorResults.length === 0) {
        console.log('   ⚠️ No vector results found, falling back to keyword-only search');
        return this.performKeywordOnlySearch(request.originalQuery, request.limit);
      }

      // Step 2: Get basic restaurant info for initial ranking (lightweight)
      const uniquePlaceIds = this.extractUniqueRestaurants(vectorResults);
      console.log(`   ${uniquePlaceIds.length} unique restaurants from vector search`);
      
      // Step 3: Get basic restaurant data for keyword scoring (no reviews yet)
      const basicRestaurants = await this.fetchBasicRestaurantInfo(uniquePlaceIds);
      console.log(`   📋 Found ${basicRestaurants.length} restaurant details`);

      // Step 4: Calculate keyword scores
      const keywordScores = await this.calculateKeywordScores(request.originalQuery, basicRestaurants);

      // Step 5: Combine scores and get initial ranking
      const initialCandidates = this.combineScores(vectorResults, basicRestaurants, keywordScores);
      
      // Step 6: Apply filters and get top candidates
      const filteredCandidates = this.applyFilters(initialCandidates, request.filters);
      const enhancedCandidates = await this.applyEnhancedKeywordScoring(request.originalQuery, filteredCandidates);
      
      // Step 7: Sort and take only top 9 for detailed fetching
      const topCandidates = enhancedCandidates
        .sort((a, b) => (b.vectorScore + b.keywordScore) - (a.vectorScore + a.keywordScore))
        .slice(0, 9); // Only take top 9!

      console.log(`   🎯 Selected top ${topCandidates.length} candidates for detailed enrichment`);

      // Step 8: NOW fetch detailed enriched data for only the top 9
      const topPlaceIds = topCandidates.map(c => c.placeId);
      const enrichedRestaurants = await this.fetchRestaurantDetails(topPlaceIds);

      // Step 9: Merge enriched data back into candidates
      const finalCandidates = topCandidates.map(candidate => {
        const enrichedData = enrichedRestaurants.find(r => (r.placeId || r.place_id) === candidate.placeId);
        return {
          ...candidate,
          ...enrichedData,
          reviews: enrichedData?.reviews || [],
          operatingHours: enrichedData?.openingHours ? this.formatOpeningHours(enrichedData.openingHours) : undefined,
          parkingInfo: enrichedData?.parkingInfo || undefined,
        };
      });

      console.log('✅ Hybrid search completed: top 9 candidates enriched');
      return finalCandidates;

    } catch (error) {
      console.error('❌ Hybrid search failed:', error);
      throw error;
    }
  }

  /**
   * Perform vector search using Pinecone
   */
  private async performVectorSearch(query: string, topK: number): Promise<VectorSearchResult[]> {
    try {
      // Generate embedding for the query
      const embedding = await this.generateEmbedding(query);
      
      // Query Pinecone
      const index = this.pinecone.index('chowgpt-restaurants');
      const queryResponse = await index.query({
        vector: embedding,
        topK,
        includeMetadata: true,
        includeValues: false,
      });

      console.log(`   🔍 Pinecone returned ${queryResponse.matches?.length || 0} matches`);
      
      // Debug: Log first match metadata to see structure
      if (queryResponse.matches && queryResponse.matches.length > 0) {
        console.log('   🔍 Sample match metadata:', queryResponse.matches[0].metadata);
      }

      // Convert to our format - using restaurant_id from metadata
      const results = queryResponse.matches?.map(match => ({
        placeId: match.metadata?.restaurant_id as string || match.metadata?.place_id as string,
        vectorScore: match.score ? this.calculateGenerousVectorScore(match.score) : 20,
        chunkType: match.metadata?.chunk_type as string,
        chunkContent: match.metadata?.content as string,
      })) || [];

      console.log(`   📊 Converted ${results.length} vector results`);
      console.log('   📍 Sample placeIds:', results.slice(0, 3).map(r => r.placeId));

      return results;

    } catch (error) {
      console.error('❌ Vector search failed:', error);
      throw error;
    }
  }

  /**
   * Generate embedding using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('❌ Embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Extract unique restaurant place IDs from vector results
   */
  private extractUniqueRestaurants(vectorResults: VectorSearchResult[]): string[] {
    const placeIds = new Set<string>();
    
    vectorResults.forEach(result => {
      if (result.placeId) {
        placeIds.add(result.placeId);
      }
    });

    return Array.from(placeIds);
  }

  /**
   * Fetch restaurant details from Supabase with full enriched data - ULTRA-FAST BATCH VERSION  
   */
  private async fetchRestaurantDetails(placeIds: string[]): Promise<any[]> {
    try {
      console.log(`   🔍 Batch fetching enriched details for ${placeIds.length} place IDs`);
      console.log('   📍 Place IDs to fetch:', placeIds.slice(0, 5)); // Show first 5
      
      const validPlaceIds = placeIds.filter(placeId => placeId && placeId !== 'undefined');
      
      // BATCH FETCH 1: Get all restaurants in single call 
      const restaurants = await supabaseService.getRestaurantsByIds(validPlaceIds);
      console.log(`   ✅ Batch fetched ${restaurants.length} restaurants`);

      // BATCH FETCH 2: Get all reviews in single call
      const reviewsMap = await supabaseService.getReviewsForRestaurants(validPlaceIds, 7);
      console.log(`   ✅ Batch fetched reviews for ${reviewsMap.size} restaurants`);

      // Combine restaurant data with reviews
      const enrichedRestaurants = restaurants.map(restaurant => {
        const placeId = restaurant.placeId;
        const reviews = reviewsMap.get(placeId) || [];
        
        console.log(`   📝 Found ${reviews.length} reviews for ${restaurant.title}`);

        return {
          ...restaurant,
          reviews,
          // Additional rich fields (may not be in base RestaurantResponse type)
          reviewsTags: (restaurant as any).reviewsTags || [],
          popularTimes: (restaurant as any).popularTimes || {},
          price: restaurant.priceLevel || (restaurant as any).price || '',
          phone: restaurant.phone || '',
          website: restaurant.website || '',
          neighborhood: restaurant.neighborhood || '',
        };
      });

      console.log(`   📋 Successfully enriched ${enrichedRestaurants.length} restaurants with batch calls`);
      return enrichedRestaurants;
    } catch (error) {
      console.error('❌ Failed to batch fetch restaurant details:', error);
      return [];
    }
  }

  /**
   * Fallback: Get all restaurants for keyword search
   */
  private async getAllRestaurantsForKeywordSearch(limit: number): Promise<any[]> {
    try {
      // Get restaurants from database directly for keyword search fallback
      const restaurants = await supabaseService.getRestaurants(
        undefined, // no query filter
        undefined, // no filters
        limit,
        0 // offset
      );

      return restaurants.restaurants.map((restaurant: any) => ({
        ...restaurant,
        reviews: [], // Empty for now
      }));

    } catch (error) {
      console.error('❌ Failed to get restaurants for keyword search:', error);
      return [];
    }
  }

  /**
   * Calculate keyword search scores
   */
  private async calculateKeywordScores(query: string, restaurants: any[]): Promise<Map<string, number>> {
    const scores = new Map<string, number>();
    const queryTerms = query.toLowerCase().split(/\s+/);

    console.log(`   🔤 Calculating keyword scores for ${restaurants.length} restaurants`);
    console.log(`   📝 Query terms: [${queryTerms.join(', ')}]`);

    restaurants.forEach(restaurant => {
      let score = 0;
      const searchableText = this.createSearchableText(restaurant).toLowerCase();
      const restaurantName = restaurant.title || restaurant.name || '';
      const categories = restaurant.categories || restaurant.cuisine || [];
      const description = restaurant.description || '';

      // Enhanced keyword matching with flexibility
      queryTerms.forEach(term => {
        // Create variations of the term for better matching
        const termVariations = [
          term,
          term.endsWith('s') ? term.slice(0, -1) : term + 's', // Handle plural/singular
          term.endsWith('ies') ? term.slice(0, -3) + 'y' : '', // Handle -ies endings
          term.endsWith('es') ? term.slice(0, -2) : '', // Handle -es endings
        ].filter(Boolean);

        let termMatched = false;
        
        for (const variation of termVariations) {
          if (searchableText.includes(variation)) {
            // Higher weight for matches in name or cuisine
            if (restaurantName.toLowerCase().includes(variation)) {
              score += 10;
              termMatched = true;
              break;
            } else if (categories.some((c: string) => c.toLowerCase().includes(variation))) {
              score += 8;
              termMatched = true;
              break;
            } else if (description.toLowerCase().includes(variation)) {
              score += 5;
              termMatched = true;
              break;
            } else {
              score += 2;
              termMatched = true;
              break;
            }
          }
        }
      });

      // Better normalization to 0-100 scale with higher variance
      const normalizedScore = Math.min(100, Math.round(score * 3.5)); // More generous scaling
      const placeId = restaurant.placeId || restaurant.place_id;
      scores.set(placeId, normalizedScore);
      
      if (normalizedScore > 0) {
        console.log(`   ✅ "${restaurantName}": keyword score ${normalizedScore}`);
      }
    });

    console.log('   📈 Keyword scoring completed');
    return scores;
  }

  /**
   * Create enriched searchable text from restaurant data including reviews and features
   */
  private createSearchableText(restaurant: any): string {
    // Handle location object properly
    let locationText = '';
    if (restaurant.location) {
      if (typeof restaurant.location === 'string') {
        locationText = restaurant.location;
      } else if (restaurant.address) {
        locationText = restaurant.address;
      }
    } else if (restaurant.address) {
      locationText = restaurant.address;
    }

    // Extract opening hours text
    const openingHoursText = restaurant.openingHours
      ?.map((hour: any) => `${hour.day} ${hour.hours}`)
      .join(' ') || '';

    // Extract reviews text (first 10 reviews)
    const reviewsText = restaurant.reviews
      ?.slice(0, 10)
      .map((r: any) => r.text)
      .filter(Boolean)
      .join(' ') || '';

    // Extract review tags
    const reviewTagsText = restaurant.reviewsTags?.join(' ') || '';

    // Extract popular times info
    const popularTimesText = restaurant.popularTimes?.peakHours?.join(' ') || '';

    // Build comprehensive searchable text with all rich data
    const parts = [
      // Basic info
      restaurant.title || restaurant.name,
      restaurant.description,
      restaurant.categories?.join(' ') || restaurant.cuisine?.join(' '),
      restaurant.category,
      restaurant.categoryName,
      
      // Location info
      locationText,
      restaurant.neighborhood,
      
      // Rich contextual data
      reviewsText, // Most important - actual customer experiences
      reviewTagsText, // Important tags from reviews
      openingHoursText, // For "open late" type queries
      popularTimesText, // Peak hours info
      
      // Additional features
      restaurant.phone,
      restaurant.website,
      restaurant.price,
      restaurant.priceLevel,
    ].filter(Boolean);

    return parts.join(' ');
  }

  /**
   * Combine vector and keyword scores
   */
  private combineScores(
    vectorResults: VectorSearchResult[],
    restaurantDetails: any[],
    keywordScores: Map<string, number>
  ): RestaurantCandidate[] {
    
    // Create a map of best vector scores per restaurant
    const bestVectorScores = new Map<string, number>();
    vectorResults.forEach(result => {
      const currentBest = bestVectorScores.get(result.placeId) || 0;
      if (result.vectorScore > currentBest) {
        bestVectorScores.set(result.placeId, result.vectorScore);
      }
    });

    // Build combined results with correct field mapping
    return restaurantDetails.map(restaurant => ({
      placeId: restaurant.placeId || restaurant.place_id,
      name: restaurant.title || restaurant.name,
      cuisine: restaurant.categories || restaurant.cuisine || [],
      location: restaurant.location || restaurant.address || '',
      description: restaurant.description || '',
      rating: restaurant.rating || restaurant.total_score,
      priceLevel: restaurant.priceLevel || restaurant.price_level,
      features: restaurant.categories || [], // Use categories as features
      vectorScore: bestVectorScores.get(restaurant.placeId || restaurant.place_id) || 0,
      keywordScore: keywordScores.get(restaurant.placeId || restaurant.place_id) || 0,
      reviews: restaurant.reviews || [],
      operatingHours: restaurant.openingHours ? this.formatOpeningHours(restaurant.openingHours) : restaurant.operating_hours,
      parkingInfo: restaurant.parking_info || 'Not specified',
    }));
  }

  /**
   * Format opening hours for display
   */
  private formatOpeningHours(openingHours: any[]): string {
    if (!openingHours || openingHours.length === 0) return 'Hours not available';
    
    return openingHours
      .map(day => `${day.day}: ${day.hours}`)
      .join(', ');
  }

  /**
   * Apply enhanced keyword scoring (simplified re-ranking)
   */
  private async applyEnhancedKeywordScoring(query: string, candidates: RestaurantCandidate[]): Promise<RestaurantCandidate[]> {
    try {
      // Simple enhanced scoring based on query relevance
      const queryTerms = query.toLowerCase().split(/\s+/);
      
      return candidates.map(candidate => {
        let enhancementScore = 0;
        const searchText = this.createSearchableText(candidate).toLowerCase();
        
        // Count exact phrase matches
        if (searchText.includes(query.toLowerCase())) {
          enhancementScore += 20;
        }
        
        // Count term co-occurrence
        let termMatches = 0;
        queryTerms.forEach(term => {
          if (searchText.includes(term)) {
            termMatches++;
          }
        });
        
        enhancementScore += (termMatches / queryTerms.length) * 15;
        
        // Apply enhancement to keyword score
        const enhancedKeywordScore = Math.min(100, candidate.keywordScore + enhancementScore);
        
        return {
          ...candidate,
          keywordScore: Math.round(enhancedKeywordScore),
        };
      });

    } catch (error) {
      console.error('❌ Enhanced keyword scoring failed:', error);
      // Return original candidates if enhancement fails
      return candidates;
    }
  }

  /**
   * Apply filters to results
   */
  private applyFilters(candidates: RestaurantCandidate[], filters?: SearchFilters): RestaurantCandidate[] {
    if (!filters) return candidates;

    return candidates.filter(candidate => {
      // Cuisine filter
      if (filters.cuisine && filters.cuisine.length > 0) {
        const hasMatchingCuisine = filters.cuisine.some(filterCuisine =>
          candidate.cuisine.some(candidateCuisine =>
            candidateCuisine.toLowerCase().includes(filterCuisine.toLowerCase())
          )
        );
        if (!hasMatchingCuisine) return false;
      }

      // Price range filter
      if (filters.priceRange) {
        if (filters.priceRange.min && candidate.priceLevel && candidate.priceLevel < filters.priceRange.min) {
          return false;
        }
        if (filters.priceRange.max && candidate.priceLevel && candidate.priceLevel > filters.priceRange.max) {
          return false;
        }
      }

      // Rating filter
      if (filters.rating && candidate.rating && candidate.rating < filters.rating) {
        return false;
      }

      // Location filter (simple string matching)
      if (filters.location) {
        if (!candidate.location.toLowerCase().includes(filters.location.toLowerCase())) {
          return false;
        }
      }

      // Features filter
      if (filters.features && filters.features.length > 0) {
        const hasMatchingFeature = filters.features.some(filterFeature =>
          candidate.features.some(candidateFeature =>
            candidateFeature.toLowerCase().includes(filterFeature.toLowerCase())
          )
        );
        if (!hasMatchingFeature) return false;
      }

      return true;
    });
  }

  /**
   * Health check for hybrid search service
   */
  async checkHealth(): Promise<{ status: string; message?: string }> {
    try {
      // Test Pinecone connection
      const index = this.pinecone.index('chowgpt-restaurants');
      await index.describeIndexStats();

      // Test embedding generation
      await this.generateEmbedding('test query');

      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fallback: Keyword-only search when vector search fails
   */
  private async performKeywordOnlySearch(query: string, limit: number): Promise<RestaurantCandidate[]> {
    try {
      const restaurants = await this.getAllRestaurantsForKeywordSearch(limit * 2);
      const keywordScores = await this.calculateKeywordScores(query, restaurants);
      
      return restaurants
        .map(restaurant => ({
          placeId: restaurant.placeId || restaurant.place_id,
          name: restaurant.title || restaurant.name,
          cuisine: restaurant.categories || restaurant.cuisine || [],
          location: restaurant.address || '',
          description: restaurant.description || '',
          rating: restaurant.rating || 0,
          priceLevel: restaurant.priceLevel || 0,
          features: [],
          vectorScore: 0, // No vector score in fallback
          keywordScore: keywordScores.get(restaurant.placeId || restaurant.place_id) || 0,
          reviews: [],
          operatingHours: undefined,
          parkingInfo: undefined,
        }))
        .sort((a, b) => b.keywordScore - a.keywordScore)
        .slice(0, limit);
    } catch (error) {
      console.error('❌ Keyword-only search failed:', error);
      return [];
    }
  }

  /**
   * Fetch basic restaurant info (without reviews) for initial ranking - BATCH VERSION
   */
  private async fetchBasicRestaurantInfo(placeIds: string[]): Promise<any[]> {
    try {
      console.log(`   🔍 Batch fetching basic info for ${placeIds.length} restaurants`);
      
      const validPlaceIds = placeIds.filter(placeId => placeId && placeId !== 'undefined');
      
      // BATCH FETCH - Single database call instead of N parallel calls
      const restaurants = await supabaseService.getRestaurantsByIds(validPlaceIds);

      console.log(`   ✅ Batch fetched ${restaurants.length} basic restaurant info`);
      return restaurants;
    } catch (error) {
      console.error('❌ Failed to batch fetch basic restaurant info:', error);
      return [];
    }
  }

  /**
   * Calculate generous but objective vector scores
   * Maps cosine similarity to intuitive 0-100 scale:
   * 0.4 → 50, 0.5 → 65, 0.6 → 78, 0.7 → 88, 0.8 → 94, 0.9 → 98
   */
  private calculateGenerousVectorScore(score: number): number {
    // Generous polynomial scaling for better user perception
    // Still objective: poor matches get low scores, good matches get high scores
    const clampedScore = Math.max(0.3, Math.min(1.0, score));
    
    // Polynomial formula: creates generous curve while remaining objective
    const normalized = (clampedScore - 0.3) / 0.7; // Normalize to 0-1 range
    const generous = Math.pow(normalized, 0.6); // Gentle curve - not too aggressive
    
    // Map to 50-98 range (avoid perfect 100 to maintain objectivity)
    const finalScore = Math.round(50 + (generous * 48));
    
    console.log(`   🎯 Vector score: ${score.toFixed(3)} → ${finalScore} (generous but objective)`);
    return Math.max(50, Math.min(98, finalScore));
  }
} 