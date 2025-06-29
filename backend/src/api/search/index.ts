import express from 'express';
import { z } from 'zod';
import { SearchService } from '../../services/searchService';
import { errorHandler } from '../../utils/errorHandler';

const router = express.Router();
const searchService = new SearchService();

// Search request validation schema
const SearchRequestSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  filters: z.object({
    cuisine: z.array(z.string()).optional(),
    priceRange: z.object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    }).optional(),
    location: z.string().optional(),
    rating: z.number().min(0).max(5).optional(),
    features: z.array(z.string()).optional(),
  }).optional(),
  limit: z.number().min(1).max(50).default(9),
});

// Main search endpoint
router.post('/restaurants', async (req, res, next) => {
  try {
    console.log('🔍 Search request received:', { query: req.body.query, filters: req.body.filters });
    
    // Validate request
    const validatedData = SearchRequestSchema.parse(req.body);
    
    // Execute search pipeline
    const startTime = Date.now();
    const searchResults = await searchService.searchRestaurants(validatedData);
    const searchTime = Date.now() - startTime;
    
    console.log(`✅ Search completed in ${searchTime}ms, found ${searchResults.restaurants.length} restaurants`);
    
    // Return results
    res.json({
      success: true,
      data: searchResults,
      metadata: {
        searchTime,
        query: validatedData.query,
        totalResults: searchResults.restaurants.length,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('❌ Search error:', error);
    return next(error);
  }
});

// Search suggestions endpoint (for autocomplete)
router.get('/suggestions', async (req, res, next) => {
  try {
    const query = req.query.q as string;
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }
    
    const suggestions = await searchService.getSearchSuggestions(query);
    res.json({ suggestions });
  } catch (error) {
    console.error('❌ Suggestions error:', error);
    return next(error);
  }
});

// Health check for search service
router.get('/health', async (req, res) => {
  try {
    const health = await searchService.checkHealth();
    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      services: {
        vectorDB: 'unknown',
        llmService: 'unknown',
        keywordSearch: 'unknown',
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 