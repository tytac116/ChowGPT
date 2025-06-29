import OpenAI from 'openai';
import { z } from 'zod';

// Structured output schema for prompt rewriting
const PromptRewriteSchema = z.object({
  rewrittenQuery: z.string().describe('The optimized query for semantic vector search'),
  reasoning: z.string().describe('Brief explanation of why the query was rewritten'),
  keyTerms: z.array(z.string()).describe('Key terms extracted for keyword search'),
});

type PromptRewriteResult = z.infer<typeof PromptRewriteSchema>;

export class PromptRewriterService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Rewrite user query for optimal vector search performance
   */
  async rewriteForVectorSearch(originalQuery: string): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(originalQuery);

      // Use structured output with function calling
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        functions: [{
          name: 'rewrite_query',
          description: 'Rewrite the user query for optimal vector search',
          parameters: {
            type: 'object',
            properties: {
              rewrittenQuery: {
                type: 'string',
                description: 'The optimized query for semantic vector search'
              },
              reasoning: {
                type: 'string',
                description: 'Brief explanation of why the query was rewritten'
              },
              keyTerms: {
                type: 'array',
                items: { type: 'string' },
                description: 'Key terms extracted for keyword search'
              }
            },
            required: ['rewrittenQuery', 'reasoning', 'keyTerms']
          }
        }],
        function_call: { name: 'rewrite_query' },
        temperature: 0.3,
        max_tokens: 200,
      });

      // Parse the structured response
      const functionCall = response.choices[0]?.message?.function_call;
      if (!functionCall) {
        throw new Error('No function call returned');
      }

      const parsedResult = JSON.parse(functionCall.arguments) as PromptRewriteResult;
      
      console.log(`📝 Query rewritten: "${originalQuery}" → "${parsedResult.rewrittenQuery}"`);
      console.log(`💭 Reasoning: ${parsedResult.reasoning}`);
      
      return parsedResult.rewrittenQuery;

    } catch (error) {
      console.error('❌ Prompt rewriting failed:', error);
      // Fallback to original query if rewriting fails
      console.log('⚠️ Using original query as fallback');
      return originalQuery;
    }
  }

  /**
   * Build system prompt for query optimization
   */
  private buildSystemPrompt(): string {
    return `You are an expert at optimizing restaurant search queries for semantic vector databases.

Your task is to rewrite user queries to maximize semantic matching with restaurant data while preserving the user's intent.

OPTIMIZATION STRATEGIES:
1. Expand implicit requirements (e.g., "cheap" → "affordable budget-friendly")
2. Add context-specific terms (e.g., "date night" → "romantic atmosphere intimate dining")
3. Include synonyms and related terms (e.g., "seafood" → "seafood fish shellfish ocean")
4. Make location context explicit (e.g., "near water" → "waterfront harbor ocean view")
5. Expand cuisine types (e.g., "Asian" → "Asian Chinese Japanese Thai Korean")
6. Include ambiance descriptors (e.g., "casual" → "casual relaxed informal")

PRESERVE:
- Original intent and requirements
- Specific constraints (price, location, dietary needs)
- Emotional context (celebration, date, family, business)

ENHANCE FOR SEMANTIC SEARCH:
- Use descriptive adjectives
- Include related concepts and synonyms
- Add contextual terms that appear in reviews
- Make implicit preferences explicit

Keep the rewritten query natural and under 100 words.`;
  }

  /**
   * Build user prompt with the original query
   */
  private buildUserPrompt(originalQuery: string): string {
    return `Please rewrite this restaurant search query for optimal semantic vector search:

Original Query: "${originalQuery}"

Rewrite it to maximize semantic matching while preserving the user's intent. Include relevant synonyms, expand implicit requirements, and add contextual terms that would appear in restaurant descriptions and reviews.`;
  }

  /**
   * Extract key terms for keyword search (fallback method)
   */
  async extractKeyTerms(query: string): Promise<string[]> {
    try {
      const systemPrompt = `Extract key terms from restaurant search queries for keyword matching.
Focus on:
- Cuisine types
- Food items
- Location names
- Price indicators
- Ambiance descriptors
- Specific features

Return 5-10 most important terms as a comma-separated list.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extract key terms from: "${query}"` },
        ],
        temperature: 0.3,
        max_tokens: 100,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content');
      }

      // Simple parsing - split by commas and clean up
      const terms = content
        .toLowerCase()
        .split(',')
        .map((term: string) => term.trim())
        .filter((term: string) => term.length > 2)
        .slice(0, 10);

      return terms;

    } catch (error) {
      console.error('❌ Key term extraction failed:', error);
      // Fallback to simple word extraction
      return query.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2)
        .slice(0, 5);
    }
  }

  /**
   * Health check for the prompt rewriter service
   */
  async checkHealth(): Promise<{ status: string; message?: string }> {
    try {
      // Test with a simple query
      const testQuery = 'good pizza place';
      const result = await this.rewriteForVectorSearch(testQuery);
      
      if (result && result.length > 0) {
        return { status: 'healthy' };
      } else {
        return { status: 'unhealthy', message: 'Empty response from LLM' };
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
} 