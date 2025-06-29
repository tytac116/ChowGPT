import OpenAI from 'openai';
import { z } from 'zod';
import { RestaurantCandidate } from './hybridSearch';

// Structured output schema for restaurant scoring
const RestaurantScoreSchema = z.object({
  placeId: z.string(),
  score: z.number().min(0).max(100).describe('Match score 0-100'),
  reasoning: z.string().max(60).describe('Max 10 words reasoning'),
  matchedCriteria: z.array(z.string()).describe('List criteria matched'),
  missingCriteria: z.array(z.string()).describe('List criteria missing'),
  keyStrengths: z.array(z.string()).describe('Top 3 strengths'),
});

const BatchScoringSchema = z.object({
  restaurantScores: z.array(RestaurantScoreSchema),
});

type RestaurantScore = z.infer<typeof RestaurantScoreSchema>;
type BatchScoringResult = z.infer<typeof BatchScoringSchema>;

export interface AIScoringRequest {
  restaurants: RestaurantCandidate[];
  originalQuery: string;
}

export interface ScoredRestaurant extends RestaurantCandidate {
  llmScore: number;
  llmReasoning: string;
  matchedCriteria: string[];
  missingCriteria: string[];
  keyStrengths: string[];
}

export class AIScoringService {
  private openai: OpenAI;
  private readonly BATCH_SIZE = 9; // Process all 9 restaurants in one batch for maximum speed

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  /**
   * Score restaurants using LLM reasoning
   */
  async scoreRestaurants(request: AIScoringRequest): Promise<ScoredRestaurant[]> {
    try {
      console.log(`🤖 Starting AI scoring for ${request.restaurants.length} restaurants...`);

      const scoredRestaurants: ScoredRestaurant[] = [];
      
      // Process restaurants in batches for better performance
      for (let i = 0; i < request.restaurants.length; i += this.BATCH_SIZE) {
        const batch = request.restaurants.slice(i, i + this.BATCH_SIZE);
        console.log(`   Processing batch ${Math.floor(i / this.BATCH_SIZE) + 1}/${Math.ceil(request.restaurants.length / this.BATCH_SIZE)} (${batch.length} restaurants)`);
        
        const batchScores = await this.scoreBatch(batch, request.originalQuery);
        scoredRestaurants.push(...batchScores);
      }

      console.log(`✅ AI scoring completed for all ${scoredRestaurants.length} restaurants`);
      return scoredRestaurants;

    } catch (error) {
      console.error('❌ AI scoring failed:', error);
      throw new Error(`AI scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Score a batch of restaurants
   */
  private async scoreBatch(restaurants: RestaurantCandidate[], originalQuery: string): Promise<ScoredRestaurant[]> {
    try {
      console.log(`🤖 Scoring batch of ${restaurants.length} restaurants for query: "${originalQuery}"`);
      
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildBatchPrompt(restaurants, originalQuery);

      console.log(`📝 User prompt length: ${userPrompt.length} characters`);
      console.log(`🔧 Making OpenAI API call...`);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'score_restaurants',
            description: 'Score restaurants based on how well they match the user query',
            parameters: {
              type: 'object',
              properties: {
                restaurantScores: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      placeId: { type: 'string' },
                      score: { type: 'number', minimum: 0, maximum: 100 },
                      reasoning: { type: 'string' },
                      matchedCriteria: { type: 'array', items: { type: 'string' } },
                      missingCriteria: { type: 'array', items: { type: 'string' } },
                      keyStrengths: { type: 'array', items: { type: 'string' } },
                    },
                    required: ['placeId', 'score', 'reasoning', 'matchedCriteria', 'missingCriteria', 'keyStrengths']
                  }
                }
              },
              required: ['restaurantScores']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'score_restaurants' } },
        temperature: 0.1, // Lower temperature for more consistent scoring
        max_tokens: 2500, // Increased for batch processing
      });

      console.log(`✅ OpenAI API call completed`);
      console.log(`📋 Response choices:`, response.choices?.length || 0);
      
      const toolCall = response.choices[0]?.message?.tool_calls?.[0];
      console.log(`🔧 Tool calls found:`, response.choices[0]?.message?.tool_calls?.length || 0);
      
      if (!toolCall || toolCall.type !== 'function') {
        console.error('❌ No function call returned from LLM');
        console.error('❌ Response message:', response.choices[0]?.message);
        throw new Error('No function call returned from LLM');
      }

      console.log(`📝 Function arguments length:`, toolCall.function.arguments.length);
      const parsedResult = JSON.parse(toolCall.function.arguments) as BatchScoringResult;
      console.log(`📊 Parsed ${parsedResult.restaurantScores?.length || 0} restaurant scores`);
      
      // Combine the scores with the original restaurant data
      return this.combineScoredData(restaurants, parsedResult.restaurantScores);

    } catch (error) {
      console.error('❌ Batch scoring failed:', error);
      console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Return restaurants with fallback scores if LLM fails
      return restaurants.map(restaurant => ({
        ...restaurant,
        llmScore: Math.round((restaurant.vectorScore + restaurant.keywordScore) / 2), // Fallback score
        llmReasoning: 'AI scoring temporarily unavailable - using hybrid score',
        matchedCriteria: [],
        missingCriteria: [],
        keyStrengths: [],
      }));
    }
  }

  /**
   * Build system prompt for very generous restaurant scoring
   */
  private buildSystemPrompt(): string {
    return `Score restaurants (0-100) for query match. Be very generous with good restaurants.

SCALE: 85-100=Great matches, 70-84=Good matches, 55-69=Fair matches, 40-54=Poor matches, 0-39=No match

Be generous! Good restaurants with any relevance should score 70+. Perfect matches score 90+.`;
  }

  /**
   * Build optimized batch prompt with essential restaurant data
   */
  private buildBatchPrompt(restaurants: RestaurantCandidate[], originalQuery: string): string {
    const restaurantData = restaurants.map((restaurant, index) => {
      // Extract first 7 reviews with very condensed information for speed
      const topReviews = restaurant.reviews
        ?.slice(0, 7)
        .filter((r: any) => r.text && r.text.trim().length > 0)
        .map((r: any, i: number) => {
          const reviewText = r.text.trim();
          const condensedText = reviewText.length > 60 ? reviewText.substring(0, 60) + '...' : reviewText;
          return `${r.rating || 'N/A'}/5: "${condensedText}"`;
        })
        .join(' | ') || 'No reviews';

      // Essential info only
      const openingHours = restaurant.operatingHours || 
        ((restaurant as any).openingHours?.map((h: any) => `${h.day}: ${h.hours}`).join(', ')) || 
        'Hours not specified';

      const priceInfo = restaurant.priceLevel || (restaurant as any).price || 'Price not specified';

      return `${index + 1}. ID:${restaurant.placeId} | ${restaurant.name} | ${restaurant.cuisine.join(', ')} | ${restaurant.rating || 'N/A'}/5 (${(restaurant as any).reviewsCount || 0}r) | ${priceInfo} | ${restaurant.features.join(', ')} | Reviews: ${topReviews}`;
    }).join('\n');

    return `Query: "${originalQuery}"

${restaurantData}

Score each (0-100). Be generous. Reason: max 10 words.`;
  }

  /**
   * Combine scored data with original restaurant data
   */
  private combineScoredData(restaurants: RestaurantCandidate[], scores: RestaurantScore[]): ScoredRestaurant[] {
    return restaurants.map(restaurant => {
      const score = scores.find(s => s.placeId === restaurant.placeId);
      
      if (!score) {
        console.warn(`⚠️ No AI score found for restaurant ${restaurant.placeId}`);
        return {
          ...restaurant,
          llmScore: Math.round((restaurant.vectorScore + restaurant.keywordScore) / 2),
          llmReasoning: 'AI scoring data not available',
          matchedCriteria: [],
          missingCriteria: [],
          keyStrengths: [],
        };
      }

      return {
        ...restaurant,
        llmScore: score.score,
        llmReasoning: score.reasoning,
        matchedCriteria: score.matchedCriteria,
        missingCriteria: score.missingCriteria,
        keyStrengths: score.keyStrengths,
      };
    });
  }

  /**
   * Health check for AI scoring service
   */
  async checkHealth(): Promise<{ status: string; message?: string }> {
    try {
      // Test with a simple scoring request
      const testRestaurant: RestaurantCandidate = {
        placeId: 'test-id',
        name: 'Test Restaurant',
        cuisine: ['Italian'],
        location: 'Cape Town',
        description: 'A cozy Italian restaurant',
        rating: 4.5,
        priceLevel: 2,
        features: ['outdoor seating'],
        vectorScore: 85,
        keywordScore: 75,
        reviews: [
          { text: 'Great pizza and friendly staff', rating: 5 }
        ],
        operatingHours: '9:00 AM - 10:00 PM',
        parkingInfo: 'Street parking available',
      };

      const result = await this.scoreBatch([testRestaurant], 'good Italian restaurant');
      
      if (result.length > 0 && result[0].llmScore > 0) {
        return { status: 'healthy' };
      } else {
        return { status: 'unhealthy', message: 'AI scoring returned invalid results' };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 