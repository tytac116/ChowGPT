import { Router } from 'express';
import { supabaseService } from '../../services/supabaseClient';
import { asyncHandler, createNotFoundError } from '../../utils/errorHandler';
import { 
  validateSearchFilters, 
  validatePagination,
  enhancedRestaurantSearchSchema,
  validateRestaurantId,
  validateRestaurantIdParam,
  EnhancedRestaurantSearchQuery 
} from '../../utils/validation';
import { SearchResult } from '../../types';
import { Request, Response } from 'express';

const router = Router();

// Enhanced GET /restaurants - Step 2 implementation
// Supports enhanced=true parameter to use new format
router.get('/', asyncHandler(async (req, res) => {
  const enhanced = req.query.enhanced === 'true';
  
  if (enhanced) {
    // Use enhanced validation and service for Step 2
    try {
      const validatedQuery = enhancedRestaurantSearchSchema.parse({
        ...req.query,
        rating: req.query.rating ? parseFloat(req.query.rating as string) : undefined,
        priceLevel: req.query.priceLevel ? 
          (Array.isArray(req.query.priceLevel) ? req.query.priceLevel : [req.query.priceLevel]) : 
          undefined,
        openNow: req.query.openNow === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      });

      const result = await supabaseService.getRestaurantsEnhanced(
        validatedQuery.query,
        {
          category: validatedQuery.category,
          neighborhood: validatedQuery.neighborhood,
          city: validatedQuery.city,
          priceLevel: validatedQuery.priceLevel,
          rating: validatedQuery.rating,
          openNow: validatedQuery.openNow,
        },
        validatedQuery.limit,
        validatedQuery.offset,
        validatedQuery.sortBy
      );

      res.json({
        success: true,
        data: result,
        message: 'Restaurants fetched successfully (Enhanced)',
      });
    } catch (error) {
      console.error('Enhanced search validation error:', error);
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error instanceof Error ? error.message : 'Unknown validation error'
      });
    }
  } else {
    // Use existing validation and service for backward compatibility
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Validate pagination
    const pagination = validatePagination({ limit, offset });
    
    // Extract filters from query parameters
    const filters = {
      category: req.query.category as string,
      city: req.query.city as string,
      neighborhood: req.query.neighborhood as string,
      priceLevel: req.query.priceLevel ? 
        (Array.isArray(req.query.priceLevel) ? req.query.priceLevel : [req.query.priceLevel]) as string[] : 
        undefined,
      rating: req.query.rating ? parseFloat(req.query.rating as string) : undefined,
    };

    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    );

    try {
      // Fetch restaurants from database
      const { restaurants, total } = await supabaseService.getRestaurants(
        query,
        cleanFilters,
        pagination.limit,
        pagination.offset
      );

      const result: SearchResult = {
        restaurants,
        total,
        hasMore: pagination.offset + restaurants.length < total,
        query: query || '',
        filters: cleanFilters,
      };

      res.json(result);
    } catch (error) {
      console.error('Error in restaurants search:', error);
      throw error;
    }
  }
}));



// GET /restaurants/meta/categories - Get all available categories
router.get('/meta/categories', asyncHandler(async (req, res) => {
  try {
    const categories = await supabaseService.getCategories();
    
    res.json({
      categories,
      total: categories.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}));

// GET /restaurants/meta/neighborhoods - Get all available neighborhoods
router.get('/meta/neighborhoods', asyncHandler(async (req, res) => {
  const city = req.query.city as string;
  
  try {
    const neighborhoods = await supabaseService.getNeighborhoods(city);
    
    res.json({
      neighborhoods,
      total: neighborhoods.length,
      city: city || 'all',
    });
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    throw error;
  }
}));

// GET /restaurants/debug/:id - Debug route to test database query
router.get('/debug/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log('🔍 Debug route called with ID:', id);
  
  try {
    // Test basic getRestaurantById first
    const basicRestaurant = await supabaseService.getRestaurantById(id);
    console.log('📊 Basic restaurant result:', !!basicRestaurant);
    
    // Test our getDetailedRestaurant method with detailed debugging
    console.log('🔍 Starting detailed restaurant method...');
    const detailedRestaurant = await supabaseService.getDetailedRestaurant(id);
    console.log('📊 Detailed restaurant result:', !!detailedRestaurant);
    
    res.json({
      id,
      basicRestaurantFound: !!basicRestaurant,
      detailedRestaurantFound: !!detailedRestaurant,
      basicRestaurant: basicRestaurant ? { title: basicRestaurant.title, placeId: basicRestaurant.placeId } : null,
      detailedRestaurant: detailedRestaurant ? { title: detailedRestaurant.title, id: detailedRestaurant.id } : null
    });
  } catch (error) {
    console.error('🚨 Debug route error:', error);
    res.status(500).json({ error: 'Debug failed', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /restaurants/:id - Get detailed restaurant information (Step 3)
router.get('/:id', validateRestaurantIdParam, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const searchQuery = req.query.q as string;

    console.log(`GET /api/restaurants/${id}`, {
      params: req.params,
      query: req.query,
      headers: {
        host: req.get('host'),
        'user-agent': req.get('user-agent'),
        accept: req.get('accept')
      }
    });

    const startTime = Date.now();
    const restaurant = await supabaseService.getDetailedRestaurant(id, searchQuery);
    
    if (!restaurant) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: `Restaurant with ID '${id}' not found`,
        timestamp: new Date().toISOString()
      });
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ Detailed restaurant retrieved in ${responseTime}ms:`, {
      id: restaurant.id,
      title: restaurant.title,
      totalScore: restaurant.totalScore,
      reviewsCount: restaurant.reviewsCount,
      reviewsReturned: restaurant.reviews.length,
      imagesCount: restaurant.images.length,
      hasAiExplanation: !!restaurant.aiMatchExplanation
    });

    return res.json(restaurant);
  } catch (error) {
    console.error('Error in GET /api/restaurants/:id:', error);
    return res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch restaurant details',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /restaurants/:id/reviews - Get reviews for a specific restaurant
router.get('/:id/reviews', asyncHandler(async (req, res) => {
  const placeId = validateRestaurantId(req.params.id);
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    const result = await supabaseService.getReviewsForRestaurant(placeId, limit, offset);
    
    if (!result.reviews || result.reviews.length === 0) {
      throw createNotFoundError(`No reviews found for restaurant with ID '${placeId}'`);
    }

    res.json(result);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}));

export default router; 