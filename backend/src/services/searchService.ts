import { PromptRewriterService } from './promptRewriter';
import { HybridSearchService } from './hybridSearch';
import { AIScoringService } from './aiScoring';

export interface SearchFilters {
  cuisine?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  location?: string;
  rating?: number;
  features?: string[];
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  limit?: number;
}

export interface RestaurantSearchResult {
  placeId: string;
  name: string;
  cuisine: string[];
  location: string;
  description?: string;
  rating?: number;
  priceLevel?: number;
  features: string[];
  aiMatchScore: number;
  vectorScore: number;
  keywordScore: number;
  llmScore: number;
  llmReasoning: string;
  reviewSummary: string;
  operatingHours?: string;
  parkingInfo?: string;
}

export interface SearchResults {
  restaurants: any[];
  searchMetadata: {
    originalQuery: string;
    rewrittenQuery: string;
    searchSteps: string[];
    totalProcessingTime: number;
  };
}

export class SearchService {
  private promptRewriter: PromptRewriterService;
  private hybridSearch: HybridSearchService;
  private aiScoring: AIScoringService;

  constructor() {
    this.promptRewriter = new PromptRewriterService();
    this.hybridSearch = new HybridSearchService();
    this.aiScoring = new AIScoringService();
  }

  /**
   * Main search method implementing the 7-step process
   */
  async searchRestaurants(request: SearchRequest): Promise<SearchResults> {
    const startTime = Date.now();
    const searchSteps: string[] = [];

    try {
      console.log('🚀 Starting AI-powered search pipeline...');

      // Step 1: Prompt Rewriting
      console.log('📝 Step 1: Rewriting search prompt for optimal vector retrieval...');
      const rewriteStart = Date.now();
      const rewrittenQuery = await this.promptRewriter.rewriteForVectorSearch(request.query);
      searchSteps.push(`Prompt rewritten (${Date.now() - rewriteStart}ms)`);
      console.log(`   Original: "${request.query}"`);
      console.log(`   Rewritten: "${rewrittenQuery}"`);

      // Step 2 & 3: Hybrid Search + BM25 Re-ranking
      console.log('🔍 Step 2-3: Executing hybrid search with BM25 re-ranking...');
      const hybridStart = Date.now();
      const hybridResults = await this.hybridSearch.executeHybridSearch({
        originalQuery: request.query,
        rewrittenQuery,
        filters: request.filters,
        limit: request.limit || 12,
      });
      searchSteps.push(`Hybrid search completed (${Date.now() - hybridStart}ms)`);
      console.log(`   Found ${hybridResults.length} candidates for AI scoring`);

      // Step 4: AI-based Scoring
      console.log('🤖 Step 4: AI-based restaurant scoring and reasoning...');
      const scoringStart = Date.now();
      const scoredResults = await this.aiScoring.scoreRestaurants({
        restaurants: hybridResults,
        originalQuery: request.query,
      });
      searchSteps.push(`AI scoring completed (${Date.now() - scoringStart}ms)`);

      // Step 5: Final weighted scoring and ranking
      console.log('⚖️  Step 5: Applying weighted final scores...');
      const finalResults = this.calculateFinalScores(scoredResults);

      // Step 6: Sort and limit results
      const sortedResults = finalResults
        .sort((a, b) => b.aiMatchScore - a.aiMatchScore)
        .slice(0, request.limit || 12);

      const totalTime = Date.now() - startTime;
      console.log(`✅ Search pipeline completed in ${totalTime}ms`);

      return {
        restaurants: sortedResults,
        searchMetadata: {
          originalQuery: request.query,
          rewrittenQuery,
          searchSteps,
          totalProcessingTime: totalTime,
        },
      };

    } catch (error) {
      console.error('❌ Search pipeline failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate final weighted scores
   * Vector: 20%, Keyword: 15%, LLM: 65%
   */
  private calculateFinalScores(restaurants: any[]): any[] {
    return restaurants.map(restaurant => ({
      ...restaurant,
      aiMatchScore: Math.round(
        (restaurant.vectorScore * 0.2) +
        (restaurant.keywordScore * 0.15) +
        (restaurant.llmScore * 0.65)
      ),
    }));
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    // Simple implementation - can be enhanced with ML later
    const commonSearches = [
      'affordable dinner',
      'romantic restaurant',
      'family friendly',
      'outdoor seating',
      'late night food',
      'breakfast spot',
      'seafood restaurant',
      'vegan options',
      'wine bar',
      'casual dining',
    ];

    return commonSearches
      .filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);
  }

  /**
   * Health check for all search services
   */
  async checkHealth() {
    try {
      const [promptHealth, hybridHealth, aiHealth] = await Promise.all([
        this.promptRewriter.checkHealth(),
        this.hybridSearch.checkHealth(),
        this.aiScoring.checkHealth(),
      ]);

      return {
        status: 'healthy',
        services: {
          promptRewriter: promptHealth.status,
          hybridSearch: hybridHealth.status,
          aiScoring: aiHealth.status,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }
} 